const signature =
	`
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
`

const welcomeUser =
	`<body>
	<div class="default-style">
	<h3>Hello {name},</h3>
	I wanted to take a moment to welcome you to Ride42, tell you a bit about myself and explain how our trackdays are run! 😊


	<h3>Welcome to Ride42!</h3>
	At Ride42, we have 3 core principles. First, we want to foster an environment where new riders feel welcome and at home. We are centered around building relationships within the community and creating long lasting memories. 
	Second, we want to lower the barrier of entry for the sport and make it accessible. It’s no secret that motorsports are not a cheap hobby, however, we aim to mitigate that by providing competitive pricing and excellent value. 
	Lastly, we want to provide our members with the right tools to continually develop their skills. This will be done through our coaching system and carefully selected partnerships with organizations that share our values and can benefit our community. 
	We also welcome you to join our <a href="https://www.facebook.com/groups/ride42">Facebook page</a> and to follow us on Instagram <a href="https://www.instagram.com/ride42_official">@ride42_official</a>

	<h3>How our trackdays work</h3>
	I am proud to offer a first for Ontario trackdays; a QR based express check in! At your first Ride42 trackday, you will receive a QR sticker to place on your windshield. For all future events you pre-register for, you no longer need to check-in when 
	arriving! Once you arrive, you can go directly to tech inspection where your QR code will be scanned and you will be automatically checked in. Your QR code is unique to you and your bike. If you scan it with your phone, it will take you to your dashboard. 
	At each Ride42 trackday, we will have Pro racers available for one-on-one coaching & guidance, a delicious BBQ lunch and full tire service. All these are included with your Ride42 trackday and I trust you will find value in each one. <br></br>

	<h3>A little about me</h3>
	I started riding motorcycles back in 2013 on a Kawasaki Ninja 250R and in 2015, I moved up to a Yamaha R6. I accumulated many, MANY kilometers in the first few years on the R6 but quickly realized public 
	roads were not the place to be riding a bike like that! I started doing trackdays in 2016 and fell in love with the sport. However, I found the trackdays to be very impersonal; you show up, ride, go home. I wanted something more, I wanted a community 
	atmosphere where everyone feels welcome, engaged and valued. This is the experience that Ride42 strives to deliver. <br></br>
	Outside of running trackdays, I enjoy racing in our national series (CSBK) as well as our regional series (SOAR & RACE) in the Pro Supersport category. I couldn't stop myself with just road bikes! I spend quite a bit of time riding trails with my KTM 
	and am looking into competing at the Corduroy Enduro. You can follow me on Instagram <a href="https://www.instagram.com/42Seb">@42Seb</a> and view my YouTube channel <a href="https://www.youtube.com/@seb42">here.</a>

	<br></br>
	
	Now is a great time to head over to your dashboard, add your bike to your garage, and book some trackdays! Please also take a few minutes to explore our site including the rules and shop tabs. 🚀<br></br>
	<br></br>
	Welcome to the best trackday experience, Welcome to Ride42! 🔥
	
	</div>
	${signature}
</body>`

const updateUser =
	`<body>
	<div class="default-style">
		Hello {name}, <br />
		<br />
		⚠️Your account details have been updated⚠️<br />
		<br />
		If you did not make any recent changes, please contact us immediately.
	</div>
	${signature}
</body>`

const passwordChange =
	`<body>
	<div class="default-style">
		Hello {name}, <br />
		<br />
		⚠️Your password has been updated⚠️<br /> 
		<br />
		If you did not request this password change, please contact us immediately.
	</div>
	${signature}
</body>`

const passwordResetLink =
	`<body>
	<div class="default-style">
		Hello {name}, <br />
		<br />

		<a href={link}><strong>Click here to reset your password.</strong></a><br />
		<br />

		⚠️If you did not request a password reset, please contact us immediately.⚠️
	</div>
	${signature}
</body>`

const registerTrackday_credit =
	`<body>
	<div class="default-style">
		Hello {name}, <br />
		<br />

		You are now registered for the trackday on {date} using your trackday credit. ✅<br />
		<br />

		⚠️<i>Please note: If you do not attend on {date} without first cancelling your trackday through your dashboard, your credit will still be considered redeemed. With trackday credits, you can cancel up to the night before the trackday.</i><br />
		<br />

		If you already have a QR sticker on your bike and have signed a waiver this year, you can skip morning check in and go directly to bike tech 😊<br />
		<br />

		We look forward to seeing you on track soon! 🚀
	</div>
	${signature}
</body>`

