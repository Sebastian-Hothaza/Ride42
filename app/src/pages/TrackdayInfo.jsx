import { useOutletContext, Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import Card from "../components/Card"


import styles from './stylesheets/TrackdayInfo.module.css'

import dates from '../assets/dates.jpg'
import schedule from '../assets/schedule.jpg'
import price from '../assets/price.jpg'
import readyToRide from '../assets/readyToRide.jpg'


function TrackdayInfo() {
	const [allTrackdays, setAllTrackdays] = useState(() => JSON.parse(localStorage.getItem('allTrackdays')) || null);
	const { APIServer } = useOutletContext();
	const datesArray = [];


	// Load in all trackdays from API
	useEffect(() => {
		async function fetchAPIData() {
			try {
				const response = await fetch(APIServer + 'presentTrackdays');
				if (!response.ok) throw new Error("Failed to get API Data for presentTrackdays")
				const data = await response.json();
				const filteredData = data.filter(trackday => trackday.status !== "archived");// exclude archived trackdays
				setAllTrackdays(filteredData.length? filteredData : null); 
			} catch (err) {
				console.log(err.message)
			}
		}
		fetchAPIData();
	}, [])

	// Update localStorage if needed after API returns
	useEffect(() => {
		const storedAllTrackdays = JSON.parse(localStorage.getItem('allTrackdays'));
		if (JSON.stringify(storedAllTrackdays) !== JSON.stringify(allTrackdays)) {
			localStorage.setItem('allTrackdays', JSON.stringify(allTrackdays));
		}

	}, [allTrackdays]);

	// Sort all trackdays as order may not be correct when received from back end
	if (allTrackdays) {
		allTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))

		// Build datesArray
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
				id: trackday.id,
				formattedDate: weekday + ' ' + month + ' ' + numericDay,
				layout: formattedLayout,
				status: trackday.status
			}
			datesArray.push(dateInfo)
		})

	}

	const HTML_Dates = datesArray.length ?
		<>
			<ul id={styles.datesUl}>
				{datesArray.map((dateInfo) => (
					<li key={dateInfo.id}>
						<div className={styles.dateEntry}>
							<div>{dateInfo.formattedDate}</div>
							{dateInfo.status === 'cancelled' ? <div id={styles.layout}>Cancelled</div> : <div id={styles.layout}>{dateInfo.layout}</div>}
						</div>
					</li>
				))}
			</ul>
			<NavLink className={styles.bookBtn} to="/dashboard">Book Your Day</NavLink>
		</> :
		<>
			<div className={styles.priceEntry} style={{ justifyContent: "center" }}>Coming soon! ⏰</div>
		</>



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

	const HTML_PricingInfo = <div id={styles.pricingCard}>
		<div className={styles.priceEntry}>
			<div>Pre-Registration (7 days ahead):</div>
			<div style={{ fontWeight: 'bold' }}>$180</div>
		</div>
		<br></br>
		<div className={styles.priceEntry}>
			<div>Gate Registration: </div>
			<div style={{ fontWeight: 'bold' }}>$200</div>
		</div>
		<br></br>
		<br></br>
		<div>E-Transfers should be sent to pay@ride42.ca</div>
		<br></br>
		<span style={{ fontStyle: 'italic' }}>Gate registrations are space permitting and BBQ lunch is not guaranteed.</span>
	</div>

	const HTML_OurTrackdays = <><p>
		Ride42 is proud to offer unique benefits to our riders. We feature a fully integrated trackday management system which has you, the rider, at the center. To book a trackday online, you must first sign up as a member. If you’d prefer to just show up and ride, that’s fine too! Gate registrations are always space permitting however, and you won’t have access to all the neat member features. Once signed up as a member, you will have access to the three main tabs from your dashboard.
		<br></br><br></br>
		<span style={{ fontWeight: 'bold' }}>My Profile –</span> View and edit your account information as well as your current group. It is important you keep this information accurate (Ie. Your emergency contact info)
		<br></br>
		<span style={{ fontWeight: 'bold' }}>My Trackdays –</span> Book, view, reschedule and cancel your trackdays from one convenient spot
		<br></br>
		<span style={{ fontWeight: 'bold' }}>My Garage –</span> Manage your bikes; you will receive a unique QR sticker at your next trackday.
		<br></br>
		<br></br>
	</p>
		<NavLink className={styles.bookBtn} to="/dashboard">Join Now!</NavLink>
	</>

	return (
		<div className="content">
			<Card heading='Dates & Layout' body={HTML_Dates} img={dates} inverted={false} />
			<Card heading='Schedule' body={HTML_Schedule} img={schedule} inverted={true} />
			<Card heading='Pricing Info' body={HTML_PricingInfo} img={price} inverted={false} />
			<Card heading='Ready to Ride?' body={HTML_OurTrackdays} img={readyToRide} inverted={true} />
		</div>
	);
};

export default TrackdayInfo;