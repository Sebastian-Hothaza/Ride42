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
            let allUsers;
            const targets = mail.params.target;
            // Verify required params for email blast
            if (mail.to.length > 1) {
                if (!targets) throw new Error('Email blast has undefined targets');

                // Get all users name and email so we can populate the name in the sendEmail param
                allUsers = await User.find().select('firstName contact.email').exec();

                logger.info({message: `Begin email blast to ${targets} members. ${mail._id}`});
            }

            // Send email to all recepients
            for (const recipient of mail.to) {
                let user = allUsers.find(u => u.contact.email === recipient);
                user = user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1);

                await sendEmail(
                    recipient,
                    mail.subject,
                    (mail.to.length === 1) ? mailTemplates[mail.message] : mail.message,
                    (mail.to.length === 1) ? mail.params || {} : { name: user }
                );
                await sleep(10); // wait 10 seconds before next email
            }
            if (mail.to.length > 1) logger.info({message: `Finish email blast to ${targets} members. ${mail._id}`});
            // Successfully sent emails, remove from DB
            await ScheduledMail.deleteOne({ _id: mail._id });
        } catch (err) {
            logger.error({ message: `Failed to send email: ${err.message}. Removing from queue.` });
            await ScheduledMail.deleteOne({ _id: mail._id }); // DELETE the invalid mail so it doesn't get retried
        }
    }
}

module.exports = checkOutgoingMail;