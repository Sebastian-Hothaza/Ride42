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
				hello
				{allTrackdays && allTrackdays.map((item) => {
					return <li key={item.id}>{item.date}</li>
				})}
			</div>

			<Footer />
		</>
	);
};

export default Dates;