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
async function main(recipient, subject, htmlBody, args, attachments = [], includeSignature = true, includeBCC = true) {
    // Check if args were received, and if so, inject them into the HTML body
    if (args && Object.keys(args).length) {
        Object.keys(args).forEach((arg) => {
            htmlBody = htmlBody.replaceAll("{" + arg + "}", args[arg])
        })
    }
    if (process.env.NODE_ENV === 'production' && process.env.CORS_ORIGIN !== 'https://demo.ride42.ca') {
        try {
            // Add attachments
            const emailAttachments = includeSignature ? [{
                filename: 'ride42.png',
                path: 'ride42.png',
                cid: 'sigImg'
            }, ...attachments,] : attachments;

            // Append the signature
            if (includeSignature) {
                const signature = `
                    <div class="io-ox-signature">
                            <div class="default-style">
                                <div class="default-style">
                                    &nbsp;
                                </div>
                                <div>
                                    <span style="color: #808080;">Sebastian Hothaza</span>
                                </div> <span style="color: #808080;"><em>Founder</em></span>
                            </div>
                            <div class="default-style">
                                <img class="aspect-ratio" style="max-width: 100%;" src="cid:sigImg" alt="" width="130" height="30">
                            </div>
                            <div class="default-style">
                                <a href="http://ride42.ca/"><strong>Visit us online</strong></a>
                            </div>
                            <div class="default-style">
                                <a href="https://www.facebook.com/groups/ride42/"><strong>Join us on Facebook</strong></a>
                            </div>
                    </div>`
                if (htmlBody.match(/<\/body>/i)) {
                    htmlBody = htmlBody.replace(/<\/body>/i, `${signature}</body>`);
                } else {
                    htmlBody += signature;
                }
            }

            const mailOptions = {
                from: '"Ride42" <info@ride42.ca>',
                to: recipient,
                subject: subject,
                html: htmlBody,
                attachments: emailAttachments,
                ...(includeBCC ? { bcc: 'nodemailer@ride42.ca' } : {}) // only include BCC if true
            };

            await transporter.sendMail(mailOptions);
        } catch (err) {
            logger.error({ message: err })
        }
    } else {
        logger.debug({ message: `Email [${subject}]sent to ${recipient}: \n${htmlBody}` });
    }

}
module.exports = main;