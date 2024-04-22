import styles from './stylesheets/CPDash_Garage.module.css'
import ScrollToTop from "../../components/ScrollToTop";
import { useState } from "react";
import Modal from "../../components/Modal";


const Garage = ({ APIServer, userInfo, fetchAPIData, setActiveTab }) => {

	const [pendingSubmit, setPendingSubmit] = useState('');
	const [addBikeConfirm, setAddBikeConfirm] = useState(false);
	const [QRConfirmModal, setQRConfirmModal] = useState(false);
	const [addBikeErrors, setAddBikeErrors] = useState('');
	const [showNotificationModal, setShowNotificationModal] = useState('');

	async function handleRequestQR(bikeID) {
		setPendingSubmit({ show: true, msg: 'Requesting your QR Code' });
		try {
			const response = await fetch(APIServer + 'qrcode/' + userInfo._id + '/' + bikeID, {
				method: 'POST',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				}
			})
			if (!response.ok) throw new Error('API Failure')

			// Updating accessToken in LS
			// const data = await response.json();
			// if (data.accessToken_FRESH) localStorage.setItem('accessToken', data.accessToken_FRESH);

			setQRConfirmModal(true);
		} catch (err) {
			console.log(err.message)
		}
		setPendingSubmit('');
	}

	async function handleRemoveBike(bikeID) {
		setPendingSubmit({ show: true, msg: 'Selling your bike' });
		try {
			const response = await fetch(APIServer + 'garage/' + userInfo._id + '/' + bikeID, {
				method: 'DELETE',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				}
			})
			if (!response.ok) throw new Error('API Failure')

			// Updating accessToken in LS
			// const data = await response.json();
			// if (data.accessToken_FRESH) localStorage.setItem('accessToken', data.accessToken_FRESH);
			setShowNotificationModal({ show: true, msg: 'Bike sold!' });
		} catch (err) {
			console.log(err.message)
		}
		await fetchAPIData();
		setPendingSubmit('')
	}

	async function handleAddBike(e) {
		e.preventDefault();
		setPendingSubmit({ show: true, msg: 'Parking your bike' });
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

			if (response.ok) {
				// Updating accessToken in LS
				// const data = await response.json();
				// if (data.accessToken_FRESH) localStorage.setItem('accessToken', data.accessToken_FRESH);

				await fetchAPIData();
				setPendingSubmit('');
				setAddBikeConfirm(true);
				setAddBikeErrors('');
				e.target.reset();
			} else if (response.status === 400 || response.status === 409) {
				const data = await response.json();
				setAddBikeErrors(data.msg);
			} else {
				throw new Error('API Failure')
			}
			setPendingSubmit('');


		} catch (err) {
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

				{addBikeErrors && addBikeErrors.length > 0 &&
					<ul className="errorText">Encountered the following errors:
						{addBikeErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
					</ul>}

			</div>

			<Modal open={pendingSubmit.show} type='loading' text={pendingSubmit.msg}></Modal>
			<Modal open={showNotificationModal.show} type='notification' text={showNotificationModal.msg} onClose={() => setShowNotificationModal('')}></Modal>
			<Modal open={addBikeConfirm} type='confirmation' text='Your bike has been added to your garage. We have created a QR code for you which will be available for pickup at the next trackday.'
				onClose={() => setAddBikeConfirm(false)} onOK={() => setActiveTab('trackdays')} okText="Go to trackdays" closeText="Stay in garage"></Modal>
			<Modal open={QRConfirmModal} type='confirmation' text='We have created a QR code for you which will be available for pickup at the next trackday.' onClose={() => setQRConfirmModal(false)} okText="" closeText="Ok"></Modal>
		</>


	);
};

export default Garage;