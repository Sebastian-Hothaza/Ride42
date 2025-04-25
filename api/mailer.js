const nodemailer = require("nodemailer");
const logger = require('./logger');

// Usage example: if (process.env.NODE_ENV === 'production') sendEmail("JohnDoe@gmail.com", "Hello from NodeMailer", mailTemplates.helloWorld, {name: "Joe"})

// Configure email sender info
const transporter = nodemailer.createTransport({
    host: process.env.ADMIN_EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
    },
});

// Attempt to send the email
async function main(recipient, subject, htmlBody, args, attachments = []) {
    // Check if args were received, and if so, inject them into the HTML body
    if (args && Object.keys(args).length) {
        Object.keys(args).forEach((arg) => {
            htmlBody = htmlBody.replaceAll("{" + arg + "}", args[arg])
        })
    }
    if (true || process.env.NODE_ENV === 'production') {
        try {
            const emailAttachments = recipient !== 'waiver@ride42.ca' ? [
                {
                    filename: 'ride42.png',
                    path: 'ride42.png',
                    cid: 'sigImg'
                },
                ...attachments,
            ] : attachments;

            await transporter.sendMail({
                from: '"Ride42" <info@ride42.ca>',
                to: recipient,
                bcc: 'nodemailer@ride42.ca',
                attachments: emailAttachments,
                subject: subject,
                html: htmlBody,
            });
        } catch (err) {
            logger.error({ message: err })
        }
    } else if (process.env.NODE_ENV === 'development') {
        logger.debug({ message: `Email sent: \n${htmlBody}` });
    }

}
module.exports = main;