const registerTrackday_etransfer =
	`<body> 
	<div class="default-style">
		Hello {name}, <br />
		<br />

		You are now registered for the trackday on {date}. ✅<br />
		<br />

		Your payment of \${price} can be sent via e-transfer to pay@ride42.ca. If you registered for multiple days, you can send a single payment. Payments will be applied to your trackdays in chronological order. It may take up to 2 days for your dashboard to reflect your payment.<br />
		<br />

		If your payment is not received by {dueDate}, your pre-registration will be automatically cancelled. <br />
		<br />

		If you already have a QR sticker on your bike and have signed a waiver this year, you can skip morning check in and go directly to bike tech 😊<br />
		<br />

		We look forward to seeing you on track soon! 🚀
	</div>
	${signature}
</body>`

const registerTrackday_creditcard =
	`<body>
	<div class="default-style">
		Hello {name}, <br />
		<br />

		You are now registered for the trackday on {date}. ✅<br />
		<br />

		You can submit your credit card payment directly in your dashboard.<br />
		<br />

		If your payment is not received by {dueDate}, your pre-registration will be automatically cancelled. <br />
		<br />

		If you already have a QR sticker on your bike and have signed a waiver this year, you can skip morning check in and go directly to bike tech 😊<br />
		<br />

		We look forward to seeing you on track soon! 🚀
	</div>
	${signature}
</body>`

const registerTrackday_gate =
	`<body> 
	<div class="default-style">
		Hello {name}, <br />
		<br />

		You are now gate-registered for the trackday on {date}. ✅<br />
		<br />

		Your payment of \${price} can be sent via e-transfer to pay@ride42.ca.<br />
		<br />

		This registration is equivalent to a gate registration and as such is NON-REFUNDABLE. Once your payment is received, your spot is reserved. <br />
		<br />

		If you already have a QR sticker on your bike and have signed a waiver this year, you can skip morning check in and go directly to bike tech 😊<br />
		<br />

		We look forward to seeing you on track soon! 🚀
	</div>
	${signature}
</body>`

const unregisterTrackday =
	`<body>
	<div class="default-style">
		Hello {name}, <br />
		<br />

		We have cancelled your trackday on {date}. 🥹<br />
		<br />

		If you paid with a trackday credit, it has been added back to your account. Otherwise, you should receive a refund within 5 business days.<br />
		<br />

		We are sorry to hear you couldn't make it out this time and hope to see you again soon! 😊
	</div>
	${signature}
</body>`

const unregisterTrackday_admin =
	`<body>
	<div class="default-style">
		User {fname} {lname} has cancelled trackday on {date}.<br />
		<br />

		Payment Method: {paymentMethod}<br />
		Paid: {paid}<br />
		<br />
		
		⚠️Refund may be required⚠️
	</div>
</body>`

const rescheduleTrackday =
	`<body>
	<div class="default-style">
		Hello {name}, <br /> <br />
		Your trackday on {dateOLD} has been re-scheduled to {dateNEW}. ✅<br /> 
		<br />
		We look forward to seeing you on track soon! 🚀
	</div>
	${signature}
</body>`


const paymentReminder_etransfer =
	`<body>
	<div class="default-style">
		Hello {name}, <br /> <br />
		Your payment of \${price} for the trackday on {date} is due today.⏰<br />
		<br />
		Payments can be sent via E-Transfer to pay@ride42.ca<br />
		<br />
		We look forward to seeing you on track soon! 🚀
	</div>
	${signature}
</body>`

const paymentReminder_creditcard =
	`<body>
	<div class="default-style">
		Hello {name}, <br /> <br />
		Your payment of \${price} for the trackday on {date} is due today.⏰<br />
		<br />
		You can submit your credit card payment directly in your dashboard.<br />
		<br />
		We look forward to seeing you on track soon! 🚀
	</div>
	${signature}
</body>`


const notifyPaid =
	`<body>
	<div class="default-style">
		Hello {name}, <br /> <br />
		Your payment for the {date} trackday has been processed. ✅<br />
		<br />
		We look forward to seeing you on track soon! 🚀
	</div>
	${signature}
</body>`



module.exports = { welcomeUser, updateUser, passwordChange, passwordResetLink, registerTrackday_credit, registerTrackday_etransfer, registerTrackday_creditcard, registerTrackday_gate, unregisterTrackday, unregisterTrackday_admin, rescheduleTrackday, paymentReminder_etransfer, paymentReminder_creditcard, notifyPaid };