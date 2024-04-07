import { useEffect, useState } from "react";



const Garage = ({ loggedInUser, APIServer }) => {
	const [userGarage, setUserGarage] = useState('');

	async function fetchAPIData() {
		try {
			const response = await fetch(APIServer + 'users/' + loggedInUser.id, {
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to get API Data")
			const data = await response.json();
			setUserGarage(data.garage);
		} catch (err) {
			console.log(err.message)
		}
	}

	async function handleRequestQR(bikeID) {
		const response = await fetch(APIServer + 'qrcode/' + loggedInUser.id + '/' + bikeID, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
			},
		})
	}

	async function handleRemoveBike(bikeID) {
		const response = await fetch(APIServer + 'garage/' + loggedInUser.id + '/' + bikeID, {
			method: 'DELETE',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
			},
		})
		fetchAPIData();
	}

	async function handleAddBike(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const response = await fetch(APIServer + 'garage/' + loggedInUser.id, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
			},
			body: JSON.stringify(Object.fromEntries(formData))
		})
		fetchAPIData();
	}

	useEffect(() => {
		fetchAPIData();
	}, [])

	return (
		<>
			<div>My Bikes</div>
			{userGarage && userGarage.map((garageItem) => {
				return (
					<div key={garageItem._id}>
						<div>{garageItem.year} {garageItem.make} {garageItem.model}</div>
						<button onClick={(e) => handleRequestQR(garageItem._id)}>Request QR Code</button>
						<button onClick={(e) => handleRemoveBike(garageItem._id)}>Remove</button>
					</div>
				)
			})}
			<form id="CPDash_Garage_addBike" onSubmit={(e) => handleAddBike(e)}>
				<label htmlFor="year">Year:</label>
				<input type="number" id="year" name="year"></input>
				<label htmlFor="make">Make:</label>
				<input type="text" id="make" name="make"></input>
				<label htmlFor="model">Model:</label>
				<input type="text" id="model" name="model"></input>
				<button type="submit">Add Bike</button>
			</form>

		</>

	);
};

export default Garage;