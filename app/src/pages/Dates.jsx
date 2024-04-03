import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card"

import './stylesheets/dates.css'

import square from '../assets/square.jpg'

function Dates() {
	const allTrackdays = useOutletContext();
	const datesArray = []
	if (allTrackdays){
		allTrackdays.map((trackday)=>{
			datesArray.push(trackday.date)
		})
	}

	const mockText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ultrices vitae auctor eu augue ut. Maecenas accumsan lacus vel facilisis. Pharetra diam sit amet nisl suscipit. Nibh ipsum consequat nisl vel pretium lectus quam id. Enim lobortis scelerisque fermentum dui faucibus in ornare. Facilisi nullam vehicula ipsum a arcu cursus vitae congue. In ornare quam viverra orci sagittis eu volutpat.'

	
	return (
		<>
			<Navbar />
			<div className="main">
				<Card heading='Dates' body={datesArray[0]+'   '+datesArray[1]} img={square} inverted={false}/>
				<Card heading='Schedule' body={mockText} img={square} inverted={true}/>
				<Card heading='Pricing Info' body={mockText} img={square} inverted={false}/>
			</div>
			

			<Footer />
		</>
	);
};

export default Dates;