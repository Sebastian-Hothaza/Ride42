const nodemailer = require("nodemailer");

// Usage example: if (process.env.NODE_ENV === 'production') await sendEmail("JohnDoe@gmail.com", "Hello from NodeMailer", mailTemplates.helloWorld, {name: "Joe"})

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
async function main(recipient,subject,htmlBody,args){
    // Check if args were received, and if so, inject them into the HTML body
    if (args && Object.keys(args).length){
        Object.keys(args).forEach((arg)=>{
            htmlBody = htmlBody.replace("{"+arg+"}", args[arg])
        })
    }
    
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
            html: htmlBody.replace("{name}", args.name), 
        });
    }catch(err){
        console.log(err)
    }
}
module.exports = main;
