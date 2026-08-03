const ScheduledMail = require('./models/ScheduledMail');
const sendEmail = require('./mailer')
const logger = require('./logger');
const User = require('./models/User');
const jwt = require('jsonwebtoken')

function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, 1000 * s));
}

// Checks DB for pending emails and sends them, concurrency-safe
async function checkOutgoingMail() {
    while (true) {
        const mail = await ScheduledMail.findOneAndUpdate(
            { sendOn: { $lte: new Date() }, processing: false },
            { processing: true },
            { new: true }
        );
        if (!mail) break;
        try {
            let usersByEmail; // Maps user email to their first name


            // Build user map for O(1) lookup of first names for marketing emails
            if (mail.emailType === 'marketing') {
                // Get all users so we can populate the name for the sendEmail param
                const allUsers = await User.find().select('firstName contact.email').exec();
                usersByEmail = new Map(allUsers.map(u => [u.contact.email.toLowerCase(), u.firstName.toLowerCase()]));
                logger.info({ message: `Begin email blast to ALL members. ${mail._id}` });
            }

            // Send emails to all recipients, with rate limiting
            for (const recipient of mail.to) {
                let message = mail.message;
                let args = mail.args || {};
                // If name is not provided in args, attempt to get it from the user map for marketing emails, or default to 'there'
                if (!args.name) {
                    const user = usersByEmail ? usersByEmail.get(recipient.toLowerCase()) : undefined;
                    const firstName = user ? user.charAt(0).toUpperCase() + user.slice(1) : 'there';
                    args = { ...args, name: firstName }; // Update firstName only if not provided from mail.args
                }

                if (mail.emailType === 'marketing') {
                    // Create a unique token for the recipient to unsubscribe from marketing emails
                    const unsubscribeToken = jwt.sign({ email: recipient, purpose: 'unsubscribe', }, process.env.JWT_SECRET)
                    message += `<p style="font-size: 0.8em; color: #808080;">If you wish to unsubscribe from marketing emails, please click <a href="${process.env.CORS_ORIGIN}/unsubscribe/${unsubscribeToken}">here</a>.</p>`;
                }

                await sendEmail(recipient, mail.subject, message, args, [], true, mail.emailType !== 'marketing'); // Include BCC for non-marketing emails
                await sleep(10); // rate limiting
            }
            if (mail.emailType === 'marketing') {
                logger.info({ message: `Finish email blast to ALL members. ${mail._id}` });
            }
            // Successfully sent emails, remove from DB
            await ScheduledMail.deleteOne({ _id: mail._id });
        } catch (err) {
            logger.error({ message: `Failed to send email: ${err.message}. Removing from queue.` });
            await ScheduledMail.deleteOne({ _id: mail._id }); // DELETE the invalid mail so it doesn't get retried
        }
    }
}

module.exports = checkOutgoingMail;