const { MailListener } = require("mail-listener5");
let paymentsListener, forwardingListener; // Global mail listener instance which can be stopped and started
const logger = require('./logger');
const sendEmail = require('./mailer')
const mailTemplates = require('./mailer_templates')

const User = require('./models/User');
const Trackday = require('./models/Trackday');
const ScheduledMail = require('./models/ScheduledMail');

// Max number of tries to restart listener when encounter an error
const MAX_RESTART_PAYMENTS = 10
const MAX_RESTART_FORWARDING = 10;

let numRestarts_payments = 0
let numRestarts_forwarding = 0;

async function getUser(mail) {
	userEmail = mail.headers.get('reply-to').value[0].address;
	let user = await User.findOne({ 'contact.email': userEmail }).select('-password -refreshToken -__v').exec();
	if (!user) {
		// Try to find user by scraping subject line
		if (process.env.NODE_ENV === 'development') logger.debug({ message: 'Could not find user by email. Attempting to find user by scraping subject line' });
		const fullName = mail.text.match(/Sent From: (.+)/i)[1].toLowerCase();

		// Go thru all users in the DB and attempt to match the scraped full name
		const allUsers = await User.find().select('-password -refreshToken -__v').exec();
		for (const candidateUser of allUsers) {
			if (fullName.includes(candidateUser.firstName) && fullName.includes(candidateUser.lastName)) {
				user = candidateUser;
				break;
			}
		};
	}
	if (user) {
		if (process.env.NODE_ENV === 'development') logger.debug({ message: `User: ${user.firstName} ${user.lastName}` })
	} else {
		logger.error({ message: 'Could not find user to attach E-Transfer payment to' });
	}
	return user;
}

function getAmount(emailText) {
	const receivedAmount = emailText.match(/Amount:\s*\$([0-9,]+\.\d{2})\s*\(CAD\)/i)[1];
	if (process.env.NODE_ENV === 'development') logger.debug({ message: `received $${receivedAmount}` });
	return receivedAmount;
}



// Returns an array of targeted recipients emails for a specified target (Ie. 'May 4, 2026' or 'all').
// If target is invalid, returns [].
async function updateTargetRecipients(target) {
	let result = []
	if (target === 'all') {
		// Get all users
		const allUsers = await User.find().select('contact.email')
		for (let user of allUsers) result.push(user.contact.email)
	} else {
		// Get all Trackdays
		const startOfYear = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of this year
		const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31 end of day
		const allTrackdays = await Trackday.find({ date: { $gte: startOfYear, $lte: endOfYear } }).select('date').populate('members.user', '-password -refreshToken -__v').exec();

		// Match target to a trackday
		const trackdayTarget = allTrackdays.find(td => td.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) === target)
		if (!trackdayTarget) throw new Error(`Failed to find a trackday with target ${target}. Format example: May 4, 2026`)

		// Built array from matched trackday
		for (let member of trackdayTarget.members) result.push(member.user.contact.email)
	}
	return result;
}

