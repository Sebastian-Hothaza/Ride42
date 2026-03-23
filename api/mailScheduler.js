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
            let allUsers = [];
            const isBlast = mail.to.length > 1
            const targets = mail.params?.target;
            // Verify required params for email blast
            if (isBlast) {
                if (!targets) throw new Error('Email blast has undefined targets');

                // Get all users name and email so we can populate the name in the sendEmail param
                allUsers = await User.find().select('firstName contact.email').exec();

                logger.info({ message: `Begin email blast to ${targets} members. ${mail._id}` });
            }

            // Send email to all recepients
            for (const recipient of mail.to) {
                let params;

                // Build params based on if email blast or not
                if (isBlast) {
                    const user = allUsers.find(u => u.contact.email === recipient);
                    if (!user) {
                        logger.warn({ message: `User not found for ${recipient}, skipping.` });
                        continue;
                    }
                    const firstName = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1);
                    params = { name: firstName };
                } else {
                    params = mail.params || {};
                }


                await sendEmail(
                    recipient,
                    mail.subject,
                    isBlast ? mail.message : mailTemplates[mail.message],
                    params
                );
                await sleep(10); // wait 10 seconds before next email
            }
            if (isBlast) logger.info({ message: `Finish email blast to ${targets} members. ${mail._id}` });
            // Successfully sent emails, remove from DB
            await ScheduledMail.deleteOne({ _id: mail._id });
        } catch (err) {
            logger.error({ message: `Failed to send email: ${err.message}. Removing from queue.` });
            await ScheduledMail.deleteOne({ _id: mail._id }); // DELETE the invalid mail so it doesn't get retried
        }
    }
}

module.exports = checkOutgoingMail;