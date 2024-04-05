/*
    Manage website text content here
*/


const HTML_AboutUs = <p>
    Founded in 2024, Ride42 primarily focuses on running motorcycle trackdays at Grand Bend Motorplex. Many riders begin their motorcycle journey on the street
    and soon realize the danger of exploring the limits of their machine on public roads. With other road users, unknown road surface conditions and no run off
    area, the consequences and risks simply outweigh the rewards.<br></br>
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

export default { HTML_AboutUs, HTML_Offer, HTML_Schedule, HTML_PricingInfo }