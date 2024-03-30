/*
    Manage email templates here
    Arguments should be in {argName} form. Check helloWorld for example
*/

const helloWorld =
`<body>
    <div class="default-style">
        Hello there {name}!
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

const passwordChange =
`<body>
    <div class="default-style">
        Hello {name}, <br /> <br />
        Your password has been updated.<br /> <br />
        If you did not request this password change, please contact us immediately.
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

const registerTrackday =
`<body>
    <div class="default-style">
        Hello {name}, <br /> <br />
        You are now registered for the trackday on {date}.<br /> <br />
        We look forward to seeing you on track soon!
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

const unregisterTrackday =
`<body>
    <div class="default-style">
        Hello {name}, <br /> <br />
        We have cancelled your trackday on {date}.<br /> <br />
        If you paid with an existing credit, it has been added back to your account. Otherwise, you should receive a refund within 5 business days.
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

const unregisterTrackday_admin =
`<body>
    <div class="default-style">
        User {name} has cancelled trackday on {date}. Refund required.
    </div>
</body>`

const rescheduleTrackday =
`<body>
    <div class="default-style">
        Hello {name}, <br /> <br />
        Your trackday on {dateOLD} has been re-scheduled to {dateNEW}.<br /> <br />
        We look forward to seeing you on track soon!
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

const requestReview =
`<body>
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

const welcomeUser =
`<body>
    <div class="default-style">
        Hello {name}, <br /> <br />
        Welcome to Ride42! We are excited to have you as part of our community.<br /> <br />
        Now is a great time to head over to your dashboard and add your bike to your garage.
        Once you have done that, you will be able to register for trackday with Ride42.<br /> <br />
        We look forward to seeing you on track soon!
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

const updateUser =
`<body>
    <div class="default-style">
        Hello {name}, <br /> <br />
        Your account details have been updated<br /> <br />
        If you did not change your details recently, please contact us immediately!
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

const QRCodeRequest =
`<body>
    <div class="default-style">
        A QR code has been requested for {name}(userID: {userID}) for bikeID: {bikeID}
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


module.exports = {  helloWorld,passwordChange,registerTrackday,unregisterTrackday,unregisterTrackday_admin,
                    rescheduleTrackday,requestReview,welcomeUser,updateUser, QRCodeRequest };