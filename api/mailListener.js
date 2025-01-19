const { MailListener } = require("mail-listener5");
const logger = require('./logger');

function setupMailListener() {
	const mailListener = new MailListener({
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
		markSeen: true, // all fetched email will be marked as seen and not fetched next time
		fetchUnreadOnStart: true, // fetch unread emails that are already in the mailbox when the listener starts
		attachments: false, // disable attachment handling
		attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
	});

	mailListener.start(); 

	mailListener.on("mail", function (mail, seqno, attributes) {
		logger.info({ message: 'email received' });

		// Move the email to the processed folder
		mailListener.imap.move(attributes.uid, "INBOX/Payments/Processed", (err) => {
			if (err) logger.error({ message: 'Failed to move email to processed folder' });
		});
	});

	mailListener.on("error", function(err) {
		console.error("Mail listener error:", err);
	});

	mailListener.on("disconnected", function() {
		console.log("imapDisconnected. Attempting to reconnect...");
		mailListener.start(); // attempt to reconnect
	});
}

module.exports = setupMailListener;