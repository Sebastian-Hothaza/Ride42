import { useEffect, useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/Trackdays.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

import { loadStripe } from "@stripe/stripe-js"
import { useElements, Elements, useStripe, PaymentElement } from "@stripe/react-stripe-js"

const Trackdays = ({ APIServer, userInfo, allTrackdays, userTrackdays, fetchAPIData, setActiveTab }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
	const [stripePromise, setStripePromise] = useState(null); //Stripe promise that resolves to stripe object. Not guaranteed valid!
	const [clientSecret, setClientSecret] = useState(''); //Client secret used to initialize elements
	const [selectedTrackday, setSelectedTrackday] = useState(''); // Trackday selected for booking
	const DAYS_LOCKOUT = 6;
	const CREDITCARD_FEE = 5;

	// Returns true if a user is registered for a specified trackday ID
	function userRegistered(trackdayID) {
		for (let i = 0; i < userTrackdays.length; i++) {
			if (userTrackdays[i].id === trackdayID) return true
		}
		return false
	}

	function inPast(trackday) { return new Date(trackday.date).getTime() - Date.now() < 0 }

	// Checks if a trackday is in the lockout period 
	function inLockout(trackday) {
		// In lockout period and payment method was not credit
		const timeLockout = DAYS_LOCKOUT * (1000 * 60 * 60 * 24); 
		const timeDifference = new Date(trackday.date).getTime() - Date.now()
		if (timeDifference < timeLockout) return true;
		return false;
	}

	// Pre-process allTrackdays (remove invalid, sort, format date, prepare for modal) & userTrackdays (Removed archived trackdays)
	if (allTrackdays && userTrackdays) {
		// Remove trackdays in the past, trackdays for which reg is not open and trackdays that user is already registered for
		allTrackdays = allTrackdays.filter((trackday) => {
			return (
				new Date(trackday.date).getTime() - Date.now() >= 0 && // Trackday is in future
				trackday.status === 'regOpen' &&
				!userRegistered(trackday.id)
			)
		})

		// exclude archived trackdays
		userTrackdays = userTrackdays.filter(trackday => trackday.status != "archived");

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


	// Fetch stripe config on page load
	// Gets publishable key from server and sets stripePromise. 
	async function fetchStripeConfig() {
		try {
			const response = await fetch(APIServer + 'stripeConfig')
			const data = await response.json();
			if (response.ok) {
				setStripePromise(loadStripe(data.publishableKey)); // loadStripe will work even if key is invalid!
			} else {
				console.error(data.msg.join('\n'));
				return data.msg.join('\n');
			}
		} catch (err) {
			setActiveModal({ type: 'failure', msg: 'API Failure' })
			console.error(err.message)
		}
	}
	useEffect(() => {
		fetchStripeConfig();
	}, []);




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

	// Creates paymentIntent and sets clientSecret. Uses trackdayID to set the intent price.
	// Opens paymentModal which renders Elements and Checkout component
	// TODO: Error handling when publishable key is invalid
	async function handlePay(user, trackday) {
		setActiveModal({ type: 'loading', msg: 'Creating payment intent' });
		try {
			const response = await fetch(APIServer + 'paymentIntent/' + user._id + '/' + trackday.id, {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({})
			})
			const data = await response.json();
			if (response.ok) {
				setClientSecret(data.clientSecret);
				setActiveModal({ type: 'paymentModal', trackday: trackday });
			} else {
				setActiveModal({ type: 'failure', msg: 'Failed to create\npayment intent' })
				console.error(data.msg);
			}
		} catch (err) {
			setActiveModal({ type: 'failure', msg: 'API Failure' })
			console.log(err.message)
		}
	}

	// Checkout component
	const CheckoutForm = () => {
		const [isProcessing, setIsProcessing] = useState(false); //Tracks if payment is processing
		const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
		const STRIPE_FEE = 5; // Compensate for stripe fee




		const stripe = useStripe();
		const elements = useElements();


		const handleSubmit = async (event) => {
			event.preventDefault();
			if (!stripe || !elements) return;	// Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.

			setIsProcessing(true);


			const { error, paymentIntent } = await stripe.confirmPayment({
				elements,
				redirect: 'if_required',
			});

			if (paymentIntent && paymentIntent.status === 'succeeded') {
				setActiveModal({ type: 'success', msg: 'Payment complete' });
				setTimeout(() => setActiveModal(''), 2000)
				activeModal.trackday.paid = true; // Marked for immediate UI update, optimistic UI
			} else if (error) {
				setActiveModal({ type: 'failure', msg: `Payment Failed: ${error.message}` });
				console.error(error);
			} else {
				console.error('Unknown state');
			}
			setIsProcessing(false);

		};

		return (
			<form id={styles.paymentForm} onSubmit={handleSubmit}>
				<PaymentElement className={styles.paymentElement} onReady={() => setIsPaymentElementReady(true)} />

				{isPaymentElementReady &&
					<>
						{isProcessing ? <div>Processing...</div> :
							<>
								<button className="actionButton confirmBtn" disabled={isProcessing} id="submit">Pay ${activeModal.trackday.ticketPrice.preReg + STRIPE_FEE} Now</button>
								<button className="actionButton" onClick={() => setActiveModal('')}>Cancel</button>
							</>
						}

					</>
				}
			</form>
		)
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

	// If user has not signed waiver, don't allow any trackday management
	if (userInfo && !userInfo.waiver) {
		return <>
			<h1>Missing Waiver</h1>
			<br></br><br></br>
			<h2>To book or manage trackdays, please sign the waiver.</h2>
			<br></br><br></br>
			<button className="actionButton" onClick={() => window.location.href = '/waiver'}>Sign Waiver</button>
		</>
	}


	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Book a Trackday</h1>
				<form id="Trackdays_bookTrackday" onSubmit={(e) => handleBookTrackdaySubmit(e)}>


					<div className={styles.dateAndPayment}>
						<div className={styles.inputPairing}>
							<label htmlFor="date">Date:</label>
							<select name="date" id="date" form="Trackdays_bookTrackday" onChange={(e) => {
								setSelectedTrackday(allTrackdays.find(td => td.id === e.target.value));
							}} required>
								<option key="dateNone" value="">- Choose date -</option>
								{allTrackdays && allTrackdays.map((trackday) => <option key={trackday.id} value={trackday.id}>{trackday.prettyDate}</option>)}
							</select>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="paymentMethod">Payment Method:</label>
							<select name="paymentMethod" id="paymentMethod" form="Trackdays_bookTrackday" required>
								<option key="paymentNone" value="">- Choose Payment Method -</option>
								{userInfo.credits && <option key="credit" value="credit">Use trackday credit ({userInfo.credits} left)</option>}
								{selectedTrackday && !inLockout(selectedTrackday) && <option key="etransfer" value="etransfer">Interac E-Transfer (${selectedTrackday.ticketPrice.preReg})</option>}
								{selectedTrackday && !inLockout(selectedTrackday) && <option key="creditCard" value="creditCard">Credit Card (${selectedTrackday.ticketPrice.preReg + CREDITCARD_FEE})</option>}
								{selectedTrackday && inLockout(selectedTrackday) && <option key="gate" value="gate">Interac E-Transfer (${selectedTrackday.ticketPrice.gate})</option>}
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
					<button className='confirmBtn' id={styles.registerBtn} type="submit">Register</button>
				</form>



				<h1>My 2025 Trackdays</h1>
				{userTrackdays && 
					<div>
						{userTrackdays.map((trackday) => {
							return (
								<div key={trackday.id} className={styles.tdEntry}>
									{/* INFO */}
									<div>{trackday.prettyDate}</div>
									{/* Paid Status */}
									<div>
										{(() => {
											switch (trackday.paymentMethod) {
												case 'etransfer':
													return trackday.paid ? <div>Payment received ✅</div> : <div style={{ color: `var(--accent-color)` }}>E-Transfer not received (${trackday.ticketPrice.preReg})</div>;
												case 'creditCard':
													return trackday.paid ? <div>Payment received ✅</div> : <div style={{ color: `var(--accent-color)` }}>Credit card payment not processed</div>;
												case 'credit':
													return <div>Used credit</div>;
												case 'gate':
													return trackday.paid ? <div>Gate registration payment received ✅</div> : <div style={{ color: `var(--accent-color)` }}>E-Transfer not received (${trackday.ticketPrice.gate})</div>;
												default:
													return <div>Payment Method Unknown</div>;
											}
										})()}
									</div>
									{/* Reschedule/Cancel controls */}
									<div className={styles.tdControls}>
										{/* These buttons should not be shown if trackday is in past OR for gate registrations */}
										{!inPast(trackday) && (!inLockout(trackday) || trackday.paymentMethod === 'credit')  && trackday.paymentMethod !== 'gate' && <>
											{trackday.paymentMethod === 'creditCard' && !trackday.paid && <button onClick={() => handlePay(userInfo, trackday)}>Pay Now</button>}
											<button onClick={() => setActiveModal({ type: 'reschedule', trackday: trackday })}>Reschedule</button>
											<button onClick={() => setActiveModal({ type: 'cancel', trackday: trackday })}>Cancel</button>
										</>}
										{trackday.paymentMethod === 'gate' && !trackday.paid && <>
											{trackday.paymentMethod === 'creditCard' && !trackday.paid && <button onClick={() => handlePay(userInfo, trackday)}>Pay Now</button>}
											<button onClick={() => setActiveModal({ type: 'cancel', trackday: trackday })}>Cancel</button>
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
				<form>
					<h3>Are you sure?</h3>
					<button className={`actionButton confirmBtn`} onClick={() => handleCancelTrackdaySubmit(activeModal.trackday.id)}>Yes, cancel trackday</button>
					<button className='actionButton' onClick={() => setActiveModal('')}>No, keep it</button>
				</form>
			</Modal>



			<Modal open={activeModal.type === 'reschedule'}>


				<form onSubmit={(e) => handleRescheduleSubmit(e, activeModal.trackday.id, e.target.result.value)}>
					<h3>Which day do you want to reschedule to?</h3>
					<select name="result" id="result" required>
						<option key="none" value=""></option>
						{allTrackdays && allTrackdays.map((item) => <option key={item.value} value={item.value}>{item.displayValue}</option>)}
					</select>
					<button className={`actionButton confirmBtn`} type="submit">Confirm</button>
					<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
				</form>

			</Modal>


			<Modal open={activeModal.type === 'paymentModal'}>
				<Elements stripe={stripePromise} options={{ clientSecret: clientSecret }}>
					<CheckoutForm />
				</Elements>
			</Modal>




		</>
	);
};

export default Trackdays;