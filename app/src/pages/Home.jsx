import { Link } from "react-router-dom";

import Card from "../components/Card"

import about from '../assets/about.png'
import offer from '../assets/offer.jpg'

import raceway from '../assets/raceway.png'
import partners from '../assets/partners.png'

import styles from './stylesheets/Home.module.css'


const Home = () => {
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


	return (
		<>
			<div className={styles.heroImage}>
				<div className={styles.heroText}>
					{/* ADD HERO TEXT NOTE HERE */}
				</div>
			</div>
			<div className="content">
				<Card heading='About Us' body={HTML_AboutUs} img={about} inverted={false} />
				<Card heading='What We Offer' body={HTML_Offer} img={offer} inverted={true} />
				<div className={styles.imageContainer}>
					<img src={partners} alt="Picture of our partners" />
					<img src={raceway} alt="Picture of Grand Bend Track" />
				</div>

			</div>

		</>
	);
};

export default Home;

/*

*/