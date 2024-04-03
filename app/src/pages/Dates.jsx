import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
function Dates(){
	const allTrackdays = useOutletContext();

	return (
		<div>
			<Navbar />
			<h1>Dates</h1>
			{allTrackdays && allTrackdays.map((item)=>{
				return <li key={item.id}>{item.date}</li>
			})}
			<Footer />
		</div>
	);
};
	
	export default Dates;