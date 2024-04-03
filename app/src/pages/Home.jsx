import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card"

import square from '../assets/square.jpg'


import './stylesheets/home.css'

const mockText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ultrices vitae auctor eu augue ut. Maecenas accumsan lacus vel facilisis. Pharetra diam sit amet nisl suscipit. Nibh ipsum consequat nisl vel pretium lectus quam id. Enim lobortis scelerisque fermentum dui faucibus in ornare. Facilisi nullam vehicula ipsum a arcu cursus vitae congue. In ornare quam viverra orci sagittis eu volutpat.'

const Home = () => {
	return (
		<>
		<Navbar />
		<div className="main">
			<div className="heroImage">
				<div className="heroText">
					{/* TODO: Add some hero text content here */}
				</div>
			</div>
			<div className="cards">
				<Card heading='About Us' body={mockText} img={square} inverted={false}/>
				<Card heading='What We Offer' body={mockText} img={square} inverted={true}/>
			</div>
		</div>
		<Footer />
		</>
	);
};

export default Home;