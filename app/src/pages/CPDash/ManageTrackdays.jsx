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
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = useState(currentYear);

	let years = [];

	// Modify date of allTrackdaysFULL to be a nice format
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
		allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
		allTrackdaysFULL.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
	}

	// Sort the members array if we are displaying a modal where members array will be presented
	if (activeModal.trackday) {
		activeModal.trackday.members.sort((a, b) => (a.user.firstName > b.user.firstName) ? 1 : ((b.user.firstName > a.user.firstName) ? -1 : 0))
	}





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

	async function handleRemoveCost(trackdayID, costID) {
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

	async function handleDeleteTrackday(trackdayID){
		alert('not yet implemented; extreme caution needed as currently may break back end', trackdayID);
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

	return (
		<>
			<ScrollToTop />
			<div className={styles.content}>
				<h1>Manage Trackdays:
					<form>
						<div>
							<select name="yearSelect" id="yearSelect" defaultValue={selectedYear} onChange={() => { setSelectedYear(yearSelect.value) }} required>
								{years.map((year) => <option value={year} key={year}>{year}</option>)}
							</select>
						</div>
					</form>
				</h1>
				<div>
					{allTrackdaysFULL.map((trackday) => {
						return (
							<div key={trackday._id} className={styles.tdEntry}>
								<div className={styles.tdInfo}>
									<div>{trackday.prettyDate} ({trackday.layout}) - {trackday.status}</div>
								</div>
								<div className={styles.tdControls}>
									<button className={styles.editBtn} style={{ color: '#00ee00' }} onClick={() => setActiveModal({ type: 'register', trackday: trackday })}><span className='material-symbols-outlined'>person_add</span></button>
									<button className={styles.editBtn} style={{ color: '#ee0000' }} onClick={() => setActiveModal({ type: 'unregister', trackday: trackday })}><span className='material-symbols-outlined'>person_remove</span></button>
									<button className={styles.editBtn} style={{ color: '#0099ff' }} onClick={() => {
										setAdditionalCosts(trackday.costs.filter((costObject) => costObject.desc != 'trackRental'));
										setActiveModal({ type: 'editDetails', trackday: trackday })
									}}><span className='material-symbols-outlined'>edit</span></button>
									<button className={styles.editBtn} style={{ backgroundColor: '#bb0000' }} onClick={() => setActiveModal({ type: 'deleteTrackday', trackday: trackday })}><span className='material-symbols-outlined'>delete</span></button>
								</div>
							</div>
						)
					})}
				</div>
				{selectedYear == currentYear && <button className={styles.createButton} onClick={() => setActiveModal({ type: 'createTrackday' })}>Create Trackday</button>}
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
						<label htmlFor="user">Select User:</label>
						<select className='capitalizeEach' name="user" id="user" required>
							<option key="none" value=""></option>
							{activeModal.trackday && allUsers.filter((user) => !activeModal.trackday.members.find((memberEntry) => memberEntry.user._id === user._id)).map((user) => <option key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
						</select>
						<label htmlFor="paymentMethod">Payment Method:</label>
						<select name="paymentMethod" id="paymentMethod" required>
							<option key="paymentNone" value=""></option>
							<option key="etransfer" value="etransfer">Interac E-Transfer</option>
							<option key="creditCard" value="creditCard">Credit Card</option>
							<option key="credit" value="credit">Use trackday credit</option>
							<option key="gate" value="gate">Gate</option>
						</select>
						<button className={`actionButton confirmBtn`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>

			<Modal open={activeModal.type === 'unregister'}>
				<>
					<h2>Un-register User</h2>
					<form onSubmit={(e) => handleUnRegisterSubmit(e, e.target.user.value, activeModal.trackday._id)}>


						<label htmlFor="user">Select User:</label>
						<select className='capitalizeEach' name="user" id="user" required>
							<option key="none" value=""></option>
							{activeModal.trackday && activeModal.trackday.members.map((memberEntry) => <option key={memberEntry.user._id} value={memberEntry.user._id}>{memberEntry.user.firstName}, {memberEntry.user.lastName}</option>)}

						</select>

						<button className={`actionButton confirmBtn`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>

			<Modal open={activeModal.type === 'editDetails'}>
				<>
					<h2>Edit Trackday Details</h2>
					<form id={styles.editTrackdayForm} onSubmit={(e) => handleEditDetailsSubmit(e, activeModal.trackday._id)}>
						<div>
							<label htmlFor="user">Date</label>
							<input type='date' id="date" name="date" defaultValue={activeModal.trackday && activeModal.trackday.date.slice(0, 10)}></input>
						</div>
						<div>
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
						<div>
							<label htmlFor="group">Status</label>
							<select name="status" id="status" defaultValue={activeModal.trackday && activeModal.trackday.status} required>
								<option key="regOpen" value="regOpen">Registration Open</option>
								<option key="regClosed" value="regClosed">Registration Closed</option>
								<option key="cancelled" value="cancelled">Cancelled</option>
								<option key="archived" value="archived">Archive</option>
							</select>
						</div>
						<div>
							<label htmlFor="rentalCost">Rental Cost($)</label>
							<input type='number' id="rentalCost" name="rentalCost" defaultValue={activeModal.trackday && activeModal.trackday.costs.find((cost) => cost.desc == 'trackRental').amount} required></input>
						</div>
						<div>
							<label htmlFor="preRegTicketPrice">Advance($)</label>
							<input type='number' id="preRegTicketPrice" name="preRegTicketPrice" defaultValue={activeModal.trackday && activeModal.trackday.ticketPrice.preReg} required></input>
						</div>
						<div>
							<label htmlFor="gateTicketPrice">Gate($)</label>
							<input type='number' id="gateTicketPrice" name="gateTicketPrice" defaultValue={activeModal.trackday && activeModal.trackday.ticketPrice.gate} required></input>
						</div>
						<div>
							<label htmlFor="bundlePrice">Bundle($)</label>
							<input type='number' id="bundlePrice" name="bundlePrice" defaultValue={activeModal.trackday && activeModal.trackday.ticketPrice.bundle} required></input>
						</div>
						<div></div>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
						<button className={`actionButton confirmBtn`} type="submit">Confirm</button>

					</form>


					<h2>Additional Costs</h2>

					<form id={styles.editCostsForm} onSubmit={(e) => handleaAddCost(e, activeModal.trackday._id)}>
						<div>
							<label htmlFor="desc">Description</label>
							<input type='text' autoComplete='off' id="desc" name="desc" required></input>
						</div>
						<div>
							<label htmlFor="type">Type</label>
							<select name="type" id="type" required>
								<option key="fixed" value="fixed">Fixed</option>
								<option key="variable" value="variable">Variable</option>
							</select>
						</div>
						<div>
							<label htmlFor="amount">Amount($)</label>
							<input type='number' step='0.01' autoComplete='off' id="amount" name="amount" required></input>
						</div>
						<button className='actionButton' type="submit">Add cost</button>

					</form>
					<div id={styles.additionalCostsList}>
						{additionalCosts.map((costObject) => {
							return (
								<div key={costObject.desc}>
									<div key={costObject.desc}>{costObject.desc}, ${costObject.amount}{costObject.type == 'variable' && '/person'}</div>
									<button className={ `actionButton confirmBtn`}onClick={() => handleRemoveCost(activeModal.trackday._id, costObject._id)}><span className='material-symbols-outlined'>delete</span></button>
								</div>
							)
						})}
					</div>
				</>
			</Modal>

			<Modal open={activeModal.type === 'deleteTrackday'}>
				<>
					Are you sure you want to delete this trackday?
					<button className={`actionButton confirmBtn`} onClick={() => handleDeleteTrackday(activeModal.trackday.id)}>Delete</button>
					<button className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
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

						<button className={`actionButton confirmBtn`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>


		</>
	);
};

export default ManageTrackdays;