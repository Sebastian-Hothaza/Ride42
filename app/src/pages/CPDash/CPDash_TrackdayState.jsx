import { useState, Fragment } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_TrackdayState.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

const TrackdayState = ({ fetchAPIData, allUsers, allTrackdays, allTrackdaysFULL }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
	const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackdayId is 

	let preRegistrations = 0;
	let gateRegistrations = 0;
	let selectedTrackday;
	let trackdayRegNumbers;

	if (!allUsers || !allTrackdaysFULL) {
		return null;
	} else {
		allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
		allTrackdaysFULL.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
	}

	// Augment prettydate of allTrackdays to be a nice format
	allTrackdaysFULL.forEach((trackday) => {
		const date = new Date(trackday.date)
		const weekday = date.toLocaleString('default', { weekday: 'short' })
		const month = date.toLocaleString('default', { month: 'long' })
		const numericDay = date.toLocaleString('default', { day: 'numeric' })
		const formattedDate = weekday + ' ' + month + ' ' + numericDay;
		trackday.prettyDate = formattedDate;
	})


	// Set the selected trackday and sort its members array
	if (selectedTrackdayId) {
		selectedTrackday = allTrackdaysFULL.find((td) => td._id === selectedTrackdayId)
		selectedTrackday.members.sort((a, b) => (a.user.firstName > b.user.firstName) ? 1 : ((b.user.firstName > a.user.firstName) ? -1 : 0))
	}


	if (selectedTrackday) {
		// Get registration break down.
		selectedTrackday.members.forEach((memberEntry) => memberEntry.paymentMethod === 'gate' ? gateRegistrations++ : preRegistrations++)
		// Used to determine number of riders in each group
		trackdayRegNumbers = allTrackdays.find((td) => td.id === selectedTrackday._id)
	}

	async function handleRefresh() {
		setActiveModal({ type: 'loading', msg: 'Refreshing data' });
		await fetchAPIData();
		setActiveModal('');
	}


	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Trackday State-
					<form onSubmit={(e) => updatePaid(e, !selectedEntry.paid)}>
						<div className={styles.inputPairing}>
							<select name="trackday" id="trackday" onChange={() => setSelectedTrackdayId(trackday.value)} required>
								<option style={{ textAlign: 'center' }} key="none" value="">---Select---</option>
								{allTrackdaysFULL.map((trackday) => <option key={trackday._id} value={trackday._id}>{trackday.prettyDate}</option>)}
							</select>
						</div>
					</form>
					<button id={styles.refreshBtn} onClick={() => handleRefresh()}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined `}>refresh</span></button>
				</h1>

				{selectedTrackday &&
					<>
						<div className={styles.tdSummary}>
							<h2>Trackday Summary</h2>
							<div className={styles.groupSummary}>
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

							<div className={styles.regSummary}>
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
							{selectedTrackday.walkons.filter((user) => user.group === 'green').map((user) => {
								return (
									<Fragment key={user.firstName + user.lastName + user.group}>
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
							{selectedTrackday.walkons.filter((user) => user.group === 'yellow').map((user) => {
								return (
									<Fragment key={user.firstName + user.lastName + user.group}>
										<div className="capitalizeEach">{user.firstName}, {user.lastName}</div>
										<img src={checkmark}></img>
										<div>Walk On</div>
										<img src={checkmark}></img>
										<img src={checkmark}></img>
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
							{selectedTrackday.walkons.filter((user) => user.group === 'red').map((user) => {
								return (
									<Fragment key={user.firstName + user.lastName + user.group}>
										<div className="capitalizeEach">{user.firstName}, {user.lastName}</div>
										<img src={checkmark}></img>
										<div>Walk On</div>
										<img src={checkmark}></img>
										<img src={checkmark}></img>
									</Fragment>
								)
							})}
							<span className={styles.divisor}></span>
						</div>
						{/* MOBILE */}
						<div className={styles.tdRiders_Mobile}>
							<h2>Riders</h2>
							<h3>Green Group</h3>

							{selectedTrackday.members.filter((memberEntry) => memberEntry.user.group === 'green').map((memberEntry) => {
								return (
									<Fragment key={memberEntry.user._id}>
										<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
										<div className={styles.memberDetail}>
											<div>{memberEntry.paymentMethod}</div>
											<div className={styles.statusEntry}>
												Paid
												{memberEntry.paid ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
											<div className={styles.statusEntry}>
												Waiver
												{memberEntry.user.waiver ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
											<div className={styles.statusEntry}>
												Checked In
												{memberEntry.checkedIn.length ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
										</div>
									</Fragment>
								)
							})}
							{selectedTrackday.walkons.filter((user) => user.group === 'green').map((user) => {
								return (
									<Fragment key={user._id}>
										<div className="capitalizeEach">{user.firstName}, {user.lastName}</div>
										<div className={styles.memberDetail}>
											<div>{paymentMethod}</div>
											<div className={styles.statusEntry}>
												Paid
												<img src={checkmark}></img>
											</div>
											<div className={styles.statusEntry}>
												Waiver
												<img src={checkmark}></img>
											</div>
											<div className={styles.statusEntry}>
												Checked In
												<img src={checkmark}></img>
											</div>
										</div>
									</Fragment>
								)
							})}

							<h3>Yellow Group</h3>

							{selectedTrackday.members.filter((memberEntry) => memberEntry.user.group === 'yellow').map((memberEntry) => {
								return (
									<Fragment key={memberEntry.user._id}>
										<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
										<div className={styles.memberDetail}>
											<div>{memberEntry.paymentMethod}</div>
											<div className={styles.statusEntry}>
												Paid
												{memberEntry.paid ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
											<div className={styles.statusEntry}>
												Waiver
												{memberEntry.user.waiver ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
											<div className={styles.statusEntry}>
												Checked In
												{memberEntry.checkedIn.length ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
										</div>
									</Fragment>
								)
							})}
							{selectedTrackday.walkons.filter((user) => user.group === 'yellow').map((user) => {
								return (
									<Fragment key={user._id}>
										<div className="capitalizeEach">{user.firstName}, {user.lastName}</div>
										<div className={styles.memberDetail}>
											<div>{paymentMethod}</div>
											<div className={styles.statusEntry}>
												Paid
												<img src={checkmark}></img>
											</div>
											<div className={styles.statusEntry}>
												Waiver
												<img src={checkmark}></img>
											</div>
											<div className={styles.statusEntry}>
												Checked In
												<img src={checkmark}></img>
											</div>
										</div>
									</Fragment>
								)
							})}

							<h3>Red Group</h3>
							{selectedTrackday.members.filter((memberEntry) => memberEntry.user.group === 'red').map((memberEntry) => {
								return (
									<Fragment key={memberEntry.user._id}>
										<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
										<div className={styles.memberDetail}>
											<div>{memberEntry.paymentMethod}</div>
											<div className={styles.statusEntry}>
												Paid
												{memberEntry.paid ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
											<div className={styles.statusEntry}>
												Waiver
												{memberEntry.user.waiver ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
											<div className={styles.statusEntry}>
												Checked In
												{memberEntry.checkedIn.length ? <img src={checkmark}></img> : <img src={errormark}></img>}
											</div>
										</div>
									</Fragment>
								)
							})}
							{selectedTrackday.walkons.filter((user) => user.group === 'red').map((user) => {
								return (
									<Fragment key={user._id}>
										<div className="capitalizeEach">{user.firstName}, {user.lastName}</div>
										<div className={styles.memberDetail}>
											<div>{paymentMethod}</div>
											<div className={styles.statusEntry}>
												Paid
												<img src={checkmark}></img>
											</div>
											<div className={styles.statusEntry}>
												Waiver
												<img src={checkmark}></img>
											</div>
											<div className={styles.statusEntry}>
												Checked In
												<img src={checkmark}></img>
											</div>
										</div>
									</Fragment>
								)
							})}
						</div>
					</>
				}

			</div>


			<Loading open={activeModal.type === 'loading'}>
				{activeModal.msg}
			</Loading>

		</>
	);
};

export default TrackdayState;