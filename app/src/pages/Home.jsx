import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card"

import pageContent from './pagecontent'
import square from '../assets/square.jpg'

import './stylesheets/home.css'


const Home = () => {
	return (
		<>
		<Navbar />
		<div className="heroImage">
			<div className="heroText">
				{/* TODO: Add some hero text content here */}
			</div>
		</div>
		<div className="main" style={{padding: '2rem 0'}}>
			<Card heading='About Us' body={pageContent.TEXT_AboutUs} img={square} inverted={false}/>
			<Card heading='What We Offer' body={'pageContent.TEXT_AboutUs'} img={square} inverted={true}/>
		</div>
		<Footer />
		</>
	);
};

export default Home;