// Starts new mail listener instance for payments
function startPaymentsListener() {
	paymentsListener = new MailListener({
		username: process.env.ADMIN_EMAIL,
		password: process.env.ADMIN_EMAIL_PASSWORD,
		host: process.env.ADMIN_EMAIL_HOST,
		port: 993, // imap port
		tls: true,
		connTimeout: 10000, // Default by node-imap
		authTimeout: 5000, // Default by node-imap,
		//debug: console.log, // Or your custom function with only one incoming argument. Default: null
		autotls: 'never', // default by node-imap
		tlsOptions: { rejectUnauthorized: false },
		mailbox: "INBOX/Payments", // mailbox to monitor
		searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved
		markSeen: false, // we manually will mark mail as read since we only do so if processing was successful
		fetchUnreadOnStart: true, // fetch unread emails that are already in the mailbox when the listener starts
		attachments: false, // disable attachment handling
		attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
	});

	paymentsListener.start();

	paymentsListener.on("mail", async function (mail, seqno, attributes) {
		try {
			// Determine the user from the email
			const user = await getUser(mail);
			if (!user) {
				// Move the email to the TODO folder
				paymentsListener.imap.move(attributes.uid, "INBOX/Payments/TODO", (err) => {
					if (err) logger.error({ message: 'Failed to move email to processed folder' });
				});
				return;
			};

			// Determine the e-transfer amount recevied
			let pmtBalance = getAmount(mail.text);

			// Find all trackdays that the user is a member of, etransfer/gate, and have not been paid for
			const userTrackdays = await Trackday.find({
				members: {
					$elemMatch: {
						user: { $eq: user._id },
						paid: false,
						paymentMethod: { $in: ['etransfer', 'gate'] }
					}
				}
			}).populate('members.user', '-password -refreshToken -__v').exec();

			// Note each trackday in userTrackdays has full members array!
			// Build local copy of trackdays we are trying to apply payments to; we select the fields we need ONLY
			let workingTrackdays = []
			userTrackdays.forEach((trackday) => {
				// Find the member entry for this user
				const memberEntry = trackday.members.find((member) => member.user.equals(user.id));
				workingTrackdays.push({
					id: trackday.id,
					ticketPrice: memberEntry.paymentMethod === 'etransfer' ? trackday.ticketPrice.preReg : trackday.ticketPrice.gate,
					paid: memberEntry.paid,
				})
			})

			// Sort the result array by date in ascending order
			workingTrackdays.sort((a, b) => new Date(a.date) - new Date(b.date));

			// Apply payments to as many trackdays as possible
			workingTrackdays.forEach((trackday) => {
				if (pmtBalance >= trackday.ticketPrice) { // we have enough to pay for this trackday
					pmtBalance -= trackday.ticketPrice;
					trackday.paid = true;
				} else { // Out of funds; we paid for all the trackdays we could
					return;
				}
			});


			if (pmtBalance == 0) {
				// Sync local copy with the DB, we applied payments successfully
				workingTrackdays.filter(trackday => trackday.paid).forEach(async (trackday) => {

					const trackdayDB = await Trackday.findById(trackday.id).populate('members.user', '-password -refreshToken -__v').exec();
					const memberEntry = trackdayDB.members.find((member) => member.user.equals(user.id));
					memberEntry.paid = !memberEntry.paid
					logger.info({ message: `E-transfer payment applied for ${memberEntry.user.firstName} ${memberEntry.user.lastName} for trackday on ${trackdayDB.date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' })}` });
					await sendEmail(memberEntry.user.contact.email, "Payment Confirmation", mailTemplates.notifyPaid, {
						name: memberEntry.user.firstName.charAt(0).toUpperCase() + memberEntry.user.firstName.slice(1),
						date: trackdayDB.date.toLocaleString('default', {
							weekday: 'long', month: 'long', day: 'numeric'
						})
					})

					// Remove scheduled mail if it exists
					// TODO: Possible issue if sendOn varies by a few ms, we may not delete the reminder email. Likely non-issue.
					await ScheduledMail.deleteOne({ // Note: MongoDB special behaviour: If you query an array field with a scalar value, MongoDB checks whether the array contains that value.
						to: memberEntry.user.contact.email,
						sendOn: new Date(trackdayDB.date.getTime() - (process.env.DAYS_LOCKOUT * 24 * 60 * 60 * 1000)),
						message: memberEntry.paymentMethod === 'etransfer' ? mailTemplates.paymentReminder_etransfer : mailTemplates.paymentReminder_creditcard
					})

					await trackdayDB.save()
				})

				// Mark the email as read 
				paymentsListener.imap.addFlags(attributes.uid, '\\Seen', (err) => {
					if (err) logger.error({ message: 'Failed to mark email as unread' });
				});

				// Move the email to the processed folder
				paymentsListener.imap.move(attributes.uid, "INBOX/Payments/Processed", (err) => {
					if (err) logger.error({ message: 'Failed to move email to processed folder' });
				});
			} else {
				// Move the email to the TODO folder
				paymentsListener.imap.move(attributes.uid, "INBOX/Payments/TODO", (err) => {
					if (err) logger.error({ message: 'Failed to move email to processed folder' });
				});

				logger.error({ message: `No payments have been applied for ${user.firstName} ${user.lastName}. Remaining balance: $${pmtBalance}` });
			}
		} catch (err) {
			logger.error({ message: `Error processing email: ${err.message}` });
			// Move the email to the TODO folder
			paymentsListener.imap.move(attributes.uid, "INBOX/Payments/TODO", (err) => {
				if (err) logger.error({ message: 'Failed to move email to processed folder' });
			});
		}
	});

	paymentsListener.on("error", function (err) {
		if (numRestarts_payments < MAX_RESTART_PAYMENTS) {
			setTimeout(() => {
				paymentsListener.start();
				numRestarts_payments++;
			}, 5000); // 5 second delay
		} else {
			logger.error({ message: `paymentsListener error: ${err.message}. Failed to restart service` });
		}
	});

	paymentsListener.on("disconnected", function () {
		logger.error({ message: 'imapDisconnected. Attempting to reconnect...' });
		paymentsListener.start(); // attempt to reconnect
	});
}

