import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import './stylesheets/dates.css'

function Dates() {
	const allTrackdays = useOutletContext();

	return (
		<>
			<Navbar />
			<div className="main">
				{allTrackdays && allTrackdays.map((item) => {
					return <h2 key={item.id}>{item.date}</h2>
				})}
			</div>

			<Footer />
		</>
	);
};

export default Dates;