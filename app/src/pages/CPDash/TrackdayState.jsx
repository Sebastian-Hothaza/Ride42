import { useState, Fragment } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Loading from '../../components/Loading';

import styles from './stylesheets/TrackdayState.module.css'

import checkmark from './../../assets/checkmark.png'
import waiverMissing from './../../assets/waiver_missing.png'
import errormark from './../../assets/error.png'
import paid from './../../assets/paid.png'
import unpaid from './../../assets/unpaid.png'
import checkedIn from './../../assets/checkedIn.png'
import notCheckedIn from './../../assets/notCheckedIn.png'

const TrackdayState = ({ fetchAPIData, allUsers, allTrackdays, allTrackdaysFULL }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackdayId is 

	let preRegistrations = 0;
	let gateRegistrations = 0;
	let selectedTrackday;
	let trackdayRegNumbers;
	let numGridLines;
	let years = [];
	let consolidatedArray = []; // Includes both users from members array AND walkons array for consolidated printing

	let linesPrinted = { green: 0, yellow: 0, red: 0 };


	// Augment prettydate of allTrackdaysFULL to be a nice format
	allTrackdaysFULL.forEach((trackday) => {
		const date = new Date(trackday.date)
		const weekday = date.toLocaleString('default', { weekday: 'short' })
		const month = date.toLocaleString('default', { month: 'long' })
		const numericDay = date.toLocaleString('default', { day: 'numeric' })
		const formattedDate = weekday + ' ' + month + ' ' + numericDay;
		if (!years.includes(date.getFullYear())) years.push(date.getFullYear()) // Add year to years array
		trackday.prettyDate = formattedDate;
	})


	if (!allUsers || !allTrackdaysFULL) {
		return null;
	} else {
		// Only show trackdays for currently selected year
		allTrackdaysFULL = allTrackdaysFULL.filter(trackday => {
			const candidateTrackdayYear = new Date(trackday.date).getFullYear();
			return candidateTrackdayYear == selectedYear;
		});
		allTrackdaysFULL.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
	}



	// Set the selected trackday 
	if (selectedTrackdayId) {
		selectedTrackday = allTrackdaysFULL.find((td) => td._id === selectedTrackdayId)

	}


	if (selectedTrackday) {
		// Get registration break down.
		selectedTrackday.members.forEach((memberEntry) => memberEntry.paymentMethod === 'gate' ? gateRegistrations++ : preRegistrations++)
		// Used to determine number of riders in each group
		trackdayRegNumbers = allTrackdays.find((td) => td.id === selectedTrackday._id)
		// Get number of lines grid will have
		numGridLines = Math.max(trackdayRegNumbers.green, trackdayRegNumbers.yellow, trackdayRegNumbers.red);

		// Augment walkons to include params needed for printing
		selectedTrackday.walkons.forEach((walkOnEntry) => {
			walkOnEntry.user = {
				_id: walkOnEntry._id,
				firstName: walkOnEntry.firstName,
				lastName: walkOnEntry.lastName,
				group: walkOnEntry.group,
				waiver: true,
			}
			walkOnEntry.paid = true;
			walkOnEntry.paymentMethod = 'WalkOn'
			walkOnEntry.checkedIn = ['foobar']
		})

		// Prepare consolidated array for printing
		consolidatedArray = selectedTrackday.members.concat(selectedTrackday.walkons).sort((a, b) => (a.user.firstName.toLowerCase() > b.user.firstName.toLowerCase()) ? 1 : ((b.user.firstName.toLowerCase() > a.user.firstName.toLowerCase()) ? -1 : 0))

		// If trackday being shown is archived, we can ignore waiver
		if (selectedTrackday.status == 'archived') consolidatedArray.forEach((entry) => entry.user.waiver = true)
	}



	async function handleRefresh() {
		setActiveModal({ type: 'loading', msg: 'Refreshing data' });
		await fetchAPIData();
		setActiveModal('');
	}


	function printBlanks(num) {
		return Array.from({ length: num }, (_, index) => <div className={`${styles.userEntry} ${styles.blankLine}`} key={index}></div>);
	}




	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Trackday State:
					<form>
						<div className={styles.inputPairing}>
							<select name="yearSelect" id="yearSelect" defaultValue={selectedYear} onChange={() => { setSelectedTrackdayId(''); setSelectedYear(yearSelect.value) }} required>
								{years.map((year) => <option value={year} key={year}>{year}</option>)}
							</select>
						</div>
					</form>
					<form>
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
							<div className={styles.regSummary}>
								<div className={styles.regSummaryEntry}>
									<div>Pre-Reg: </div>
									<div>{preRegistrations}</div>
								</div>
								<div className={styles.regSummaryEntry}>
									<div>Gate: </div>
									<div>{gateRegistrations + selectedTrackday.walkons.length}</div>
								</div>
								<div className={styles.regSummaryEntry}>
									<div>Guests: </div>
									<div>{selectedTrackday.guests}</div>
								</div>
								<div className={styles.regSummaryEntry}>
									<div>Staff: </div>
									<div>{selectedTrackday.members.filter((member) => member.user.memberType != 'regular').length}</div>
								</div>
							</div>



						</div>

						{/* TD RIDERS */}

						<div className={styles.tdRiders}>
							<h1>Riders ({trackdayRegNumbers.green + trackdayRegNumbers.yellow + trackdayRegNumbers.red})</h1>
							<h2>Green Group ({trackdayRegNumbers.green})</h2>
							<h2>Yellow Group ({trackdayRegNumbers.yellow})</h2>
							<h2>Red Group ({trackdayRegNumbers.red})</h2>


							<div className={styles.groupCell}>
								{consolidatedArray.filter((memberEntry) => memberEntry.user.group === 'green').map((memberEntry) => {
									linesPrinted.green++;
									return (
										<div className={styles.userEntry} key={memberEntry.user._id}>
											<div className={styles.userName}>
												<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
												{memberEntry.user.waiver ? <div></div> : <img src={waiverMissing}></img>}
											</div>
											<div className={styles.userInfo}>
												{memberEntry.paid ? <img src={paid}></img> : <img src={unpaid}></img>}
												<div>{memberEntry.paymentMethod}</div>
												{memberEntry.checkedIn.length ? <img src={checkedIn}></img> : <img src={notCheckedIn}></img>}
											</div>
										</div>
									)
								})}
								{printBlanks(numGridLines - linesPrinted.green)}
							</div>


							<div className={styles.groupCell}>
								{consolidatedArray.filter((memberEntry) => memberEntry.user.group === 'yellow').map((memberEntry) => {
									linesPrinted.yellow++;
									return (
										<div className={styles.userEntry} key={memberEntry.user._id}>
											<div className={styles.userName}>
												<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
												{memberEntry.user.waiver ? <div></div> : <img src={waiverMissing}></img>}
											</div>
											<div className={styles.userInfo}>
												{memberEntry.paid ? <img src={paid}></img> : <img src={unpaid}></img>}
												<div>{memberEntry.paymentMethod}</div>
												{memberEntry.checkedIn.length ? <img src={checkedIn}></img> : <img src={notCheckedIn}></img>}
											</div>
										</div>
									)
								})}
								{printBlanks(numGridLines - linesPrinted.yellow)}
							</div>



							<div className={styles.groupCell}>
								{consolidatedArray.filter((memberEntry) => memberEntry.user.group === 'red').map((memberEntry) => {
									linesPrinted.red++;
									return (
										<div className={styles.userEntry} key={memberEntry.user._id}>
											<div className={styles.userName}>
												<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
												{memberEntry.user.waiver ? <div></div> : <img src={waiverMissing}></img>}
											</div>
											<div className={styles.userInfo}>
												{memberEntry.paid ? <img src={paid}></img> : <img src={unpaid}></img>}
												<div>{memberEntry.paymentMethod}</div>
												{memberEntry.checkedIn.length ? <img src={checkedIn}></img> : <img src={notCheckedIn}></img>}
											</div>
										</div>
									)
								})}
								{printBlanks(numGridLines - linesPrinted.red)}

							</div>


						</div>
						{/* MOBILE */}
						{/* <div className={styles.tdRiders_Mobile}>
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
												{memberEntry.user.waiver ? <img src={waiverMissing}></img> : <img src={errormark}></img>}
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
											<div>Walk On</div>
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
											<div>Walk On</div>
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
											<div>Walk On</div>
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
						</div> */}
					</>
				}

			</div >


			<Loading open={activeModal.type === 'loading'}>
				{activeModal.msg}
			</Loading>

		</>
	);
};

export default TrackdayState;