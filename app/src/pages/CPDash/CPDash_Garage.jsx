import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_Garage.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


const Garage = ({ APIServer, userInfo, fetchAPIData, setActiveTab }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

	async function handleRequestQR(bikeID) {
		setActiveModal({ type: 'loading', msg: 'Requesting your QR Code' });
		try {
			const response = await fetch(APIServer + 'qrcode/' + userInfo._id + '/' + bikeID, {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				}
			})
			if (response.ok) {
				setActiveModal({ type: 'qrConfirm'});
			} else {
				const data = await response.json();
				setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
			}
		} catch (err) {
			setActiveModal({ type: 'failure', msg: 'API Failure' })
			console.log(err.message)
		}
	}

	async function handleRemoveBike(bikeID) {
		setActiveModal({ type: 'loading', msg: 'Selling your bike' });
		try {
			const response = await fetch(APIServer + 'garage/' + userInfo._id + '/' + bikeID, {
				method: 'DELETE',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				}
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Bike Sold!' });
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

	async function handleAddBike(e) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Parking your bike' });
		const formData = new FormData(e.target);
		try {
			const response = await fetch(APIServer + 'garage/' + userInfo._id, {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			await fetchAPIData();
			e.target.reset();
			if (response.ok) {
				setActiveModal({ type: 'addBikeConfirm'});
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
				<h1>My Bikes</h1>


				<div className={styles.allBikes}>
					{userInfo.garage && userInfo.garage.map((garageItem) => {
						return (
							<div key={garageItem.bike._id} className={styles.bikeEntry}>
								<div className='capitalizeEach' >{garageItem.bike.year} {garageItem.bike.make} <span className='capitalizeAll'>{garageItem.bike.model}</span></div>
								<div className={styles.bikeControls}>
									<button onClick={(e) => handleRequestQR(garageItem.bike._id)}>Request QR Code</button>
									<button className={styles.confirmBtn} onClick={(e) => handleRemoveBike(garageItem.bike._id)}>Remove</button>
								</div>

							</div>
						)
					})}
				</div>



				<form onSubmit={(e) => handleAddBike(e)}>

					<div className={styles.inputPairing}>
						<label htmlFor="year">Year:</label>
						<input type="number" id="year" name="year" required min={1900} max={2100}></input>
					</div>
					<div className={styles.inputPairing}>
						<label htmlFor="make">Make:</label>
						<input type="text" id="make" name="make" required minLength={2} maxLength={50}></input>
					</div>
					<div className={styles.inputPairing}>
						<label htmlFor="model">Model:</label>
						<input type="text" id="model" name="model" required minLength={2} maxLength={50}></input>
					</div>



					<button className={styles.confirmBtn} type="submit">Add Bike</button>
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

			<Modal open={activeModal.type === 'addBikeConfirm'}>
				<>
					Your bike has been added to your garage. We have created a QR code for you which will be available for pickup at the next trackday.
					<button className={`actionButton ${styles.confirmBtn}`} onClick={()=>setActiveTab('trackdays')}>Go to My Trackdays</button>
					<button className='actionButton' onClick={()=>setActiveModal('')}>Stay in garage</button>
				</>
			</Modal>

			<Modal open={activeModal.type === 'qrConfirm'}>
				<>
					We have created a QR code for you which will be available for pickup at the next trackday.
					<button className='actionButton' onClick={() => setActiveModal('')}>Ok</button>
				</>
			</Modal>
		</>


	);
};

export default Garage;