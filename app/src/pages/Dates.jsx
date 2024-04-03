import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
function Dates(){
	const allTrackdays = useOutletContext();

	return (
		<div>
			<Navbar />
			<h1>Dates</h1>
			{allTrackdays && allTrackdays.map((item)=>{
				return <li key={item.id}>{item.date}</li>
			})}
		</div>
	);
};
	
	export default Dates;