const nodemailer = require("nodemailer");

/*
TODO: See if we can do this protected block internally
try{
    await mailer("sebastianhothaza@gmail.com", "hello world", "not used")
}catch(err){
    console.log(err)
}
*/

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


const CONTENT = `<body>
<div class="default-style">
 Hello there
</div> 
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
</div>
</body>`

async function sendEmail(recipient,subject,htmlBody){
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
}
module.exports = sendEmail;
