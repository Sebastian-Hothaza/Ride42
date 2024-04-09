import { useOutletContext, Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import Card from "../components/Card"


import styles from './stylesheets/Dates.module.css'

import square from '../assets/square.jpg'

function Dates() {
	const [allTrackdays, setAllTrackdays] = useState('');
	const { APIServer } = useOutletContext();
	async function fetchAPIData() {
		try {
			const response = await fetch(APIServer + 'presentTrackdays');
			if (!response.ok) throw new Error("Failed to get API Data")
			const data = await response.json();
			setAllTrackdays(data);
		} catch (err) {
			console.log(err.message)
		}
	}

	useEffect(() => {
		fetchAPIData();
	}, [])




	// Sort all trackdays as order may not be correct when received from back end
	if (allTrackdays) allTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))




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



	const HTML_Dates = <>
		<ul id={styles.datesUl}>
			{datesArray.map((dateInfo) => (
				<li key={dateInfo.id}>
					<div className={styles.dateEntry}>
						<div>{dateInfo.formattedDate}</div>
						<div id={styles.layout}>{dateInfo.layout}</div>
					</div>
				</li>
			))}
		</ul>
		<NavLink className={styles.bookBtn} to="/dashboard">Book Your Day</NavLink>
	</>

	const HTML_PricingInfo = <div id={styles.pricingCard}>
		<div className={styles.priceEntry}>
			<div>Pre-Registration (7 days in advance):</div>
			<div style={{ fontWeight: 'bold' }}>$170</div>
		</div>
		<br></br>
		<div className={styles.priceEntry}>
			<div>Gate Registration: </div>
			<div style={{ fontWeight: 'bold' }}>$190</div>
		</div>
		<br></br>
		<br></br>
		<br></br>
		<span style={{ fontStyle: 'italic' }}>Gate registrations are space permitting and BBQ lunch is not guaranteed.</span>
	</div>

	const HTML_Schedule = <table>
		<tbody>
			<tr>
				<td>6pm the day before</td>
				<td>Gates open, camp overnight if you’d like!</td>
			</tr>
			<tr>
				<td>10pm the day before</td>
				<td>Gates lock</td>
			</tr>
			<tr>
				<td>8am</td>
				<td>Gates open</td>
			</tr>
			<tr>
				<td>9:30am</td>
				<td>Mandatory riders meeting</td>
			</tr>
			<tr>
				<td>9:50am</td>
				<td>Sighting lap - mandatory for new riders</td>
			</tr>
			<tr>
				<td>10am</td>
				<td>Lapping starts</td>
			</tr>
			<tr>
				<td>1pm</td>
				<td>Lunch break(1 hour)</td>
			</tr>
			<tr>
				<td>6pm</td>
				<td>Lapping ends</td>
			</tr>
		</tbody>
	</table>

	return (
		<div className="content">
			<Card heading='Dates & Layout' body={HTML_Dates} img={square} inverted={false} />
			<Card heading='Schedule' body={HTML_Schedule} img={square} inverted={true} />
			<Card heading='Pricing Info' body={HTML_PricingInfo} img={square} inverted={false} />
		</div>
	);
};

export default Dates;