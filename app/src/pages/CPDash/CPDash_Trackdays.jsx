import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_Trackdays.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


// TODO; remove hardcoded 6 days restriction


const Trackdays = ({ APIServer, userInfo, allTrackdays, userTrackdays, fetchAPIData, setActiveTab }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown



	// Returns true if a user is registered for a specified trackday ID
	function userRegistered(trackdayID) {
		for (let i = 0; i < userTrackdays.length; i++) {
			if (userTrackdays[i].id === trackdayID) return true
		}
		return false
	}

	// Checks if a user is eligible to reschedule/cancel a trackday
	function canModify(trackday) {
		// Date in past
		if (new Date(trackday.date).getTime() - Date.now() < 0) return false

		// In lockout period and payment method was not credit
		const timeLockout = 6 * (1000 * 60 * 60 * 24);
		const timeDifference = new Date(trackday.date).getTime() - Date.now()
		if (trackday.paymentMethod !== 'credit' && timeDifference < timeLockout) return false;
		return true;
	}

	// Pre-process allTrackdays (remove invalid, sort, format date, prepare for modal)
	if (allTrackdays && userTrackdays) {
		// Remove trackdays in the past, trackdays for which reg is not open and trackdays that user is already registered for
		allTrackdays = allTrackdays.filter((trackday) => {
			return (
				new Date(trackday.date).getTime() - Date.now() >= 0 && // Trackday is in future
				trackday.status === 'regOpen' &&
				!userRegistered(trackday.id)
			)
		})

		// Sort trackdays as order may not be correct when received from back end. (Ie. backend can add trackdays out of order - no guarantee)
		allTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
		userTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))

		// Modify date of allTrackdays to be a nice format
		allTrackdays.forEach((trackday) => {
			const date = new Date(trackday.date)
			const weekday = date.toLocaleString('default', { weekday: 'short' })
			const month = date.toLocaleString('default', { month: 'long' })
			const numericDay = date.toLocaleString('default', { day: 'numeric' })
			const formattedDate = weekday + ' ' + month + ' ' + numericDay;
			trackday.prettyDate = formattedDate;
		})
		userTrackdays.forEach((trackday) => {
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
	}








	async function handleBookTrackdaySubmit(e) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Booking your trackday' });
		const formData = new FormData(e.target);

		// Build layout vote array
		let layoutVoteArray = []
		for (const pair of formData) {
			if (pair[0] === 'layoutVote') layoutVoteArray.push(pair[1])
		}
		let formDataFinal = Object.fromEntries(formData)
		formDataFinal.layoutVote = layoutVoteArray.length ? layoutVoteArray : 'none'
		try {
			const response = await fetch(APIServer + 'register/' + userInfo._id + '/' + formData.get('date'), {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(formDataFinal)
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Trackday booked' });
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

	async function handleCancelTrackdaySubmit(trackdayID) {
		setActiveModal({ type: 'loading', msg: 'Cancelling your trackday' });
		try {
			const response = await fetch(APIServer + 'register/' + userInfo._id + '/' + trackdayID, {
				method: 'DELETE',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Trackday cancelled' });
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

	async function handleRescheduleSubmit(e, trackdayID_OLD, trackdayID_NEW) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Rescheduling your trackday' });
		try {
			const response = await fetch(APIServer + 'register/' + userInfo._id + '/' + trackdayID_OLD + '/' + trackdayID_NEW, {
				method: 'PUT',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			await fetchAPIData();

			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Trackday rescheduled' });
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







	// If user has no bikes in garage, don't allow any trackday management
	if (userInfo && !userInfo.garage.length) {
		return <>
			<h1>Your Garage is Empty!</h1>
			<br></br><br></br>
			<h2>To book or manage trackdays, you must have at least 1 bike in your garage.</h2>
			<br></br><br></br>
			<button className="actionButton" onClick={() => setActiveTab('garage')}>Go to My Garage</button>
		</>
	}

	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Book a Trackday</h1>
				<form id="CPDash_Trackdays_bookTrackday" onSubmit={(e) => handleBookTrackdaySubmit(e)}>


					<div className={styles.dateAndPayment}>
						<div className={styles.inputPairing}>
							<label htmlFor="date">Date:</label>
							<select name="date" id="date" form="CPDash_Trackdays_bookTrackday" required>
								<option key="dateNone" value="">----- Choose date -----</option>
								{allTrackdays && allTrackdays.map((trackday) => <option key={trackday.id} value={trackday.id}>{trackday.prettyDate}</option>)}
							</select>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="paymentMethod">Payment Method:</label>
							<select name="paymentMethod" id="paymentMethod" form="CPDash_Trackdays_bookTrackday" required>
								<option key="paymentNone" value="">--- Choose Payment Method ---</option>
								{userInfo.credits && <option key="credit" value="credit">Use trackday credit (Remaining: {userInfo.credits})</option>}
								<option key="etransfer" value="etransfer">Interac E-Transfer</option>
								<option key="creditCard" value="creditCard">Credit Card(+$5)</option>

							</select>
						</div>
					</div>


					<div className={styles.guests}>
						<div className={styles.inputPairing}>
							<label style={{ textAlign: 'center' }} htmlFor="guests" >Guests for BBQ <span style={{ fontStyle: 'italic' }}>(including you)</span></label>
							<div className={styles.guestControl}>
								<button type="button" id={styles.guestsBtn} onClick={() => { if (guests.value > 0) guests.value-- }}><span className='material-symbols-outlined'>remove</span></button>
								<input type="number" id="guests" name="guests" defaultValue={1} required readOnly></input>
								<button type="button" id={styles.guestsBtn} onClick={() => guests.value++}><span className='material-symbols-outlined'>add</span></button>
							</div>
						</div>
					</div>



					<div className={styles.layoutVote}>
						<legend><h3>Which layouts would you like to vote for?</h3></legend>
						<div className={styles.checkboxes}>
							<div className={styles.checkboxPairing}>
								<input type="checkbox" id="technical" name="layoutVote" value="technical"></input>
								<label htmlFor="technical">Technical</label>
							</div>

							<div className={styles.checkboxPairing}>
								<input type="checkbox" id="Rtechnical" name="layoutVote" value="Rtechnical"></input>
								<label htmlFor="Rtechnical">Reverse Technical</label>
							</div>
							<div className={styles.checkboxPairing}>
								<input type="checkbox" id="alien" name="layoutVote" value="alien"></input>
								<label htmlFor="alien">Alien</label>
							</div>
							<div className={styles.checkboxPairing}>
								<input type="checkbox" id="Ralien" name="layoutVote" value="Ralien"></input>
								<label htmlFor="Ralien">Reverse Alien</label>
							</div>
							<div className={styles.checkboxPairing}>
								<input type="checkbox" id="modified" name="layoutVote" value="modified"></input>
								<label htmlFor="modified">Modified</label>
							</div>
							<div className={styles.checkboxPairing}>
								<input type="checkbox" id="long" name="layoutVote" value="long"></input>
								<label htmlFor="long">Long Track</label>
							</div>
						</div>
					</div>

					<div className={styles.layoutVote}>
						<legend><h3>Do you understand our rules and policies?</h3></legend>
						<div className={styles.checkboxes}>
							<div className={styles.checkboxPairing}>
								<input type="checkbox" id="ruleAgree" name="ruleAgree" required></input>
								<label htmlFor="ruleAgree">Yes, I have read and agree to them</label>
							</div>
						</div>

					</div>
					<button className={styles.confirmBtn} id={styles.registerBtn} type="submit">Register</button>
				</form>



				<h1>My Trackdays</h1>
				{userTrackdays &&
					<div>
						{userTrackdays.map((trackday) => {
							return (
								<div key={trackday.id} className={styles.tdEntry}>
									{/* INFO */}
									<div>{trackday.prettyDate}</div>
									{/* Paid Status */}
									{trackday.paid ? <div>PAID</div> : <div>UNPAID</div>}
									{/* Reschedule/Cancel controls */}
									<div className={styles.tdControls}>
										{/* These buttons should not be shown if trackday is in past */}
										{canModify(trackday) && <>
											<button onClick={() => setActiveModal({ type: 'reschedule', trackday: trackday })}>Reschedule</button>
											<button onClick={() => setActiveModal({ type: 'cancel', trackday: trackday })}>Cancel Trackday</button>
										</>}
									</div>
								</div>
							)
						})}
					</div>}


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




			<Modal open={activeModal.type === 'cancel'}>
				<>
					Are you sure you want to cancel this trackday?
					<button className={`actionButton ${styles.confirmBtn}`} onClick={() => handleCancelTrackdaySubmit(activeModal.trackday.id)}>Yes, cancel it</button>
					<button className='actionButton' onClick={() => setActiveModal('')}>No, keep it</button>
				</>
			</Modal>



			<Modal open={activeModal.type === 'reschedule'}>
				<>
					Which day do you want to reschedule to?
					<form onSubmit={(e) => handleRescheduleSubmit(e, activeModal.trackday.id, e.target.result.value)}>
						<select name="result" id="result" required>
							<option key="none" value="">--- Select ---</option>
							{allTrackdays && allTrackdays.map((item) => <option key={item.value} value={item.value}>{item.displayValue}</option>)}
						</select>
						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>







		</>
	);
};

export default Trackdays;