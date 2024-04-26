import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_MarkPaid.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


const MarkPaid = ({ APIServer, fetchAPIData, allUsers, allTrackdaysFULL }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
	const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackday is which determines what users to show in dropdown
	const [selectedEntryId, setSelectedEntryId] = useState(''); // Tracks what the current entry we are looking at (taken from members array for given trackday)

	let selectedTrackday;
	let selectedEntry;

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

	if (selectedTrackdayId) selectedTrackday = allTrackdaysFULL.find((td) => td._id === selectedTrackdayId)
	if (selectedEntryId) selectedEntry = selectedTrackday.members.find((memberEntry) => memberEntry.user._id === selectedEntryId)

	async function updatePaid(e, newStatus) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Updating payment status' });
		try {
			const response = await fetch(APIServer + 'paid/' + selectedEntry.user._id + '/' + selectedTrackday._id, {
				method: 'PUT',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
					setPaid: newStatus,
				})
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Updated payment status' });
				setTimeout(() => setActiveModal(''), 1500)
			} else {
				const data = await response.json();
				setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
			}
		} catch (err) {
			setActiveModal({ type: 'failure', msg: 'API Failure' })
			console.log(err.message)
		}
	}



	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Mark Paid</h1>

				<form onSubmit={(e) => updatePaid(e, !selectedEntry.paid)}>
					<div className={styles.inputPairing}>
						<label htmlFor="user">Select Trackday:</label>
						<select name="trackday" id="trackday" onChange={() => setSelectedTrackdayId(trackday.value)} required>
							<option key="none" value=""></option>
							{allTrackdaysFULL.map((trackday) => <option key={trackday._id} value={trackday._id}>{trackday.prettyDate}</option>)}
						</select>
					</div>

					<div className={styles.inputPairing}>
						<label htmlFor="user">Select User:</label>
						<select className='capitalizeEach' name="user" id="user" onChange={() => setSelectedEntryId(user.value)} required>
							<option key="none" value=""></option>
							{selectedTrackday && allUsers.filter((user) => selectedTrackday.members.find((member) => member.user._id == user._id)).map((user) => <option key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
						</select>
					</div>

					{selectedEntry &&
						<>
							{selectedEntry.paid ? <div id={styles.paid}>PAID</div> : <div id={styles.unpaid}>NOT PAID</div>}
							<button>{selectedEntry.paid ? 'Mark Unpaid' : 'Mark Paid'}</button>
						</>

					}
				</form>



			</div>

			<Loading open={activeModal.type === 'loading'}>
				{activeModal.msg}
			</Loading>

			<Modal open={activeModal.type === 'success'}>
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
				{activeModal.msg}
			</Modal>

			<Modal open={activeModal.type === 'failure'}>
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
				{activeModal.msg}
				<button className='actionButton' onClick={() => setActiveModal('')}>Close</button>
			</Modal>
		</>
	);
};

export default MarkPaid;