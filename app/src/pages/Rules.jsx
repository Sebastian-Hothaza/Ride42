import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import Card from "../components/Card"

import square from '../assets/square.jpg'

const Rules = () => {
	const mockText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ultrices vitae auctor eu augue ut. Maecenas accumsan lacus vel facilisis. Pharetra diam sit amet nisl suscipit. Nibh ipsum consequat nisl vel pretium lectus quam id. Enim lobortis scelerisque fermentum dui faucibus in ornare. Facilisi nullam vehicula ipsum a arcu cursus vitae congue. In ornare quam viverra orci sagittis eu volutpat.'


	return (
		<div>
			<Navbar />
			<div className="main">
				<Card heading='Your Bike' body={mockText} img={square} inverted={false}/>
				<Card heading='Your Gear' body={mockText} img={square} inverted={true}/>
				<Card heading='Our Policies' body={mockText} img={square} inverted={false}/>
			</div>
			<Footer />
		</div>
	);
};

export default Rules;