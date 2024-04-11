import styles from './CPDash_Garage.module.css'

const Garage = ({ APIServer, userInfo, fetchAPIData }) => {




	async function handleRequestQR(bikeID) {
		try {
			const response = await fetch(APIServer + 'qrcode/' + userInfo._id + '/' + bikeID, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			if (!response.ok) throw new Error('API Failure')
		} catch (err) {
			console.log(err)
		}
	}

	async function handleRemoveBike(bikeID) {
		try{
			const response = await fetch(APIServer + 'garage/' + userInfo._id + '/' + bikeID, {
				method: 'DELETE',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
			})
			if (!response.ok) throw new Error('API Failure')
			fetchAPIData();
		} catch (err) {
			console.log(err)
		}
		
	}

	async function handleAddBike(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		try{
			const response = await fetch(APIServer + 'garage/' + userInfo._id, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			if (!response.ok) throw new Error('API Failure')
			fetchAPIData();
		} catch (err){
			console.log(err)
		}
	}


	return (
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

		</div>

	);
};

export default Garage;