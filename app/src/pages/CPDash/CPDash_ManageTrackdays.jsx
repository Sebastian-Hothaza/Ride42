import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_ManageTrackdays.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


const ManageTrackdays = ({ APIServer, fetchAPIData, allTrackdays, allUsers }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

	if (!allUsers || !allUsers) {
		return null;
	} else {
		allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
		allTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
	}


	// Modify date of allTrackdays to be a nice format
	allTrackdays.forEach((trackday) => {
		const date = new Date(trackday.date)
		const weekday = date.toLocaleString('default', { weekday: 'short' })
		const month = date.toLocaleString('default', { month: 'long' })
		const numericDay = date.toLocaleString('default', { day: 'numeric' })
		const formattedDate = weekday + ' ' + month + ' ' + numericDay;
		trackday.prettyDate = formattedDate;
	})


	// Reschedule modal requires objects in selection to have a key and value property, so we add those in
	allTrackdays.forEach((trackday) => {
		trackday.value = trackday.id;
		trackday.displayValue = trackday.prettyDate;
	})

	async function handleRegisterSubmit(e, userID, trackdayID, paymentMethod) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Adding user to trackday' });

		try {
			const response = await fetch(APIServer + 'register/' + userID + '/' + trackdayID, {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
					paymentMethod: paymentMethod,
					layoutVote: 'none',
					guests: 1
				})
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'User added to trackday' });
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

	async function handleUnRegisterSubmit(e, userID, trackdayID) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Removing user from trackday' });
		try {
			const response = await fetch(APIServer + 'register/' + userID + '/' + trackdayID, {
				method: 'DELETE',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'User removed from trackday' });
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


	async function handleEditDetailsSubmit(e, layout, status, date, trackdayID) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Editing trackday' });
		try {
			const response = await fetch(APIServer + 'trackdays/' + trackdayID, {
				method: 'PUT',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
					date: date + 'T14:00Z',
					status: status,
					layout: layout
				})
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Trackday edited' });
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

	async function handleCreateTrackdaySubmit(e, date) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Creating trackday' });
		try {
			const response = await fetch(APIServer + 'trackdays', {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
					date: date + 'T14:00Z',
				})
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Trackday created' });
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
				<h1>Manage Trackdays</h1>
				<div>
					{allTrackdays.map((trackday) => {
						return (
							<div key={trackday.id} className={styles.tdEntry}>

								<div>{trackday.prettyDate} ({trackday.layout}) - {trackday.status}</div>

								<button onClick={() => setActiveModal({ type: 'register', trackday: trackday })}>Add User</button>
								<button onClick={() => setActiveModal({ type: 'unregister', trackday: trackday })}>Remove User</button>
								<button onClick={() => setActiveModal({ type: 'editDetails', trackday: trackday })}>Edit</button>
								<button onClick={() => alert('not yet implemented; extreme caution needed as currently may break back end')}>Delete</button>

							</div>
						)
					})}
				</div>
				<button onClick={() => setActiveModal({ type: 'createTrackday' })}>Create Trackday</button>
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

			<Modal open={activeModal.type === 'register'}>
				<>
					<div>Register User</div>
					<form onSubmit={(e) => handleRegisterSubmit(e, e.target.user.value, activeModal.trackday.id, e.target.paymentMethod.value,)}>

						<div className={styles.inputPairing}>
							<label htmlFor="user">Select User:</label>
							<select name="user" id="user" required>
								<option key="none" value="">--- Select ---</option>
								{allUsers.map((user) => <option key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
							</select>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="paymentMethod">Payment Method:</label>
							<select name="paymentMethod" id="paymentMethod" required>
								<option key="paymentNone" value="">--- Choose Payment Method ---</option>
								<option key="etransfer" value="etransfer">Interac E-Transfer</option>
								<option key="creditCard" value="creditCard">Credit Card</option>
								<option key="credit" value="credit">Use trackday credit</option>
								<option key="gate" value="gate">Gate</option>
							</select>
						</div>



						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>

			<Modal open={activeModal.type === 'unregister'}>
				<>
					<div>Register User</div>
					<form onSubmit={(e) => handleUnRegisterSubmit(e, e.target.user.value, activeModal.trackday.id)}>

						<div className={styles.inputPairing}>
							<label htmlFor="user">Select User:</label>
							<select name="user" id="user" required>
								<option key="none" value="">--- Select ---</option>
								{allUsers.map((user) => <option key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
							</select>
						</div>




						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>

			<Modal open={activeModal.type === 'editDetails'}>
				<>
					<div>Edit Trackday Details</div>
					<form onSubmit={(e) => handleEditDetailsSubmit(e, e.target.layout.value, e.target.status.value, e.target.date.value, activeModal.trackday.id)}>

						<div className={styles.inputPairing}>
							<label htmlFor="group">Layout</label>
							<select name="layout" id="layout" defaultValue={activeModal.trackday && activeModal.trackday.layout} required>
								<option key="technical" value="technical">Technical</option>
								<option key="Rtechnical" value="Rtechnical">Rtechnical</option>
								<option key="alien" value="alien">alien</option>
								<option key="Ralien" value="Ralien">Ralien</option>
								<option key="modified" value="modified">modified</option>
								<option key="Rmodified" value="Rmodified">Rmodified</option>
								<option key="long" value="long">long</option>
								<option key="tbd" value="tbd">tbd</option>
							</select>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="group">Status</label>
							<select name="status" id="status" defaultValue={activeModal.trackday && activeModal.trackday.status} required>
								<option key="regOpen" value="regOpen">regOpen</option>
								<option key="regClosed" value="regClosed">regClosed</option>
								<option key="finished" value="finished">finished</option>
								<option key="cancelled" value="cancelled">cancelled</option>
							</select>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="user">Date</label>
							<input type='date' id="date" name="date" defaultValue={activeModal.trackday && activeModal.trackday.date.slice(0, 10)}></input>
						</div>

						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>

			<Modal open={activeModal.type === 'createTrackday'}>
				<>
					<div>Create New Trackday</div>
					<form onSubmit={(e) => handleCreateTrackdaySubmit(e, e.target.date.value)}>



						<input type='date' id="date" name="date"></input>


						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>


		</>
	);
};

export default ManageTrackdays;