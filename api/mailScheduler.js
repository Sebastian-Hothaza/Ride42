const ScheduledMail = require('./models/ScheduledMail');
const sendEmail = require('./mailer')
const mailTemplates = require('./mailer_templates')
const logger = require('./logger');

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
            const targets = mail.params.target;
            // Verify required params for email blast
            if (mail.to.length > 1) {
                if (!targets) throw new Error('Email blast has undefined targets');
                logger.info(`Begin email blast to ${targets} attendees. Email ID: ${mail._id}`);
            }

            // Send email to all recepients
            for (const recipient of mail.to) {
                await sendEmail(
                    recipient,
                    mail.subject,
                    mail.params.target? mail.message : mailTemplates[mail.message],
                    mail.params || {}
                );
                await sleep(10); // wait 10 seconds before next email
            }
            if (mail.to.length > 1) logger.info(`Finish email blast to ${targets} attendees. Email ID: ${mail._id}`);
            // Successfully sent emails, remove from DB
            await ScheduledMail.deleteOne({ _id: mail._id });
        } catch (err) {
            logger.error({ message: `Failed to send email: ${err.message}. Removing from queue.` });
            await ScheduledMail.deleteOne({ _id: mail._id }); // DELETE the invalid mail so it doesn't get retried
        }
    }
}

module.exports = checkOutgoingMail;