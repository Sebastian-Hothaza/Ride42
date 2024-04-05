import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card"

import pageContent from './Pagecontent'
import square from '../assets/square.jpg'

import raceway from '../assets/raceway.png'
import partners from '../assets/partners.png'

import './stylesheets/home.css'


const Home = () => {

	const HTML_AboutUs_LOCAL = <p>Hello World</p>


	return (
		<>
			<Navbar />
			<div className="heroImage">
				<div className="heroText">
					{/* TODO: Add some hero text content here */}
				</div>
			</div>
			<div className="main" style={{ padding: '2rem 0' }}>
				<Card heading='About Us' body={pageContent.HTML_AboutUs} img={square} inverted={false} />
				<Card heading='What We Offer' body={pageContent.HTML_Offer} img={square} inverted={true} />
				<div className="imageContainer">
					<img src={partners} alt="Picture of our partners" />
					<img src={raceway} alt="Picture of Grand Bend Track" />
				</div>

			</div>
			<Footer />
		</>
	);
};

export default Home;