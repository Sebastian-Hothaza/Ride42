import { useEffect, useState, } from "react";
import { useOutletContext } from "react-router-dom";

import styles from './CPDash_Trackdays.module.css'

const Trackdays = ({ loggedInUser, APIServer }) => {

	const [allTrackdays, setAllTrackdays] = useState('');

	// Sort all trackdays as order may not be correct when received from back end
	if (allTrackdays) allTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))

	// TODO: trim all Trackdays removing trackdays in past and trackdays user is already a part of
	const allEligibleTrackdays = allTrackdays;

	const [userTrackdays, setUserTrackdays] = useState('');
	const [userInfo, setUserInfo] = useState('');
	const [showReschedule, setShowReschedule] = useState([]); // tracks for which trackday ID's should we show the reschedule box for

	async function fetchAPIData() {

		try {
			const response = await fetch(APIServer + 'presentTrackdays');
			if (!response.ok) throw new Error("Failed to get API Data")
			const data = await response.json();
			setAllTrackdays(data);
		} catch (err) {
			console.log(err.message)
		}


		try {
			const response = await fetch(APIServer + 'presentTrackdays/' + loggedInUser.id);
			if (!response.ok) throw new Error("Failed to get API Data")
			const data = await response.json();
			setUserTrackdays(data);
		} catch (err) {
			console.log(err.message)
		}

		try {
			const response = await fetch(APIServer + 'users/' + loggedInUser.id, {
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to get API Data")
			const data = await response.json();
			setUserInfo(data);
		} catch (err) {
			console.log(err.message)
		}
	}

	async function handleBookTrackdaySubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);

		// Build layout vote array
		let layoutVoteArray = []
		for (const pair of formData) {
			if (pair[0] === 'layoutVote') layoutVoteArray.push(pair[1])
		}
		let formDataFinal = Object.fromEntries(formData)
		formDataFinal.layoutVote = layoutVoteArray.length ? layoutVoteArray : 'none'

		const response = await fetch(APIServer + 'register/' + loggedInUser.id + '/' + formData.get('date'), {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
			},
			body: JSON.stringify(formDataFinal)
		})
		if (response.status == 400) {
			const data = await response.json()
			console.log(data.msg)
		}
		fetchAPIData();
	}

	async function handleCancelTrackdaySubmit(trackdayID) {
		const response = await fetch(APIServer + 'register/' + loggedInUser.id + '/' + trackdayID, {
			method: 'DELETE',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
			},
		})
		fetchAPIData();
	}

	async function handleRescheduleSubmit(e, trackdayID_OLD) {
		e.preventDefault();
		const formData = new FormData(e.target);

		const response = await fetch(APIServer + 'register/' + loggedInUser.id + '/' + trackdayID_OLD + '/' + formData.get('date'), {
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
		setShowReschedule([])
		fetchAPIData();
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

	useEffect(() => {
		fetchAPIData();
	}, [])

	return (
		<div className={styles.content}>
			<h1>Book a Trackday</h1>
			<form id="CPDash_Trackdays_bookTrackday" onSubmit={(e) => handleBookTrackdaySubmit(e)}>


				<div className={styles.bookDetails}>
					<div className={styles.inputPairing}>
						<label htmlFor="date">Date:</label>
						<select name="date" id="date" form="CPDash_Trackdays_bookTrackday">
							<option key="dateNone" value="">---Choose date---</option>
							{allEligibleTrackdays && allEligibleTrackdays.map((trackday) => <option key={trackday.id} value={trackday.id}>{prettyPrintDate(trackday.date)}</option>)}
						</select>
					</div>
					<div className={styles.inputPairing}>
						<label htmlFor="paymentMethod">Payment Method:</label>
						<select name="paymentMethod" id="paymentMethod" form="CPDash_Trackdays_bookTrackday">
							<option key="paymentNone" value="">---Choose Payment Method---</option>
							{userInfo.credits && <option key="credit" value="credit">Use trackday credit (Remaining: {userInfo.credits})</option>}
							<option key="etransfer" value="etransfer">Interac E-Transfer</option>
							<option key="creditCard" value="creditCard">Credit Card</option>

						</select>
					</div>
					<div className={styles.inputPairing}>
						<label htmlFor="guests" >Guests:</label>
						<input type="number" id="guests" name="guests" defaultValue={1}></input>
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

			</form>



			<h1>My Trackdays</h1>
			{!userTrackdays ? <div>...</div> :
				<div>

					{userTrackdays.map((trackday) => {
						return (
							<div key={trackday.id} className={styles.tdEntry}>

								<div>{prettyPrintDate(trackday.date)}</div>

								{trackday.paid ? <div>PAID</div> : <div>UNPAID</div>}

								<div className={styles.tdControls}>
									{showReschedule.find((p) => p.id === trackday.id) ?
										<>
											<form id="CPDash_Trackdays_reschedule" onSubmit={(e) => handleRescheduleSubmit(e, trackday.id)}>
												<select name="date" id="date" form="CPDash_Trackdays_reschedule" defaultValue={userInfo.group}>
													<option key="dateNone" value="">--Choose date--</option>
													{allEligibleTrackdays && allEligibleTrackdays.map((trackday) => <option key={trackday.id} value={trackday.id}>{prettyPrintDate(trackday.date)}</option>)}
												</select>
												<button className={styles.confirmBtn} type="submit">Confirm</button>
												<button type="button" onClick={() => toggleReschedule(trackday)}>Cancel</button>
											</form>

										</>
										: <>
											<button onClick={() => toggleReschedule(trackday)}>Reschedule</button>
											<button onClick={() => handleCancelTrackdaySubmit(trackday.id)}>Cancel Trackday</button>
										</>
									}
								</div>



							</div>

						)
					})}
				</div>}


		</div>
	);
};

export default Trackdays;