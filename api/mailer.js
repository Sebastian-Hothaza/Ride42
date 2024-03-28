const nodemailer = require("nodemailer");

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

async function main(recipient,subject,htmlBody){
    try{
        await transporter.sendMail({
            from: '"Ride42" <info@ride42.ca>', 
            to: recipient, 
            attachments: [{
                filename: 'ride42.png',
                path: 'ride42.png',
                cid: 'sigImg' 
            }],
            subject: subject, 
            html: htmlBody, 
        });
    }catch(err){
        console.log(err)
    }

}
module.exports = main;
