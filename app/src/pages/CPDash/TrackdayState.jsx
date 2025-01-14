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

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown (in this case just spinner modal for refresh)
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);
	const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackdayId is
	const [showFinancials, setShowFinancials] = useState(false); // When set to true, shows financials instead of state 

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



	// Set the selected trackday and sort its members array. Augment object to include values for state display and financial display
	if (selectedTrackdayId) {
		selectedTrackday = allTrackdaysFULL.find((td) => td._id === selectedTrackdayId)
		selectedTrackday.members.sort((a, b) => (a.user.firstName > b.user.firstName) ? 1 : ((b.user.firstName > a.user.firstName) ? -1 : 0))


		// ------------------
		//   STATE DISPLAY
		// ------------------

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

		// ---------------------
		//   FINANCIAL DISPLAY
		// ---------------------

		// Adding ticket prices
		selectedTrackday.preRegPrice = selectedTrackday.ticketPrice.preReg;
		selectedTrackday.gatePrice = selectedTrackday.ticketPrice.gate;
		selectedTrackday.bundlePrice = selectedTrackday.ticketPrice.bundle;

		// Adding ticket quantities
		selectedTrackday.preRegQty = selectedTrackday.members.filter((member) => member.paymentMethod == 'etransfer' || member.paymentMethod == 'creditCard').length;
		selectedTrackday.gateQty = selectedTrackday.members.filter((member) => member.paymentMethod == 'gate').length + selectedTrackday.walkons.length;
		selectedTrackday.bundleQty = selectedTrackday.members.filter((member) => member.paymentMethod == 'credit' && member.user.memberType == 'regular').length;

		// Totals
		selectedTrackday.totalRevenue = (selectedTrackday.preRegPrice * selectedTrackday.preRegQty) + (selectedTrackday.gatePrice * selectedTrackday.gateQty) + (selectedTrackday.bundlePrice * selectedTrackday.bundleQty)
		selectedTrackday.totalExpense = 0;

		// Add additional revenue
		selectedTrackday.costs.filter((costObject) => costObject.amount < 0).map((costObject) => {
			if (costObject.type == 'fixed') {
				selectedTrackday.totalRevenue += costObject.amount * -1;
			} else {
				selectedTrackday.totalRevenue += costObject.amount * -1 * (selectedTrackday.members.length + selectedTrackday.walkons.length);
			}
		})

		// Add additional expenses
		selectedTrackday.costs.filter((costObject) => costObject.amount > 0).map((costObject) => {
			if (costObject.desc == 'BBQ') {
				selectedTrackday.totalExpense += costObject.amount * selectedTrackday.guests;
			} else if (costObject.type == 'fixed') {
				selectedTrackday.totalExpense += costObject.amount;
			} else {
				selectedTrackday.totalExpense += costObject.amount * (selectedTrackday.members.length + selectedTrackday.walkons.length);
			}
		})
	}


	// Download CSV file
	function download(trackday) {
		let outputText = `NOTE: This is best used when copied into XLS doc so that tabs display correctly\n\n`
		if (showFinancials) {
			outputText += `Revenue\n`
			outputText += `Pre-Reg Ticket Sales\t$${selectedTrackday.preRegPrice} x ${selectedTrackday.preRegQty}\t$${selectedTrackday.preRegPrice * selectedTrackday.preRegQty}\n`
			outputText += `Gate Ticket Sales\t$${selectedTrackday.gatePrice} x ${selectedTrackday.gateQty}\t$${selectedTrackday.gatePrice * selectedTrackday.gateQty}\n`
			outputText += `Bundle Ticket Sales\t$${selectedTrackday.bundlePrice} x ${selectedTrackday.bundleQty}\t$${selectedTrackday.bundlePrice * selectedTrackday.bundleQty}\n`
			selectedTrackday.costs.filter((costObject) => costObject.amount < 0).forEach((costObject) => {
				outputText += `${costObject.desc}\t`
				outputText += costObject.type == 'variable' ? `$${costObject.amount * -1} x ${selectedTrackday.members.length + selectedTrackday.walkons.length}\t` : `\t`;
				outputText += costObject.type == 'variable' ? `$${costObject.amount * -1 * (selectedTrackday.members.length + selectedTrackday.walkons.length)}\n` : `$${costObject.amount * -1}\n`
			})
			outputText += `Total Revenue\t\t$${selectedTrackday.totalRevenue}\n\n`


			outputText += `Expenses\n`
			outputText += `Track Rental\t\t$${selectedTrackday.costs.find((costObject) => costObject.desc == 'trackRental').amount}\n`
			selectedTrackday.costs.filter((costObject) => costObject.amount > 0 && costObject.desc != 'trackRental').forEach((costObject) => {
				outputText += `${costObject.desc}\t`
				if (costObject.desc == 'BBQ') {
					outputText += `$${costObject.amount} x ${selectedTrackday.guests}\t`
					outputText += costObject.type == 'variable' ? `$${costObject.amount * selectedTrackday.guests}\n` : `${costObject.amount}\n`
				} else {
					outputText += costObject.type == 'variable' ? `$${costObject.amount} x ${selectedTrackday.members.length + selectedTrackday.walkons.length}\t` : `\t`;
					outputText += costObject.type == 'variable' ? `$${costObject.amount * (selectedTrackday.members.length + selectedTrackday.walkons.length)}\n` : `${costObject.amount}\n`
				}
			})
			outputText += `Total Expenses\t\t$${selectedTrackday.totalExpense}\n\n`


			outputText += `Profit\t\t$${selectedTrackday.totalRevenue-selectedTrackday.totalExpense}\n`
		} else {
			outputText += `GREEN GROUP\nName\tWaiver\tPaid\tCheckIn\n`;
			trackday.members.filter(memberEntry => memberEntry.user.group == 'green').forEach((memberEntry) => {
				outputText += `${memberEntry.user.firstName} ${memberEntry.user.lastName}\t${allUsers.find((user) => user._id === memberEntry.user._id).waiver ? `✔` : ``}\t${memberEntry.paid ? `✔` : ``}\n`
			})
			outputText += `\n`
			outputText += `YELLOW GROUP\nName\tWaiver\tPaid\tCheckIn\n`;
			trackday.members.filter(memberEntry => memberEntry.user.group == 'yellow').forEach((memberEntry) => {
				outputText += `${memberEntry.user.firstName} ${memberEntry.user.lastName}\t${allUsers.find((user) => user._id === memberEntry.user._id).waiver ? `✔` : ``}\t${memberEntry.paid ? `✔` : ``}\n`
			})
			outputText += `\n`
			outputText += `RED GROUP\nName\tWaiver\tPaid\tCheckIn\n`;
			trackday.members.filter(memberEntry => memberEntry.user.group == 'red').forEach((memberEntry) => {
				outputText += `${memberEntry.user.firstName} ${memberEntry.user.lastName}\t${allUsers.find((user) => user._id === memberEntry.user._id).waiver ? `✔` : ``}\t${memberEntry.paid ? `✔` : ``}\n`
			})
		}

		// Prepare download file
		const link = window.document.createElement('a');
		const file = new Blob([outputText], { type: 'text/csv' });
		link.href = URL.createObjectURL(file);
		link.download = showFinancials ? `${trackday.prettyDate}_Financials.csv` : `${trackday.prettyDate}_CheckIn.csv`;
		document.body.appendChild(link);
		link.click();
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
								<option style={{ textAlign: 'center' }} key="none" value="">--- Select ---</option>
								{allTrackdaysFULL.map((trackday) => <option key={trackday._id} value={trackday._id}>{trackday.prettyDate}</option>)}
							</select>
						</div>
					</form>
					{selectedTrackday && <div className={styles.topButtons} >
						{showFinancials ?
							<button className={styles.stateBtn} onClick={() => setShowFinancials(false)}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined `}>event</span></button> :
							<button className={styles.stateBtn} onClick={() => setShowFinancials(true)}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined `}>savings</span></button>}
						<button className={styles.stateBtn} onClick={() => download(selectedTrackday)}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined `}>export_notes</span></button>
						<button className={styles.stateBtn} onClick={() => handleRefresh()}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined `}>refresh</span></button>
					</div>}
				</h1>

				{selectedTrackday && (showFinancials ?
					<>
						<div className={styles.reportGrid}>
							<h2>Revenue</h2>

							<div>Pre-Reg Ticket Sales</div>
							<div>${selectedTrackday.preRegPrice} x {selectedTrackday.preRegQty}</div>
							<div style={{ textAlign: 'right' }}>${selectedTrackday.preRegPrice * selectedTrackday.preRegQty}</div>

							<div>Gate Ticket Sales</div>
							<div>${selectedTrackday.gatePrice} x {selectedTrackday.gateQty}</div>
							<div style={{ textAlign: 'right' }}>${selectedTrackday.gatePrice * selectedTrackday.gateQty}</div>

							<div>Bundle Ticket Sales</div>
							<div>${selectedTrackday.bundlePrice} x {selectedTrackday.bundleQty}</div>
							<div style={{ textAlign: 'right' }}>${selectedTrackday.bundlePrice * selectedTrackday.bundleQty}</div>

							{selectedTrackday.costs.filter((costObject) => costObject.amount < 0).map((costObject) => {
								return (
									<Fragment key={costObject._id}>
										<div >{costObject.desc}</div>
										{costObject.type == 'variable' ? <div>${(costObject.amount * -1).toFixed(2)} x {selectedTrackday.members.length + selectedTrackday.walkons.length}</div> : <div></div>}
										{costObject.type == 'variable' ? <div style={{ textAlign: 'right' }}>${Math.round(costObject.amount * -1 * (selectedTrackday.members.length + selectedTrackday.walkons.length))}</div> :
											<div style={{ textAlign: 'right' }}>${Math.round(costObject.amount * -1)}</div>}
									</Fragment>
								)
							})}

							<h3>Total Revenue</h3>
							<h3></h3>
							<h3 style={{ textAlign: 'right' }}>${Math.round(selectedTrackday.totalRevenue)}</h3>

							<h2>Expenses</h2>
							<div>Track Rental</div>
							<div></div>
							<div style={{ textAlign: 'right' }}>${selectedTrackday.costs.find((costObject) => costObject.desc == 'trackRental').amount}</div>

							{selectedTrackday.costs.filter((costObject) => costObject.amount > 0 && costObject.desc != 'trackRental').map((costObject) => {
								return (
									<Fragment key={costObject._id}>
										<div >{costObject.desc}</div>
										{costObject.desc == 'BBQ' ? <div>${(costObject.amount).toFixed(2)} x {selectedTrackday.guests}</div> :
											costObject.type == 'variable' ? <div >${(costObject.amount).toFixed(2)} x {selectedTrackday.members.length + selectedTrackday.walkons.length}</div> : <div ></div>
										}
										{costObject.desc == 'BBQ' ? <div style={{ textAlign: 'right' }}>${Math.round(costObject.amount * selectedTrackday.guests)}</div> :
											costObject.type == 'variable' ? <div style={{ textAlign: 'right' }}>${Math.round(costObject.amount * (selectedTrackday.members.length + selectedTrackday.walkons.length))}</div> : <div style={{ textAlign: 'right' }}>${Math.round(costObject.amount)}</div>
										}


									</Fragment>
								)
							})}

							<h3>Total Expenses</h3>
							<h3></h3>
							<h3 style={{ textAlign: 'right' }}>${Math.round(selectedTrackday.totalExpense)}</h3>

							<h3>Profit</h3>
							<h3></h3>
							<h3 style={{ textAlign: 'right' }}>${Math.round(selectedTrackday.totalRevenue - selectedTrackday.totalExpense)}</h3>
						</div>

						{/* MOBILE */}

						<div className={styles.reportGrid_Mobile}>
							<h2>Revenue</h2>

							<div className={styles.lineEntry}>
								<div>Pre-Reg Ticket Sales</div>
								<div className={styles.price}>
									<div><em>${selectedTrackday.preRegPrice} x {selectedTrackday.preRegQty}</em></div>
									<div style={{ textAlign: 'right' }}>${selectedTrackday.preRegPrice * selectedTrackday.preRegQty}</div>
								</div>
							</div>

							<div className={styles.lineEntry}>
								<div>Gate Ticket Sales</div>
								<div className={styles.price}>
									<div><em>${selectedTrackday.gatePrice} x {selectedTrackday.gateQty}</em></div>
									<div style={{ textAlign: 'right' }}>${selectedTrackday.gatePrice * selectedTrackday.gateQty}</div>
								</div>
							</div>

							<div className={styles.lineEntry}>
								<div>Bundle Ticket Sales</div>
								<div className={styles.price}>
									<div><em>${selectedTrackday.bundlePrice} x {selectedTrackday.bundleQty}</em></div>
									<div style={{ textAlign: 'right' }}>${selectedTrackday.bundlePrice * selectedTrackday.bundleQty}</div>
								</div>
							</div>


							{selectedTrackday.costs.filter((costObject) => costObject.amount < 0).map((costObject) => {
								return (
									<div className={styles.lineEntry} key={costObject._id}>
										<div >{costObject.desc}</div>
										<div className={styles.price}>
											{costObject.type == 'variable' ? <div>${(costObject.amount * -1).toFixed(2)} x {selectedTrackday.members.length + selectedTrackday.walkons.length}</div> : <div></div>}
											{costObject.type == 'variable' ? <div style={{ textAlign: 'right' }}>${Math.round(costObject.amount * -1 * (selectedTrackday.members.length + selectedTrackday.walkons.length))}</div> :
												<div style={{ textAlign: 'right' }}>${Math.round(costObject.amount * -1)}</div>}
										</div>

									</div>
								)
							})}


							<div className={styles.lineTotal}>
								<h3>Total Revenue</h3>
								<h3 style={{ textAlign: 'right' }}>${Math.round(selectedTrackday.totalRevenue)}</h3>
							</div>


							<h2>Expenses</h2>
							<div className={styles.lineEntry}>
								<div>Track Rental</div>
								<div className={styles.price}>
									<div></div>
									<div style={{ textAlign: 'right' }}>${selectedTrackday.costs.find((costObject) => costObject.desc == 'trackRental').amount}</div>
								</div>
							</div>


							{selectedTrackday.costs.filter((costObject) => costObject.amount > 0 && costObject.desc != 'trackRental').map((costObject) => {
								return (
									<div className={styles.lineEntry} key={costObject._id}>
										<div >{costObject.desc}</div>
										<div className={styles.price}>
											{costObject.desc == 'BBQ' ? <div>${(costObject.amount).toFixed(2)} x {selectedTrackday.guests}</div> :
												costObject.type == 'variable' ? <div >${(costObject.amount).toFixed(2)} x {selectedTrackday.members.length + selectedTrackday.walkons.length}</div> : <div ></div>
											}
											{costObject.desc == 'BBQ' ? <div style={{ textAlign: 'right' }}>${Math.round(costObject.amount * selectedTrackday.guests)}</div> :
												costObject.type == 'variable' ? <div style={{ textAlign: 'right' }}>${Math.round(costObject.amount * (selectedTrackday.members.length + selectedTrackday.walkons.length))}</div> : <div style={{ textAlign: 'right' }}>${Math.round(costObject.amount)}</div>
											}
										</div>
									</div>
								)
							})}

							<div className={styles.lineTotal}>
								<h3>Total Expenses</h3>
								<h3 style={{ textAlign: 'right' }}>${Math.round(selectedTrackday.totalExpense)}</h3>
							</div>

							<div className={styles.lineTotal}>
								<h3>Profit</h3>
								<h3 style={{ textAlign: 'right' }}>${Math.round(selectedTrackday.totalRevenue - selectedTrackday.totalExpense)}</h3>
							</div>

						</div>
					</>
					:
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
									<div>BBQ: </div>
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
						<div className={styles.tdRiders_Mobile}>
							<h2>Riders ({trackdayRegNumbers.green + trackdayRegNumbers.yellow + trackdayRegNumbers.red})</h2>
							<h3>Green Group ({trackdayRegNumbers.green})</h3>

							{consolidatedArray.filter((memberEntry) => memberEntry.user.group === 'green').map((memberEntry) => {
								return (
									<div className={styles.userEntry_Mobile} key={memberEntry.user._id}>
										<div className={styles.userName}>
											<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
											{memberEntry.user.waiver ? <div></div> : <img src={waiverMissing}></img>}
										</div>
										<div className={styles.userInfo}>
											<div className={styles.paymentBox}>
												{memberEntry.paid ? <img src={paid}></img> : <img src={unpaid}></img>}
												<div>{memberEntry.paymentMethod}</div>
											</div>
											{memberEntry.checkedIn.length ? <img src={checkedIn}></img> : <img src={notCheckedIn}></img>}
										</div>
									</div>
								)
							})}


							<h3>Yellow Group ({trackdayRegNumbers.yellow})</h3>
							{consolidatedArray.filter((memberEntry) => memberEntry.user.group === 'yellow').map((memberEntry) => {
								return (
									<div className={styles.userEntry_Mobile} key={memberEntry.user._id}>
										<div className={styles.userName}>
											<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
											{memberEntry.user.waiver ? <div></div> : <img src={waiverMissing}></img>}
										</div>
										<div className={styles.userInfo}>
											<div className={styles.paymentBox}>
												{memberEntry.paid ? <img src={paid}></img> : <img src={unpaid}></img>}
												<div>{memberEntry.paymentMethod}</div>
											</div>
											{memberEntry.checkedIn.length ? <img src={checkedIn}></img> : <img src={notCheckedIn}></img>}
										</div>
									</div>
								)
							})}

							<h3>Red Group ({trackdayRegNumbers.red})</h3>
							{consolidatedArray.filter((memberEntry) => memberEntry.user.group === 'red').map((memberEntry) => {
								return (
									<div className={styles.userEntry_Mobile} key={memberEntry.user._id}>
										<div className={styles.userName}>
											<div className="capitalizeEach">{memberEntry.user.firstName}, {memberEntry.user.lastName}</div>
											{memberEntry.user.waiver ? <div></div> : <img src={waiverMissing}></img>}
										</div>
										<div className={styles.userInfo}>
											<div className={styles.paymentBox}>
												{memberEntry.paid ? <img src={paid}></img> : <img src={unpaid}></img>}
												<div>{memberEntry.paymentMethod}</div>
											</div>
											{memberEntry.checkedIn.length ? <img src={checkedIn}></img> : <img src={notCheckedIn}></img>}
										</div>
									</div>
								)
							})}
						</div>
					</>
				)}






			</div >


			<Loading open={activeModal.type === 'loading'}>
				{activeModal.msg}
			</Loading>

		</>
	);
};

export default TrackdayState;