import { useState, Fragment } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import styles from './stylesheets/CPDash_TrackdayState.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

const TrackdayState = ({ allUsers, allTrackdays, allTrackdaysFULL }) => {
	const [selectedTrackday, setSelectedTrackday] = useState(''); // Tracks what the current working trackday is 

	const trackdayRegNumbers = allTrackdays.find((td) => td.id === selectedTrackday._id)

	let preRegistrations = 0;
	let gateRegistrations = 0;

	if (!allUsers || !allTrackdaysFULL) {
		return null;
	} else {
		allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
		allTrackdaysFULL.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
	}


	// Modify date of allTrackdays to be a nice format
	allTrackdaysFULL.forEach((trackday) => {
		const date = new Date(trackday.date)
		const weekday = date.toLocaleString('default', { weekday: 'short' })
		const month = date.toLocaleString('default', { month: 'long' })
		const numericDay = date.toLocaleString('default', { day: 'numeric' })
		const formattedDate = weekday + ' ' + month + ' ' + numericDay;
		trackday.prettyDate = formattedDate;
	})

	// Get registration break down.
	if (selectedTrackday) selectedTrackday.members.forEach((memberEntry) => memberEntry.paymentMethod === 'gate' ? gateRegistrations++ : preRegistrations++)


	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Trackday State-
					<form onSubmit={(e) => updatePaid(e, !selectedEntry.paid)}>
						<div className={styles.inputPairing}>
							<select name="trackday" id="trackday" onChange={() => setSelectedTrackday(allTrackdaysFULL.find((td) => td._id === trackday.value))} required>
								<option style={{ textAlign: 'center' }} key="none" value="">---Select---</option>
								{allTrackdaysFULL.map((trackday) => <option key={trackday._id} value={trackday._id}>{trackday.prettyDate}</option>)}
							</select>
						</div>
					</form>
				</h1>

				{selectedTrackday &&
					<>
						<div className={styles.tdSummary}>
							<h2>Trackday Summary</h2>
							<div>
								<div className={styles.summaryEntry}>
									<div>Green</div>
									<div>{trackdayRegNumbers.green}</div>
								</div>
								<div className={styles.summaryEntry}>
									<div>Yellow</div>
									<div>{trackdayRegNumbers.yellow}</div>
								</div>
								<div className={styles.summaryEntry}>
									<div>Red</div>
									<div>{trackdayRegNumbers.red}</div>
								</div>
								<div className={styles.summaryEntry}>
									<div style={{ fontWeight: 'bold' }}>Total</div>
									<div style={{ fontWeight: 'bold' }}>{trackdayRegNumbers.green + trackdayRegNumbers.yellow + trackdayRegNumbers.red}</div>
								</div>
							</div>

							<div>
								<div className={styles.summaryEntry}>
									<div>Pre-Registrations</div>
									<div>{preRegistrations}</div>
								</div>
								<div className={styles.summaryEntry}>
									<div>Gate Registrations</div>
									<div>{gateRegistrations}</div>
								</div>
								<div className={styles.summaryEntry}>
									<div>Walk Ons</div>
									<div>{selectedTrackday.walkons.length}</div>
								</div>
								<div className={styles.summaryEntry}>
									<div>Guests</div>
									<div>{selectedTrackday.guests}</div>
								</div>
							</div>
						</div>

						<div className={styles.tdRiders}>
							<h2>Riders</h2>
							<div style={{ fontWeight: 'bold' }}>Name</div>
							<div style={{ fontWeight: 'bold' }}>Waiver</div>
							<div style={{ fontWeight: 'bold' }}>Payment Method</div>
							<div style={{ fontWeight: 'bold' }}>Paid</div>
							<div style={{ fontWeight: 'bold' }}>Checked In</div>
							<h3>Green Group</h3>

							{selectedTrackday.members.filter((memberEntry) => memberEntry.user.group === 'green').map((memberEntry) => {
								return (
									<Fragment key={memberEntry.user._id}>
										<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
										{memberEntry.user.waiver ? <img src={checkmark}></img> : <img src={errormark}></img>}
										<div>{memberEntry.paymentMethod}</div>
										{memberEntry.paid ? <img src={checkmark}></img> : <img src={errormark}></img>}
										{memberEntry.checkedIn.length ? <img src={checkmark}></img> : <img src={errormark}></img>}
									</Fragment>
								)
							})}
							{selectedTrackday.walkons.filter((user) =>user.group === 'green').map((user) => {
								return (
									<Fragment key={user.firstName+user.lastName+user.group}>
										<div className="capitalizeEach">{user.firstName}, {user.lastName}</div>
										<img src={checkmark}></img> 
										<div>Walk On</div>
										<img src={checkmark}></img>
										<img src={checkmark}></img>
									</Fragment>
								)
							})}
							<span className={styles.divisor}></span>

							<h3>Yellow Group</h3>

							{selectedTrackday.members.filter((memberEntry) => memberEntry.user.group === 'yellow').map((memberEntry) => {
								return (
									<Fragment key={memberEntry.user._id}>
										<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
										{memberEntry.user.waiver ? <img src={checkmark}></img> : <img src={errormark}></img>}
										<div>{memberEntry.paymentMethod}</div>
										{memberEntry.paid ? <img src={checkmark}></img> : <img src={errormark}></img>}
										{memberEntry.checkedIn.length ? <img src={checkmark}></img> : <img src={errormark}></img>}
									</Fragment>
								)
							})}
							<span className={styles.divisor}></span>
							<h3>Red Group</h3>

							{selectedTrackday.members.filter((memberEntry) => memberEntry.user.group === 'red').map((memberEntry) => {
								return (
									<Fragment key={memberEntry.user._id}>
										<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
										{memberEntry.user.waiver ? <img src={checkmark}></img> : <img src={errormark}></img>}
										<div>{memberEntry.paymentMethod}</div>
										{memberEntry.paid ? <img src={checkmark}></img> : <img src={errormark}></img>}
										{memberEntry.checkedIn.length ? <img src={checkmark}></img> : <img src={errormark}></img>}
									</Fragment>
								)
							})}
							<span className={styles.divisor}></span>
						</div>
					</>
				}
			</div>



		</>
	);
};

export default TrackdayState;