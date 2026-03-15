const ScheduledMail = require('./models/ScheduledMail');
const sendEmail = require('./mailer')
const mailTemplates = require('./mailer_templates')
const logger = require('./logger');

function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, 1000 * s));
}

// Checks DB for pending emails and sends them, concurrency-safe. Gets callled periodcally from app.js
async function checkOutgoingMail() {
    while (true) {
        const mail = await ScheduledMail.findOneAndUpdate(
            { sendOn: { $lte: new Date() }, processing: false },
            { processing: true },
            { new: true }
        );

        if (!mail) break;

        try {
            // Verify correct params are present to process the email blast. This is a duplicate check; if they exist in the DB, should already be present
            if (mail.to.length > 1){
                const targets = mail.params.target;
                if (!targets) throw new Error('Email blast has undefined targets')
                logger.info(`Begin email blast to ${targets} atendees. Email ID: ${mail._id}`);
            }
            for (const recipient of mail.to) {
                await sendEmail(
                    recipient,
                    mail.subject,
                    mailTemplates[mail.message],
                    mail.params || {}
                );
                await sleep(5); // wait 5 seconds before next email
            }
            if (mail.to.length > 1) logger.info(`Finish email blast`);
           
            await ScheduledMail.deleteOne({ _id: mail._id });
        } catch (err) {
            await ScheduledMail.findByIdAndUpdate(mail._id, { processing: false });
            logger.error({ message: `Failed to send email: ${err.message}` });
        }
    }
}

module.exports = checkOutgoingMail;