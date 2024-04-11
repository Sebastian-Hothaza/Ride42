import { useState } from "react";
import Modal_Loading from "../../components/Modal_Loading";
import Modal from "../../components/Modal";
import ScrollToTop from "../../components/ScrollToTop";
import styles from './CPDash_Trackdays.module.css'

// TODO; remove hardcoded 7 days restriction

const Trackdays = ({ APIServer, userInfo, allTrackdays, userTrackdays, fetchAPIData, setActiveTab }) => {
	const [bookErrors, setBookErrors] = useState(); // Array corresponding to error messages received from API
	const [showReschedule, setShowReschedule] = useState([]); // tracks for which trackday ID's should we show the reschedule box for
	const [showCancellation, setShowCancellation] = useState([]); // tracks for which trackday ID's should we show the cancellation box for
	const [pendingSubmit, setPendingSubmit] = useState('');
	const [showCancelModal, setShowCancelModal] = useState({ show: false, trackday: null })

	// Returns true if a user is registered for a specified trackday ID
	function userRegistered(trackdayID) {
		for (let i = 0; i < userTrackdays.length; i++) {
			if (userTrackdays[i].id === trackdayID) return true
		}
		return false
	}

	// Filter allTrackdays to only days user can actually register for
	if (allTrackdays) {
		// Remove trackdays in the past
		allTrackdays = allTrackdays.filter((trackday) => {
			return (
				new Date(trackday.date).getTime() - Date.now() >= 0 && // Trackday is in future
				trackday.status === 'regOpen' &&
				!userRegistered(trackday.id)
			)
		})
	}

	// Sort all trackdays as order may not be correct when received from back end (?) TODO: Check on this
	if (allTrackdays) allTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))


	async function handleBookTrackdaySubmit(e) {
		e.preventDefault();
		setPendingSubmit({ show: true, msg: 'Booking your trackday' });
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
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(formDataFinal)
			})
			if (response.ok) {
				setBookErrors('');
				await fetchAPIData(); // Wait for fetch to complete so the spinner stays on screen
			} else if (response.status === 400) {
				const data = await response.json();
				setBookErrors(data.msg)
			} else if (response.status === 409 || response.status === 401) {
				const data = await response.json();
				setBookErrors([data.msg])
			} else {
				throw new Error('API Failure')
			}

		} catch (err) {
			console.log(err)
		}
		setPendingSubmit('');
	}

	async function handleCancelTrackdaySubmit(trackdayID) {
		setShowCancelModal('')
		setPendingSubmit({ show: true, msg: 'Cancelling your trackday' });
		try {
			const response = await fetch(APIServer + 'register/' + userInfo._id + '/' + trackdayID, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			if (!response.ok) throw new Error('API Failure')
			await fetchAPIData();
		} catch (err) {
			console.log(err)
		}
		setPendingSubmit('');
		
	}

	async function handleRescheduleSubmit(e, trackdayID_OLD) {
		e.preventDefault();
		setPendingSubmit({ show: true, msg: 'Rescheduling your trackday' });
		const formData = new FormData(e.target);
		try {
			const response = await fetch(APIServer + 'register/' + userInfo._id + '/' + trackdayID_OLD + '/' + formData.get('date'), {
				method: 'PUT',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			if (response.status == 400) {
				const data = await response.json()
				console.log(data.msg)
			}
			if (!response.ok) throw new Error('API Failure')
			await fetchAPIData();
		} catch (err) {
			console.log(err)
		}
		setShowReschedule([])
		setPendingSubmit('');
	}

	// Converts server format date to nice user legible date
	function prettyPrintDate(APIDate) {
		const date = new Date(APIDate)
		const weekday = date.toLocaleString('default', { weekday: 'short' })
		const month = date.toLocaleString('default', { month: 'long' })
		const numericDay = date.toLocaleString('default', { day: 'numeric' })
		const formattedDate = weekday + ' ' + month + ' ' + numericDay;
		return formattedDate;
	}

	function toggleReschedule(targetTrackday) {
		// Check if our targetTrackday is already in the array of showReschedule
		if (showReschedule.find(trackday => trackday.id === targetTrackday.id)) {
			setShowReschedule(showReschedule.filter(trackday => trackday.id !== targetTrackday.id)); //remove
		} else {
			setShowReschedule(showReschedule.concat(targetTrackday)); //add
		}
	}

	function toggleCancellation(targetTrackday) {
		// Check if our targetTrackday is already in the array of showCancellation
		if (showCancellation.find(trackday => trackday.id === targetTrackday.id)) {
			setShowCancellation(showCancellation.filter(trackday => trackday.id !== targetTrackday.id)); //remove
		} else {
			setShowCancellation(showCancellation.concat(targetTrackday)); //add
		}
	}


	function canModify(trackday) {
		// Date in past
		if (new Date(trackday.date).getTime() - Date.now() < 0) return false

		// In lockout period and payment method was not credit
		const timeLockout = 7 * (1000 * 60 * 60 * 24);
		const timeDifference = new Date(trackday.date).getTime() - Date.now()
		if (trackday.paymentMethod !== 'credit' && timeDifference < timeLockout) return false;

		return true;
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

	// TODO: user trackdays, are they guaranteed in order? NO! "my trackdays"(userTrackdays) should be sorted
	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Book a Trackday</h1>
				<form id="CPDash_Trackdays_bookTrackday" onSubmit={(e) => handleBookTrackdaySubmit(e)}>


					<div className={styles.bookDetails}>
						<div className={styles.inputPairing}>
							<label htmlFor="date">Date:</label>
							<select name="date" id="date" form="CPDash_Trackdays_bookTrackday" required>
								<option key="dateNone" value="">---Choose date---</option>
								{allTrackdays && allTrackdays.map((trackday) => <option key={trackday.id} value={trackday.id}>{prettyPrintDate(trackday.date)}</option>)}
							</select>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="paymentMethod">Payment Method:</label>
							<select name="paymentMethod" id="paymentMethod" form="CPDash_Trackdays_bookTrackday" required>
								<option key="paymentNone" value="">---Choose Payment Method---</option>
								{userInfo.credits && <option key="credit" value="credit">Use trackday credit (Remaining: {userInfo.credits})</option>}
								<option key="etransfer" value="etransfer">Interac E-Transfer</option>
								<option key="creditCard" value="creditCard">Credit Card</option>

							</select>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="guests" >Guests:</label>
							<input type="number" id="guests" name="guests" defaultValue={1} required min={0}></input>
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


					<button className={styles.confirmBtn} id={styles.registerBtn} type="submit">Register</button>

					{bookErrors && bookErrors.length > 0 &&
						<ul className="errorText">Encountered the following errors:
							{bookErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
						</ul>}
				</form>



				<h1>My Trackdays</h1>
				{userTrackdays &&
					<div>
						{userTrackdays.map((trackday) => {
							return (
								<div key={trackday.id} className={styles.tdEntry}>
									{/* INFO */}
									<div>{prettyPrintDate(trackday.date)}</div>
									{/* Paid Status */}
									{trackday.paid ? <div>PAID</div> : <div>UNPAID</div>}

									{/* Reschedule/Cancel controls */}
									<div className={styles.tdControls}>
										{/* Conditionally show reschedule form */}
										{showReschedule.find((p) => p.id === trackday.id) ?
											<>
												<form id="CPDash_Trackdays_reschedule" onSubmit={(e) => handleRescheduleSubmit(e, trackday.id)}>
													<select name="date" id="date" form="CPDash_Trackdays_reschedule" required>
														<option key="dateNone" value="">--Choose date--</option>
														{allTrackdays && allTrackdays.map((trackday) => <option key={trackday.id} value={trackday.id}>{prettyPrintDate(trackday.date)}</option>)}
													</select>
													<button className={styles.confirmBtn} type="submit">Confirm</button>
													<button type="button" onClick={() => toggleReschedule(trackday)}>Cancel</button>
												</form>
											</>
											:
											<>
												{/* These buttons should not be shown if trackday is in past */}
												{canModify(trackday) && <> <button onClick={() => toggleReschedule(trackday)}>Reschedule</button>
													<button onClick={() => setShowCancelModal({ show: true, trackday: trackday })}>Cancel Trackday</button> </>}
											</>
										}
									</div>
								</div>
							)
						})}
					</div>}


			</div>
			<Modal_Loading open={pendingSubmit.show} text={pendingSubmit.msg}></Modal_Loading>
			<Modal open={showCancelModal.show} onClose={() => setShowCancelModal({ show: false, trackday: null })}
				text='Are you sure you want to cancel this trackday?' okText="Yes, cancel it" closeText="No, keep it" fn={() => handleCancelTrackdaySubmit(showCancelModal.trackday.id)}></Modal>

		</>
	);
};

export default Trackdays;