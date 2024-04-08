

import Card from "../components/Card"
import styles from './stylesheets/Rules.module.css'
import square from '../assets/square.jpg'

const Rules = () => {

	const HTML_BikeRules = <div className={styles.rulesCard}>
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

	const HTML_GearRules = <div className={styles.rulesCard}>
		Nobody wants to think about crashing, but having the right gear can make all the difference. We take safety seriously and require your gear to meet our standards.
		<br></br><br></br>
		<ul>
			<li>Leather jacket and pants; either 1-piece or 2-piece with zipper attaching torso to pant. Leather gear has a lifespan! Over many years of sweat and UV damage, leather begins to break down. Gear must be in good condition.</li>
			<li>Gauntlet style leather gloves; no exposed skin</li>
			<li>Riding boots that cover the ankle</li>
			<li>Full face helmet (SNELL or equivalent ECE rating recommended)</li>
		</ul>
	</div>

	const HTML_OurPolicies = <div className={styles.rulesCard}>
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


	return (
		<div className="content">
			<Card heading='Your Bike' body={HTML_BikeRules} img={square} inverted={false} />
			<Card heading='Your Gear' body={HTML_GearRules} img={square} inverted={true} />
			<Card heading='Our Policies' body={HTML_OurPolicies} img={square} inverted={false} />
		</div>
	);
};

export default Rules;