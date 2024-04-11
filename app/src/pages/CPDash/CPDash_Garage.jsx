import styles from './CPDash_Garage.module.css'
import ScrollToTop from "../../components/ScrollToTop";
import { useState } from "react";
import Modal_Loading from "../../components/Modal_Loading";
import Modal from "../../components/Modal";


const Garage = ({ APIServer, userInfo, fetchAPIData, setActiveTab }) => {

	const [pendingSubmit, setPendingSubmit] = useState('');
	const [addBikeConfirm, setAddBikeConfirm] = useState(false);
	const [QRConfirm, setQRConfirm] = useState(false);
	const [addBikeErrors, setAddBikeErrors] = useState('');


	async function handleRequestQR(bikeID) {
		setPendingSubmit({ show: true, msg: 'Requesting your QR Code' });
		try {
			const response = await fetch(APIServer + 'qrcode/' + userInfo._id + '/' + bikeID, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			if (!response.ok) throw new Error('API Failure')
			setQRConfirm(true);
		} catch (err) {
			console.log(err)
		}
		setPendingSubmit('');
	}

	async function handleRemoveBike(bikeID) {
		setPendingSubmit({ show: true, msg: 'Selling your bike' });
		try {
			const response = await fetch(APIServer + 'garage/' + userInfo._id + '/' + bikeID, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			if (!response.ok) throw new Error('API Failure')

		} catch (err) {
			console.log(err)
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
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})

			if (response.ok) {
				await fetchAPIData();
				setPendingSubmit('');
				setAddBikeConfirm(true);
				setAddBikeErrors('');
				e.target.reset();
			} else if (response.status === 400) {
				const data = await response.json();
				setAddBikeErrors(data.msg);
			} else if (response.status === 409) {
				const data = await response.json();
				setAddBikeErrors([data.msg]);
			} else {
				throw new Error('API Failure')
			}
			setPendingSubmit('');


		} catch (err) {
			console.log(err)
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
							<div key={garageItem._id} className={styles.bikeEntry}>
								<div>{garageItem.year} {garageItem.make} {garageItem.model}</div>
								<div className={styles.bikeControls}>
									<button onClick={(e) => handleRequestQR(garageItem._id)}>Request QR Code</button>
									<button className={styles.confirmBtn} onClick={(e) => handleRemoveBike(garageItem._id)}>Remove</button>
								</div>

							</div>
						)
					})}
				</div>



				<form id={styles.addBikeForm} onSubmit={(e) => handleAddBike(e)}>
					<div id={styles.formFields}>
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
					</div>


					<button className={styles.confirmBtn} type="submit">Add Bike</button>
				</form>

				{addBikeErrors && addBikeErrors.length > 0 &&
					<ul className="errorText">Encountered the following errors:
						{addBikeErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
					</ul>}

			</div>

			<Modal_Loading open={pendingSubmit.show} text={pendingSubmit.msg}></Modal_Loading>
			<Modal open={addBikeConfirm} onClose={() => setAddBikeConfirm(false)}
				text='Your bike has been added to your garage. We have created a QR code for you which will be available for pickup at the next trackday.' okText="Go to trackdays" closeText="Stay in garage"
				fn={() => setActiveTab('trackdays')}></Modal>
			<Modal open={QRConfirm} onClose={() => setQRConfirm(false)}
				text='We have created a QR code for you which will be available for pickup at the next trackday.' okText="" closeText="Ok"></Modal>

		</>


	);
};

export default Garage;