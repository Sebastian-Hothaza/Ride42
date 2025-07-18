const ScheduledMail = require('./models/ScheduledMail');
const sendEmail = require('./mailer')
const mailTemplates = require('./mailer_templates')
const logger = require('./logger');

// Checks DB for pending emails and sends them, concurrency-safe
async function checkOutgoingMail() {

    while (true) {
        // Atomically claim one mail for processing
        const mail = await ScheduledMail.findOneAndUpdate(
            { sendOn: { $lte: new Date() }, processing: false },
            { processing: true },
            { new: true }
        );
        if (!mail) break; // No more mails to process
        try {
            await sendEmail(mail.to, mail.subject, mailTemplates[mail.message], mail.params || {});
            await ScheduledMail.deleteOne({ _id: mail._id });
        } catch (err) {
            // Reset processing flag so it can be retried
            await ScheduledMail.findByIdAndUpdate(mail._id, { processing: false });
            logger.error({ message: `Failed to send email to ${mail.to}: ${err.message}` });
        }
    }
}

module.exports = checkOutgoingMail;