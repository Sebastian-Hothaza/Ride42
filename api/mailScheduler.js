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
                logger.info({ message: `Begin marketing email blast to ${mail.to.length} members. ${mail._id}` });
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
                    const unsubscribeToken = jwt.sign({ email: recipient.toLowerCase(), purpose: 'marketing-preference' }, process.env.JWT_UNSUBSCRIBE_CODE)
                    const unsubscribeMessage =	`<br /><p style="color: #808080; font-style: italic;">If you no longer want to receive Ride42 updates, please click <a href="${process.env.API_URL}/updateSubscription/${unsubscribeToken}?sub=false">here</a>.</p>`

                    message = message.replace('</html>', `${unsubscribeMessage}</html>`);
                }

                await sendEmail(recipient, mail.subject, message, args, [], true, mail.emailType !== 'marketing'); // Include BCC for non-marketing emails
                await sleep(10); // rate limiting
            }
            if (mail.emailType === 'marketing') {
                logger.info({ message: `Finish marketing email blast to ${mail.to.length} members. ${mail._id}` });
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