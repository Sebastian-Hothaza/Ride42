import React, { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";



import styles from './stylesheets/TrackdaySummary.module.css'


const TrackdaySummary = ({ allUsers, allTrackdaysFULL }) => {

	const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackdayId is 
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);

	let selectedTrackday;
	let years = [];

	// Augment prettydate of allTrackdays to be a nice format
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
		allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
		// Only show trackdays for currently selected year
		allTrackdaysFULL = allTrackdaysFULL.filter(trackday => {
			const candidateTrackdayYear = new Date(trackday.date).getFullYear();
			return candidateTrackdayYear == selectedYear;
		});
		allTrackdaysFULL.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
	}




	// Set the selected trackday and sort its members array. Augment object to include values for display
	if (selectedTrackdayId) {
		selectedTrackday = allTrackdaysFULL.find((td) => td._id === selectedTrackdayId)
		selectedTrackday.members.sort((a, b) => (a.user.firstName > b.user.firstName) ? 1 : ((b.user.firstName > a.user.firstName) ? -1 : 0))

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
				selectedTrackday.totalExpense += Math.round(costObject.amount * selectedTrackday.guests);
			} else if (costObject.type == 'fixed') {
				selectedTrackday.totalExpense += costObject.amount;
			} else {
				selectedTrackday.totalExpense += costObject.amount * (selectedTrackday.members.length + selectedTrackday.walkons.length);
			}
		})




	}




	// Download CSV file
	function download() {
		let result = `Some text here\n`

		const link = window.document.createElement('a');
		const file = new Blob([result], { type: 'text/csv' });
		link.href = URL.createObjectURL(file);
		link.download = `${selectedTrackday.prettyDate}_Summary.csv`;
		document.body.appendChild(link);
		link.click();
	}

	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Trackday Summary:
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
				</h1>
				{selectedTrackday &&

					<div className={styles.reportGrid}>
						<h2>Revenue</h2>

						<div>Pre-Reg Ticket Sales</div>
						<div>${selectedTrackday.preRegPrice} x {selectedTrackday.preRegQty}</div>
						<div>${selectedTrackday.preRegPrice * selectedTrackday.preRegQty}</div>

						<div>Gate Ticket Sales</div>
						<div>${selectedTrackday.gatePrice} x {selectedTrackday.gateQty}</div>
						<div>${selectedTrackday.gatePrice * selectedTrackday.gateQty}</div>

						<div>Bundle Ticket Sales</div>
						<div>${selectedTrackday.bundlePrice} x {selectedTrackday.bundleQty}</div>
						<div>${selectedTrackday.bundlePrice * selectedTrackday.bundleQty}</div>

						{selectedTrackday.costs.filter((costObject) => costObject.amount < 0).map((costObject) => {
							return (
								<React.Fragment key={costObject._id}>
									<div >{costObject.desc}</div>
									{costObject.type == 'variable' ? <div >${costObject.amount * -1} x {selectedTrackday.members.length + selectedTrackday.walkons.length}</div> : <div ></div>}
									{costObject.type == 'variable' ? <div >${costObject.amount * -1 * (selectedTrackday.members.length + selectedTrackday.walkons.length)}</div> : <div>${costObject.amount * -1}</div>}
								</React.Fragment>
							)
						})}

						<h3>Total Revenue</h3>
						<h3> </h3>
						<h3>${selectedTrackday.totalRevenue}</h3>

						<h2>Expenses</h2>
						<div>Track Rental</div>
						<div></div>
						<div>${selectedTrackday.costs.find((costObject) => costObject.desc == 'trackRental').amount}</div>

						{selectedTrackday.costs.filter((costObject) => costObject.amount > 0 && costObject.desc != 'trackRental').map((costObject) => {
							return (
								<React.Fragment key={costObject._id}>
									<div >{costObject.desc}</div>
									{costObject.desc == 'BBQ' ? <div>${costObject.amount} x {selectedTrackday.guests}</div> :
										costObject.type == 'variable' ? <div >${costObject.amount} x {selectedTrackday.members.length + selectedTrackday.walkons.length}</div> : <div ></div>
									}

									{costObject.desc == 'BBQ' ? <div>${Math.round(costObject.amount * selectedTrackday.guests)}</div> :
										costObject.type == 'variable' ? <div >${costObject.amount * (selectedTrackday.members.length + selectedTrackday.walkons.length)}</div> : <div>${costObject.amount}</div>
									}


								</React.Fragment>
							)
						})}

						<h3>Total Expenses</h3>
						<h3> </h3>
						<h3>${selectedTrackday.totalExpense}</h3>

						<h3>Profit</h3>
						<h3> </h3>
						<h3>${selectedTrackday.totalRevenue - selectedTrackday.totalExpense}</h3>
					</div>




				}
			</div>
		</>
	);
};

export default TrackdaySummary;