// Stops the mail listener instance for payments
function stopPaymentsListener() {
	if (paymentsListener) {
		paymentsListener.stop();
		numRestarts_payments = 0; // Reset restart counter
		paymentsListener = null; // Clear the global instance
	}
}

// Starts new mail listener instance for forwarding
function startForwardingListener() {
	forwardingListener = new MailListener({
		username: process.env.ADMIN_EMAIL,
		password: process.env.ADMIN_EMAIL_PASSWORD,
		host: process.env.ADMIN_EMAIL_HOST,
		port: 993, // imap port
		tls: true,
		connTimeout: 10000, // Default by node-imap
		authTimeout: 5000, // Default by node-imap,
		//debug: console.log, // Or your custom function with only one incoming argument. Default: null
		autotls: 'never', // default by node-imap
		tlsOptions: { rejectUnauthorized: false },
		mailbox: "INBOX/API Mailer Records", // mailbox to monitor
		searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved
		markSeen: false, // we manually will mark mail as read since we only do so if processing was successful
		fetchUnreadOnStart: true, // fetch unread emails that are already in the mailbox when the listener starts
		attachments: true, // required to get the metadata for authorizing the email
		attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
	});

	forwardingListener.start();

	forwardingListener.on("mail", async function (mail, seqno, attributes) {
		try {
			// Verify header
			const fromHeader = mail.headers.get("from")?.value?.[0]?.address || mail.from?.[0]?.address;
			if (!fromHeader || fromHeader.toLowerCase() !== "info@ride42.ca") return
			const toHeader = mail.headers.get("to")?.value?.[0]?.address || mail.to?.[0]?.address;
			if (!toHeader || toHeader.toLowerCase() !== "autoforward@ride42.ca") return;

			// Get metadata attachment which contains target and token and load them in.
			const metadataAttachment = mail.attachments?.find(a => a.filename === "mailAllKey.json");
			if (!metadataAttachment) throw new Error("mailAllKey.json attachment missing");
			const metadata = JSON.parse(metadataAttachment.content.toString("utf8"));
			const target = metadata.target;
			const token = metadata.token;

			// Verify and update recipients
			const targetRecipients = await updateTargetRecipients(target);


			// Verify token
			if (token !== process.env.EMAIL_FORWARD_TOKEN) throw new Error(`Invalid token.`);

			const sendDate = new Date(Date.now() + 30 * 60 * 1000);
			const scheduledMail = new ScheduledMail({
				sendOn: sendDate,
				to: targetRecipients,
				params: { target: target },
				subject: mail.subject,
				message: mail.html || mail.text
			});
			await scheduledMail.save();

			// Format sendDate in Eastern Time for emails
			const estDateStr = sendDate.toLocaleString("en-US", {
				timeZone: "America/New_York",
				month: "short",
				day: "numeric",

				hour: "2-digit",
				minute: "2-digit",
				hour12: true
			});
			logger.warn({ message: `Mass email scheduled to send on ${estDateStr} to ${target} members.` })
			if (target === 'all') await sendEmail(process.env.ADMIN_EMAIL, "MASS EMAIL SCHEDULED", mailTemplates.notifyMassEmail, undefined, undefined, false);


		} catch (err) {
			logger.error({ message: `Error processing email: ${err.message}` });
		}
		// Mark the email as read 
		forwardingListener.imap.addFlags(attributes.uid, '\\Seen', (err) => {
			if (err) logger.error({ message: 'Failed to mark email as unread' });
		});
	});

	forwardingListener.on("error", function (err) {
		if (numRestarts_forwarding < MAX_RESTART_FORWARDING) {
			setTimeout(() => {
				forwardingListener.start();
				numRestarts_forwarding++;
			}, 5000); // 5 second delay
		} else {
			logger.error({ message: `forwardingListener error: ${err.message}. Failed to restart service` });
		}
	});

	forwardingListener.on("disconnected", function () {
		logger.error({ message: 'imapDisconnected. Attempting to reconnect...' });
		forwardingListener.start(); // attempt to reconnect
	});
}

// Stops the mail listener instance for forwarding
function stopForwardingListener() {
	if (forwardingListener) {
		forwardingListener.stop();
		numRestarts_forwarding = 0; // Reset restart counter
		forwardingListener = null; // Clear the global instance
	}
}


module.exports = { startPaymentsListener, stopPaymentsListener, startForwardingListener, stopForwardingListener };