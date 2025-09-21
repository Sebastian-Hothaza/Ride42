import { useOutletContext, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import Card from "../components/Card"

import about from '../assets/about.png'
import offer from '../assets/offer.jpg'
import bundle from '../assets/bundle.jpg'
import helite from '../assets/helite.png'
import pirelli from '../assets/pirelli.png'
import cancelled from '../assets/cancelled.jpg'

import raceway from '../assets/raceway.png'
import partners from '../assets/partners.png'

import styles from './stylesheets/Home.module.css'


const Home = () => {
	const CANCELLATION_NOTICE = false; // Set to true to display cancellation notice.

	const [nextTrackday, setNextTrackday] = useState(() => JSON.parse(localStorage.getItem('nextTrackday')));
	let daysAway, hoursAway; // Tracks how many days and hours away the next trackday is
	const { APIServer } = useOutletContext();




	// Loads in nextTrackday from API
	useEffect(() => {
		async function fetchAPIData() {
			try {
				const response = await fetch(APIServer + 'presentTrackdays');
				if (!response.ok) throw new Error("Failed to get API Data for presentTrackdays")
				const data = await response.json();
				setNextTrackday(data.filter(day => new Date(day.date) >= new Date()).sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))[0]);
			} catch (err) {
				console.log(err.message)
			}
		}
		fetchAPIData();
	}, [])

	// Update localStorage if needed after API returns
	useEffect(() => {
		const storedTrackday = JSON.parse(localStorage.getItem('nextTrackday'));
		if (JSON.stringify(storedTrackday) !== JSON.stringify(nextTrackday)) {
			localStorage.setItem('nextTrackday', JSON.stringify(nextTrackday));
		}
	}, [nextTrackday])
	

	if (nextTrackday) {
		const timeDifference = new Date(nextTrackday.date) - new Date();
		daysAway = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
		hoursAway = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	}


	const HTML_Cancellation = <div>
		<h1>The trackday on June 18 has been cancelled.</h1>
		<br></br>
		<p>If you paid via trackday credit, your credit has been added back to your account.</p>
		<br></br>
		<p>If you paid via E-Transfer or Credit Card, we will send you an email shortly.</p>
	</div>

	const HTML_NewsItem = <div>
		<h1>⏱️ Lapping will run 9am-5pm instead of 10am-6pm ⏱️</h1>
		<br></br>
		<p>All events on schedule are moved up 1 hour. Lunch will be at noon.</p>
	</div>

	const HTML_Bundle = <div>
		<h2>Last chance to get your bundle; form closes TODAY! 🚀</h2>
		<h3> What makes these 3-day bundles awesome? 😁</h3>
		<br></br>
		<ul>
			<li>Save $120 vs registering at gate for each date individually</li>
			<li>No 7-day notice needed. Simply show up and RIDE! </li>
			<li>3-day bundle is <b>$450</b> all in</li>
		</ul>
		<br></br>
		<button className={styles.bookBtn} onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSceY0VQfJmDCMTTNq0RWReTi3kn3Jih9MQo71RLqDcTBKVOTQ/viewform?usp=sf_link', '_blank')}>Get your bundle now!</button>
	</div>

	const HTML_Helite = <div>
		<h2>⚠️Order is now live⚠️</h2>
		<h3>Place your order soon to get your HELITE Airbag in time for the 2025 season</h3>
		<br></br>
		<ul>
			<li>French company with a history of making quality airbag systems for motorcyclists. Airbags are made in France.</li>
			<li>Internal system; no chance of crash rash/tear that you have with any external systems</li>
			<li>Electronic; no tether to connect. System uses IMU to detect crash/deploy</li>
			<li>Cartridge based. Have a crash? Pop in a new cartridge and you are good to go. No need to ship out.</li>
			<li>Competitive price offering excellent value. NOT subscription based.</li>
		</ul>
		<br></br>
		<em>Compatible exclusively with PLUS airbag-ready suits designed for the HELITE system</em>
		<br></br>
		<br></br>
		<button className={styles.bookBtn} onClick={() => window.open('https://forms.gle/KrAhu3yAobndZwnVA', '_blank')}>Order your Airbag</button>
	</div>

	const HTML_Pirelli = <div>
		<h2>Place your order soon to guarantee delivery before track season starts!</h2>
		<br></br>
		<h3>Various sizes and compounds available</h3>
		<br></br>
		<ul>
			<li><b>SuperCorsa SC3 DOT:</b> Street-legal semi slicks perfect for trackday duty and street use. Warmers not required</li>
			<li><b>SuperCorsa Diablo SuperBike Slicks:</b> Competition grade slicks for riders wanting the most out of their tires.</li>
		</ul>
		<br></br>
		<br></br>
		<br></br>
		<em>Prices may change in the summer. Current pricing is unchanged from 2024; great opportunity to stock up!</em>
		<br></br>
		<br></br>
		<NavLink className={styles.bookBtn} style={{ backgroundColor: 'var(--accent-color)' }} to="/shop">Shop Now!</NavLink>
	</div>

	const HTML_AboutUs = <p>
		Ride42 primarily focuses on running motorcycle trackdays at Grand Bend Motorplex. Many riders begin their motorcycle journey on the street
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
			<li>Experienced pro level regional and national racers available for coaching and guidance</li>
			<li>BBQ lunch with refreshments</li>
			<li>Paved, well maintained track environment without the hazards, limitations or distractions you’d typically find on the street</li>

		</ul>
	</div>

	const HTML_Countdown = (
		<div>
			Next Trackday is in{" "}
			{daysAway > 0 && (
				<>
					{daysAway} day{daysAway > 1 ? "s" : ""}
				</>
			)}
			{hoursAway > 0 && daysAway === 0 && (
				<>
					{hoursAway} hour{hoursAway > 	1 ? "s" : ""}
				</>
			)}
		</div>
	)

	return (
		<>
			<div id={styles.hero}>
				{!CANCELLATION_NOTICE && <div id={styles.heroText}>
					{nextTrackday ? HTML_Countdown : <div>Next Trackday in...</div>}
					<NavLink className={styles.bookBtn} style={{ backgroundColor: 'var(--accent-color)' }} to="/dashboard">Book Now!</NavLink>
				</div>}
			</div>
			<div className="content" id={styles.firstCard}>
				{CANCELLATION_NOTICE && <Card heading='Cancellation Notice' body={HTML_Cancellation} img={cancelled} inverted={false} />}
				{/* <Card heading='2025 Season Bundle' body={HTML_Bundle} img={bundle} inverted={false} /> */}
				{/* <Card heading='HELITE Airbags' body={HTML_Helite} img={helite} inverted={false} />  */}
				{/* <Card heading='Pirelli Spring Order' body={HTML_Pirelli} img={pirelli} inverted={false} /> */}
				{/* <Card heading='June 18 Notice' body={HTML_NewsItem}  inverted={false} /> */}
				<Card heading='About Us' body={HTML_AboutUs} img={about} inverted={true} />
				<Card heading='What We Offer' body={HTML_Offer} img={offer} inverted={false} />
				<div id={styles.partnersContainer}>
					<img src={partners} alt="Picture of our partners" />
					<img src={raceway} alt="Picture of Grand Bend Track" />
				</div>

			</div>

		</>
	);
};

export default Home;