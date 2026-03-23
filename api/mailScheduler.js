const ScheduledMail = require('./models/ScheduledMail');
const sendEmail = require('./mailer')
const mailTemplates = require('./mailer_templates')
const logger = require('./logger');
const User = require('./models/User');

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

            const targets = mail.params?.target;
            const isBlast = !!targets; // blast is defined by having targets

            let allUsers = [];

            if (isBlast) {
                // Get all users so we can populate the name for the sendEmail param
                allUsers = await User.find().select('firstName contact.email').exec();
                logger.info({ message: `Begin email blast to ${targets} members. ${mail._id}` });
            }

            // Send emails
            for (const recipient of mail.to) {
                let params;

                if (isBlast) {
                    const user = allUsers.find(u => u.contact.email.toLowerCase() === recipient.toLowerCase());
                    if (!user) {
                        logger.warn({ message: `User not found for ${recipient}, skipping.` });
                        continue;
                    }
                    const firstName = user.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : 'there';
                    params = { name: firstName };
                } else {
                    // transactional or non-blast email uses mailTemplates
                    params = mail.params || {};
                }

                await sendEmail(
                    recipient,
                    mail.subject,
                    isBlast ? mail.message : mailTemplates[mail.message],
                    params
                );
                await sleep(10); // rate limiting
            }
            if (isBlast) {
                logger.info({ message: `Finish email blast to ${targets} members. ${mail._id}` });
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