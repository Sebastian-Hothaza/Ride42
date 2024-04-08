import { Link } from "react-router-dom";

import Card from "../components/Card"

import pageContent from './Pagecontent'
import square from '../assets/square.jpg'

import raceway from '../assets/raceway.png'
import partners from '../assets/partners.png'

import styles from './stylesheets/Home.module.css'


const Home = () => {

	return (
		<>
			<div className={styles.heroImage}>
				<div className={styles.heroText}>
					{/* ADD HERO TEXT NOTE HERE */}
				</div>
			</div>
			<div className="content">
				<Card heading='About Us' body={pageContent.HTML_AboutUs} img={square} inverted={false} />
				<Card heading='What We Offer' body={pageContent.HTML_Offer} img={square} inverted={true} />
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