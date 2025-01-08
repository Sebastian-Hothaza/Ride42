import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/ManageTrackdays.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


const ManageTrackdays = ({ APIServer, fetchAPIData, allTrackdaysFULL, allUsers }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
	const [additionalCosts, setAdditionalCosts] = useState([]); // Tracks what additional costs are which are displayed in modal, array of cost objects

	if (!allUsers || !allTrackdaysFULL) {
		return null;
	} else {
		allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
		allTrackdaysFULL.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
	}

	// Sort the members array if we are displaying a modal where members array will be presented
	if (activeModal.trackday) {
		activeModal.trackday.members.sort((a, b) => (a.user.firstName > b.user.firstName) ? 1 : ((b.user.firstName > a.user.firstName) ? -1 : 0))
	}


	// Modify date of allTrackdaysFULL to be a nice format
	allTrackdaysFULL.forEach((trackday) => {
		const date = new Date(trackday.date)
		const weekday = date.toLocaleString('default', { weekday: 'short' })
		const month = date.toLocaleString('default', { month: 'long' })
		const numericDay = date.toLocaleString('default', { day: 'numeric' })
		const formattedDate = weekday + ' ' + month + ' ' + numericDay;
		trackday.prettyDate = formattedDate;
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


	async function handleEditDetailsSubmit(e, trackdayID) {
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
					date: e.target.date.value + 'T14:00Z',
					status: e.target.status.value,
					layout: e.target.layout.value,
					rentalCost: e.target.rentalCost.value,
					preRegTicketPrice: e.target.preRegTicketPrice.value,
					gateTicketPrice: e.target.gateTicketPrice.value,
					bundlePrice: e.target.bundlePrice.value
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

	async function handleaAddCost(e, trackdayID) {
		e.preventDefault();

		setActiveModal({ type: 'loading', msg: 'Adding cost to trackday' });
		try {
			const response = await fetch(APIServer + 'costs/' + trackdayID, {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
					desc: e.target.desc.value,
					type: e.target.type.value,
					amount: e.target.amount.value,
				})
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Cost added' });
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

	async function handleaRemoveCost(trackdayID, costID) {
		setActiveModal({ type: 'loading', msg: 'Removing cost from trackday' });
		try {
			const response = await fetch(APIServer + 'costs/' + trackdayID + '/' + costID, {
				method: 'DELETE',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Trackday cost removed' });
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

	async function handleCreateTrackdaySubmit(e) {
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
					date: e.target.date.value + 'T14:00Z',
					rentalCost: e.target.rentalCost.value,
					preRegTicketPrice: e.target.preRegTicketPrice.value,
					gateTicketPrice: e.target.gateTicketPrice.value,
					bundlePrice: e.target.bundlePrice.value
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



	// Download CSV file
	function download(trackday) {
		let result = `group,name,checkin,waiver,paid\n`
		//Sort alphabetically 
		trackday.members.sort((a, b) => (a.user.firstName > b.user.firstName) ? 1 : ((b.user.firstName > a.user.firstName) ? -1 : 0))

		trackday.members.forEach((memberEntry) => result += `${allUsers.find((user) => user._id === memberEntry.user._id).group},${memberEntry.user.firstName} ${memberEntry.user.lastName},,${allUsers.find((user) => user._id === memberEntry.user._id).waiver ? `✔️` : ``},${memberEntry.paid ? `✔️` : ``}\n`)

		// Prepare download file
		const link = window.document.createElement('a');
		const file = new Blob([result], { type: 'text/csv' });
		link.href = URL.createObjectURL(file);
		link.download = `${trackday.prettyDate}_CheckIn.csv`;
		document.body.appendChild(link);
		link.click();
	}

	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Manage Trackdays</h1>
				<div>
					{allTrackdaysFULL.map((trackday) => {
						return (
							<div key={trackday._id} className={styles.tdEntry}>
								<div className={styles.tdInfo}>
									<div>{trackday.prettyDate} ({trackday.layout}) - {trackday.status}</div>
								</div>
								<div className={styles.tdControls}>
									<button className='actionButton' onClick={() => setActiveModal({ type: 'register', trackday: trackday })}>Add User</button>
									<button className='actionButton' onClick={() => setActiveModal({ type: 'unregister', trackday: trackday })}>Remove User</button>
									<button className='actionButton' onClick={() => {
										setAdditionalCosts(trackday.costs.filter((costObject)=>costObject.desc != 'rentalCost'));
										setActiveModal({ type: 'editDetails', trackday: trackday })
									}}>Edit</button>
									<button className='actionButton' onClick={() => alert('not yet implemented; extreme caution needed as currently may break back end')}>Delete</button>
									<button className='actionButton' onClick={() => download(trackday)}>Download Backup</button>
								</div>
							</div>
						)
					})}
				</div>
				<button className={styles.createButton} onClick={() => setActiveModal({ type: 'createTrackday' })}>Create Trackday</button>
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
					<h2>Register User</h2>
					<form onSubmit={(e) => handleRegisterSubmit(e, e.target.user.value, activeModal.trackday._id, e.target.paymentMethod.value,)}>

						<div className={styles.inputPairing}>
							<label htmlFor="user">Select User:</label>
							<select className='capitalizeEach' name="user" id="user" required>
								<option key="none" value="">--- Select ---</option>
								{activeModal.trackday && allUsers.filter((user) => !activeModal.trackday.members.find((memberEntry) => memberEntry.user._id === user._id)).map((user) => <option key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
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
					<h2>Un-register User</h2>
					<form onSubmit={(e) => handleUnRegisterSubmit(e, e.target.user.value, activeModal.trackday._id)}>

						<div className={styles.inputPairing}>
							<label htmlFor="user">Select User:</label>
							<select className='capitalizeEach' name="user" id="user" required>
								<option key="none" value="">--- Select ---</option>
								{activeModal.trackday && activeModal.trackday.members.map((memberEntry) => <option key={memberEntry.user._id} value={memberEntry.user._id}>{memberEntry.user.firstName}, {memberEntry.user.lastName}</option>)}

							</select>
						</div>
						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>

			<Modal open={activeModal.type === 'editDetails'}>
				<>
					<h2>Edit Trackday Details</h2>
					<form onSubmit={(e) => handleEditDetailsSubmit(e, activeModal.trackday._id)}>

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
								<option key="regOpen" value="regOpen">Registration Open</option>
								<option key="regClosed" value="regClosed">Registration Closed</option>
								<option key="cancelled" value="cancelled">Cancelled</option>
								<option key="archived" value="archived">Archive</option>
							</select>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="user">Date</label>
							<input type='date' id="date" name="date" defaultValue={activeModal.trackday && activeModal.trackday.date.slice(0, 10)}></input>
						</div>

						<label htmlFor="rentalCost">Rental Cost</label>
						<input type='number' id="rentalCost" name="rentalCost" defaultValue={activeModal.trackday && activeModal.trackday.costs.find((cost) => cost.desc == 'rentalCost').amount} required></input>



						<label htmlFor="preRegTicketPrice">Advance</label>
						<input type='number' id="preRegTicketPrice" name="preRegTicketPrice" defaultValue={activeModal.trackday && activeModal.trackday.ticketPrice.preReg} required></input>

						<label htmlFor="gateTicketPrice">Gate</label>
						<input type='number' id="gateTicketPrice" name="gateTicketPrice" defaultValue={activeModal.trackday && activeModal.trackday.ticketPrice.gate} required></input>

						<label htmlFor="bundlePrice">Bundle</label>
						<input type='number' id="bundlePrice" name="bundlePrice" defaultValue={activeModal.trackday && activeModal.trackday.ticketPrice.bundle} required></input>






						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>


					<h2>Additional Costs</h2>
					<div>
						{additionalCosts.map((costObject) => {
							return (
								<div key={costObject.desc}>
									{costObject.desc},{costObject.type},{costObject.amount}<button onClick={() => handleaRemoveCost(activeModal.trackday._id, costObject._id)}>DELME</button>
								</div>
							)
						})}
					</div>

					<form className={styles.createCost} onSubmit={(e) => handleaAddCost(e, activeModal.trackday._id)}>

						<label htmlFor="desc">Description</label>
						<input type='text' id="desc" name="desc" required></input>

						<label htmlFor="type">Cost Type</label>
						<select name="type" id="type" required>
							<option key="fixed" value="fixed">Fixed</option>
							<option key="variable" value="variable">Variable</option>
						</select>

						<label htmlFor="amount">Amount</label>
						<input type='number' id="amount" name="amount" required></input>

						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Add new cost</button>

					</form>
				</>
			</Modal>

			<Modal open={activeModal.type === 'createTrackday'}>
				<>
					<h2>Create New Trackday</h2>
					<form onSubmit={(e) => handleCreateTrackdaySubmit(e)}>
						<label htmlFor="date">Date</label>
						<input type='date' id="date" name="date" required></input>
						<label htmlFor="rentalCost">Rental Cost</label>
						<input type='number' id="rentalCost" name="rentalCost" required></input>
						<label htmlFor="preRegTicketPrice">Advance Ticket Price</label>
						<input type='number' id="preRegTicketPrice" name="preRegTicketPrice" required></input>
						<label htmlFor="gateTicketPrice">Gate Ticket Price</label>
						<input type='number' id="gateTicketPrice" name="gateTicketPrice" required></input>
						<label htmlFor="bundlePrice">Bundle Ticket Price</label>
						<input type='number' id="bundlePrice" name="bundlePrice" required></input>

						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>


		</>
	);
};

export default ManageTrackdays;