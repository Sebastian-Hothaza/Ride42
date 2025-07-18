const { MailListener } = require("mail-listener5");
let mailListener; // Global mail listener instance which can be stopped and started
const logger = require('./logger');
const sendEmail = require('./mailer')
const mailTemplates = require('./mailer_templates')

const User = require('./models/User');
const Trackday = require('./models/Trackday');
const ScheduledMail = require('./models/ScheduledMail');

const MAX_RESTART = 10; // Max number of tries to restart listener when encounter an error
let numRestarts = 0;

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

// Stops the mail listener instance
function stopMailListener() {
	if (mailListener) {
		mailListener.stop();
		numRestarts = 0; // Reset restart counter
		mailListener = null; // Clear the global instance
	}
}

// Starts new mail listener instance
function startMailListener() {
	mailListener = new MailListener({
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

	mailListener.start();

	mailListener.on("mail", async function (mail, seqno, attributes) {
		try {
			// Determine the user from the email
			const user = await getUser(mail);
			if (!user) {
				// Move the email to the TODO folder
				mailListener.imap.move(attributes.uid, "INBOX/Payments/TODO", (err) => {
					if (err) logger.error({ message: 'Failed to move email to processed folder' });
				});
				return;
			};

			// Determine the e-transfer amount recevied
			let pmtBalance = getAmount(mail.text);

			// Find all trackdays that the user is a member of, etransfer, and have not been paid for
			const userTrackdays = await Trackday.find({
				members: {
					$elemMatch: {
						user: { $eq: user._id },
						paid: false,
						paymentMethod: 'etransfer'
					}
				}
			}).populate('members.user', '-password -refreshToken -__v').exec();

			// Build local copy of trackdays we are trying to apply payments to
			let workingTrackdays = []
			userTrackdays.forEach((trackday) => {
				workingTrackdays.push({
					id: trackday.id,
					ticketPrice: trackday.ticketPrice.preReg,
					paid: false
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
					await ScheduledMail.deleteOne({
						to: memberEntry.user.contact.email,
						sendOn: new Date(trackdayDB.date.getTime() - (process.env.DAYS_LOCKOUT * 24 * 60 * 60 * 1000)),
						message: memberEntry.paymentMethod === 'etransfer' ? 'paymentReminder_etransfer' : 'paymentReminder_creditcard'
					})

					await trackdayDB.save()
				})

				// Mark the email as read 
				mailListener.imap.addFlags(attributes.uid, '\\Seen', (err) => {
					if (err) logger.error({ message: 'Failed to mark email as unread' });
				});

				// Move the email to the processed folder
				mailListener.imap.move(attributes.uid, "INBOX/Payments/Processed", (err) => {
					if (err) logger.error({ message: 'Failed to move email to processed folder' });
				});
			} else {
				// Move the email to the TODO folder
				mailListener.imap.move(attributes.uid, "INBOX/Payments/TODO", (err) => {
					if (err) logger.error({ message: 'Failed to move email to processed folder' });
				});

				logger.error({ message: `No payments have been applied for ${user.firstName} ${user.lastName}. Remaining balance: $${pmtBalance}` });
			}
		} catch (err) {
			logger.error({ message: `Error processing email: ${err.message}` });
			// Move the email to the TODO folder
			mailListener.imap.move(attributes.uid, "INBOX/Payments/TODO", (err) => {
				if (err) logger.error({ message: 'Failed to move email to processed folder' });
			});
		}
	});

	mailListener.on("error", function (err) {
		if (numRestarts < MAX_RESTART) {
			setTimeout(() => {
				mailListener.start();
				numRestarts++;
			}, 5000); // 5 second delay
		} else {
			logger.error({ message: `mailListener error: ${err.message}. Failed to restart service` });
		}
	});

	mailListener.on("disconnected", function () {
		logger.error({ message: 'imapDisconnected. Attempting to reconnect...' });
		mailListener.start(); // attempt to reconnect
	});
}

module.exports = { startMailListener, stopMailListener };