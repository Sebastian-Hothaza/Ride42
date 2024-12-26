import { useState } from "react";




import styles from './stylesheets/CheckInManual.module.css'


const CheckInManual = ({ allUsers, allTrackdaysFULL }) => {

	const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackdayId is 

	let selectedTrackday;

	if (!allUsers || !allTrackdaysFULL) {
		return null;
	} else {
		allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
		allTrackdaysFULL.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
	}

	// Augment prettydate of allTrackdays to be a nice format. TODO: Move this to after we have the selected trackday for improved efficiency
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

	// Download CSV file
	function download() {
		let result = `group,name,checkin,waiver,paid\n`
		selectedTrackday.members.forEach((memberEntry)=>result+=`${allUsers.find((user)=>user._id === memberEntry.user._id).group},${memberEntry.user.firstName} ${memberEntry.user.lastName},,${allUsers.find((user)=>user._id === memberEntry.user._id).waiver?`✔️`:``},${memberEntry.paid? `✔️`:``}\n`)
		const link = window.document.createElement('a');
		const file = new Blob([result], { type: 'text/csv' });
		link.href = URL.createObjectURL(file);
		link.download = `${selectedTrackday.prettyDate}_CheckIn.csv`;
		document.body.appendChild(link);
		link.click();
	}

	return (
		<>
			<div className={styles.content}>
				<h1>Check in sheet for trackday-
					<form>
						<div className={styles.inputPairing}>
							<select name="trackday" id="trackday" onChange={() => setSelectedTrackdayId(trackday.value)} required>
								<option style={{ textAlign: 'center' }} key="none" value="">---Select---</option>
								{allTrackdaysFULL.map((trackday) => <option key={trackday._id} value={trackday._id}>{trackday.prettyDate}</option>)}
							</select>
						</div>
					</form>
				</h1>
				{selectedTrackday && <button onClick={() => download()}>Download Check In Sheet</button>}
			</div>
		</>
	);
};

export default CheckInManual;