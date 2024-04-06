/*
    Manage website text content here
*/


const HTML_AboutUs = <p>
    Founded in 2024, Ride42 primarily focuses on running motorcycle trackdays at Grand Bend Motorplex. Many riders begin their motorcycle journey on the street
    and soon realize the danger of exploring the limits of their machine on public roads with other road users, unknown road surface conditions and no run off
    area. The consequences and risks simply outweigh the rewards.<br></br>
    <br></br>
    Motorcycle trackdays allow enthusiasts a safe environment where they can truly enjoy and explore the limits of their machines. If you own a modern supersport
    motorcycle and have not been on track with it, you are doing it a disservice! Trackdays allow you to improve your skills in a safe and structured environment;
    skills which will directly translate to making you a more competent and safe rider.<br></br>
    <br></br>
    At Ride42, we have 3 core principles. First, we want to foster an environment where new riders feel welcome and at home. We are centered around building
    relationships within the community and creating long lasting memories. Second, we want to lower the barrier of entry for the sport and make it accessible.
    It’s no secret that motorsports are not a cheap hobby, however, we aim to mitigate that by providing competitive pricing and excellent value. Lastly, we want
    to provide our members with the right tools to continually develop their skills. This will be done through our coaching system and carefully selected
    partnerships with organizations that share our values and can benefit our community. <br></br>
    <br></br>
    We strive to provide the best trackday experience in southwestern Ontario and hope to see you on track soon!
</p>


const HTML_Offer = <div>
    <p>
        Hosted exclusively at Grand Bend Motorplex, our goal is to provide you a consistent trackday experience where you can expect:
        <br></br><br></br>
    </p>
    <ul>
        <li>Trackday run by experienced personnel who are eager to ensure you have a great time</li>
        <li>Safe and structured riding divided into groups based on skill level. Occasionally we may go down to 2 groups; our goal is to maximize your time on track while maintaining a safe environment</li>
        <li>Experienced pro level regional and national racers available for one-on-one coaching and guidance</li>
        <li>BBQ lunch with refreshments</li>
        <li>Paved, well maintained track environment without the hazards, limitations or distractions you’d typically find on the street</li>
        <li>Professional photographs from an on-site photographer</li>
    </ul>
</div>

const HTML_Schedule = <table>
    <tbody>
        <tr>
            <td>6pm the day before</td>
            <td>Gates open, camp overnight if you’d like!</td>
        </tr>
        <tr>
            <td>10pm the day before</td>
            <td>Gates lock</td>
        </tr>
        <tr>
            <td>8am</td>
            <td>Gates open</td>
        </tr>
        <tr>
            <td>9:30am</td>
            <td>Mandatory riders meeting</td>
        </tr>
        <tr>
            <td>9:50am</td>
            <td>Sighting lap - mandatory for new riders</td>
        </tr>
        <tr>
            <td>10am</td>
            <td>Lapping starts</td>
        </tr>
        <tr>
            <td>1pm</td>
            <td>Lunch break(1 hour)</td>
        </tr>
        <tr>
            <td>6pm</td>
            <td>Lapping ends</td>
        </tr>
    </tbody>
</table>

const HTML_PricingInfo = <div id="pricingCard">
    <div className="priceEntry">
        <div>Pre-Registration (7 days in advance):</div>
        <div style={{ fontWeight: 'bold' }}>$170</div>
    </div>
    <br></br>
    <div className="priceEntry">
        <div>Gate Registration: </div>
        <div style={{ fontWeight: 'bold' }}>$190</div>
    </div>
    <br></br>
    <br></br>
    <br></br>
    <span style={{ fontStyle: 'italic' }}>Gate registrations are space permitting and BBQ lunch is not guaranteed.</span>
</div>

const HTML_BikeRules = <div className='rulesCard'>
    In order to keep our trackday safe for you and our community, please make sure your bike meets our standards. Upon arriving, you will need to submit
    your bike for tech inspection.
    <br></br><br></br>
    <ul>
        <li>Coolant MUST be replaced with either distilled water or a mix of distilled water & water wetter</li>
        <li>Glass must be removed or taped up. (Ie. mirrors and headlights). Plastic headlight lenses are acceptable. </li>
        <li>Kickstands must be zip tied if the return spring does not properly snap stand back.</li>
        <li>Tires and brakes must be in good condition.</li>
        <li>Throttle must snap back closed; check that your grip is not catching the bar end</li>
        <li>No leaks of any kind (Ie. oil, coolant, fork seals, brake fluid)</li>
        <li>No loose parts or missing bolts</li>
        <li>Cameras, if used, must be securely fastened</li>
    </ul>
</div>

const HTML_GearRules = <div className='rulesCard'>
    Nobody wants to think about crashing, but having the right gear can make all the difference. We take safety seriously and require your gear to meet our standards.
    <br></br><br></br>
    <ul>
        <li>Leather jacket and pants; either 1-piece or 2-piece with zipper attaching torso to pant. Leather gear has a lifespan! Over many years of sweat and UV damage, leather begins to break down. Gear must be in good condition.</li>
        <li>Gauntlet style leather gloves; no exposed skin</li>
        <li>Riding boots that cover the ankle</li>
        <li>Full face helmet (SNELL or equivalent ECE rating recommended)</li>
    </ul>
</div>

