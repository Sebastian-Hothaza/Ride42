import { useOutletContext, Link, NavLink } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card"


import './stylesheets/dates.css'

import square from '../assets/square.jpg'

function Dates() {
	const allTrackdays = useOutletContext();

	// Sort all trackdays as order may not be correct when received from back end
	if (allTrackdays) allTrackdays.sort((a,b) => (a.date > b.date) ? 1: ((b.date > a.date) ? -1 : 0))




	const datesArray = [] // Array of objects in format [{date: x, layout: x, id: x}, ...]
	// Build datesArray
	if (allTrackdays) {
		allTrackdays.map((trackday) => {
			const date = new Date(trackday.date)
			const weekday = date.toLocaleString('default', { weekday: 'short' })
			const month = date.toLocaleString('default', { month: 'long' })
			const numericDay = date.toLocaleString('default', { day: 'numeric' })

			let formattedLayout
			switch (trackday.layout) {
				case 'tbd':
					formattedLayout = 'Voted On'
					break;
				case 'technical':
					formattedLayout = 'Technical'
					break;
				case 'Rtechnical':
					formattedLayout = 'Reverse Technical'
					break;
				case 'alien':
					formattedLayout = 'Alien'
					break;
				case 'Ralien':
					formattedLayout = 'Reverse Alien'
					break;
				case 'modified':
					formattedLayout = 'Modified'
					break;
				case 'Rmodified':
					formattedLayout = 'Reverse Modified'
					break;
				case 'long':
					formattedLayout = 'Long Track'
					break;
				default:
					formattedLayout = '?'
					break;
			}

			const dateInfo = {
				formattedDate: weekday + ' ' + month + ' ' + numericDay,
				layout: formattedLayout,
				id: trackday.id
			}
			datesArray.push(dateInfo)
		})
	}



	const datesBody =
		<>
			<ul id="datesUl">
				{datesArray.map((dateInfo) => (
					<li key={dateInfo.id}>
						<div className="dateEntry">
							<div>{dateInfo.formattedDate}</div>
							<div id="layout">{dateInfo.layout}</div>
						</div>
					</li>
				))}
			</ul>
			<NavLink id="bookBtn" to="/dashboard">Book Your Day</NavLink>
		</>


	return (
		<>
			<Navbar />
			<div className="main">
				<Card heading='Dates & Layout' body={datesBody} img={square} inverted={false} />
				{/* <Card heading='Schedule' body={'mockText'} img={square} inverted={true}/> */}
				{/* <Card heading='Pricing Info' body={'mockText'} img={square} inverted={false}/> */}
			</div>


			<Footer />
		</>
	);
};

export default Dates;