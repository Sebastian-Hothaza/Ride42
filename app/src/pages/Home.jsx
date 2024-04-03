import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

import cover from '../assets/cover.jpg'

import './stylesheets/home.css'

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
		</div>
		</>
	);
};

export default Home;