const HTML_OurPolicies = <div className='rulesCard'>
    Please familiarize yourself with our policies. If you have any questions, please email us at <a href="mailto: info@ride42.ca">info@ride42.ca</a>
    <br></br><br></br>

    <h3>Passing Rules</h3>
    <ul>
        <li>Green(Novice): New-to-track riders. Passing permitted only on straights</li>
        <li>Yellow(Intermediate): Developing track riders. Once bike in front of you has initiated their turn in, inside passing is restricted until after the apex. Outside passing permitted.</li>
        <li>Red(Advanced): Experienced track riders and racers. Passing permitted anywhere; however this is a track day, not a race. Be respectful.</li>
    </ul>

    <h3>Pre-Registrations</h3>
    <p>
        Pre-Registrations are accessible to our members thru the member dashboard. A pre-registration is a trackday booking made at least 7 days before the event. Your payment <span style={{ fontWeight: 'bold' }}> must </span> also be
        received at least 7 days before the event; otherwise your booking is void.
    </p>
    <h3>Pre-season bundles</h3>
    <p>
        Pre-season bundles are exempt from the 7 day requirements. However, it is still recommended to pre-book your days so that we can guarantee your spot and plan for your attendance. Bundles are for use solely by the purchaser
        and for the season they were purchased in. If you pre-book a trackday, you are able to cancel/reschedule it anytime. However, if you pre-book a trackday and do not show up, your day will <span style={{ fontWeight: 'bold' }}> not </span> be credited.
    </p>


    <h3>Rain dates, Reschedule & Refunds</h3>
    <p>
        We run rain or shine at our discretion. If we decide to cancel a trackday, a minimum 36 hour notice will be given via an email to all members who were pre-registered. The "Dates" section of the website will also be
        updated to reflect the cancellation. <br></br>
        You can reschedule or cancel your trackday through your member dashboard. You cannot reschedule/cancel a trackday once it is less than 7 days away.
    </p>

    <h3>Ettiquete</h3>
    <p>
        Everyone is here with a common hobby and the desire to improve. Do not be afraid to ask for help & advice! Likewise, please be generous and pass on your skills to other riders. Be social and part of the community!
    </p>
</div>

const HTML_Faq = <div className="faqCard">
    <h2>For those new to track...</h2>
    <br></br>
    <h4>What do I need to do to my bike?</h4>
    <div>Very little; in most cases it essentially comes down to tape up your lights/mirror and change your coolant to water.
        For a full list of requirements, you can check out the rules tab.</div>
    <br></br>
    <h4>How about gear?</h4>
    <div>Full leather suit OR 2 piece that zips together. You can see the full requirements in the gear tab.</div>
    <br></br>
    <h4>How is the day setup?</h4>
    <div>In most cases, we will split into 3 groups: red(advanced), yellow(intermediate) and green(novice).
        Each group will go out for 15 minute sessions at a time. While this may sound really short, the reality is you will be exhausted!</div>
    <br></br>
    <h4>How fast is green?</h4>
    <div>This is impossible to really quantify, but chances are, you’re going to be fine. Passing is permitted only on straights, you won’t be spooked in a corner by someone trying to squeeze in.</div>
    <br></br>
    <h4>How do I get my bike there?</h4>
    <div>Trailering your bike is ideal; U-haul rents out trailers for $15/day. However, you might not have a hitch on your car. Riding there is an option that some choose to take.
        If you crash and your bike is unridable, chances are there’s going to be someone there that can help get your bike home.</div>
    <br></br>
    <h4>Do I need race slicks, suspension upgrades etc etc?</h4>
    <div>No, a perfectly stock bike will be more than capable for your first track day. If you insist on some upgrade for your bike, pads and braided brake lines are a great starting point!</div>
    <br></br>
    <h4>What if the forecast is showing a strong change of rain?</h4>
    <div>You can hold off as long as you want and complete a gate registration. Gate registrations are cash only and space permitting.</div>
    <br></br>


    <h2>Tips & Advice</h2>
    <br></br>
    <div><span style={{ fontWeight: 'bold' }}>BE PREDICTABLE</span> - If you’re going to do something out of the ordinary, stick an arm or leg out to let the person behind you know. Don’t commit to a line only to dive in out unexpectedly.</div>
    <div><span style={{ fontWeight: 'bold' }}>ASK QUESTIONS</span> - Everyone at our track days is (theoretically) friendly and there to have a good time. Talk to other riders, see what works for them and take advantage of others’ experience!
        Vast majority of riders would be more than happy to come out and join you on a lap to show you some lines/techiques.</div>
        <div><span style={{ fontWeight: 'bold' }}>WATCH THE MARSHALLS</span>  - They are scattered around the track and are your only source of information out there. Know the flags and what to do in each case.</div>
    <br></br>
    <ul>
        <li>Stay on the motorcycle</li>
        <li>Ride your own pace; don’t worry about trying to catch up with someone that passed you.</li>
        <li>Don’t be a straight line hero just to park it in the corners.</li>
        <li>Bring a variety of zipties. They can be very useful to patch up fairings.</li>
        <li>Don’t be afraid to run it off if you feel like you’re not making the corner. DO NOT touch the front brake if you run it off on the grass. Simply ride it out and drag the rear brake, there are large run offs.</li>
        <li>Prioritize race line over anything else, body position, braking techniques can all come later but to ensure safety for everyone, focus on using the correct racing line. If you are unsure, just ask!</li>
    </ul>
    <br></br>
    <h2>Still have questions?</h2>
    <div>Please reach out to us, we are more than happy to help!</div>
 
</div>

export default { HTML_AboutUs, HTML_Offer, HTML_Schedule, HTML_PricingInfo, HTML_BikeRules, HTML_GearRules, HTML_OurPolicies, HTML_Faq }