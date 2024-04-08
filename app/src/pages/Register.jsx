import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useOutletContext, useNavigate } from "react-router-dom";

import styles from './stylesheets/Register.module.css'

import Card from "../components/Card"

const Register = () => {

	const { APIServer } = useOutletContext();
	const navigate = useNavigate();

	const registerForm =
		<form id="registerForm" onSubmit={(e) => handleRegisterSubmit(e)} >
			<label htmlFor="firstName">First Name:</label>
			<input type="text" id="firstName" name="firstName"></input>
			<label htmlFor="lastName">Last Name:</label>
			<input type="text" id="lastName" name="lastName"></input>

			<label htmlFor="email">Email:</label>
			<input type="text" id="email" name="email"></input>
			<label htmlFor="phone">Phone:</label>
			<input type="text" id="phone" name="phone"></input>
			<label htmlFor="address">Address:</label>
			<input type="text" id="address" name="address"></input>
			<label htmlFor="city">City:</label>
			<input type="text" id="city" name="city"></input>
			<label htmlFor="province">Province:</label>
			<input type="text" id="province" name="province"></input>

			<label htmlFor="EmergencyName_firstName">Emergency Contact - First Name:</label>
			<input type="text" id="EmergencyName_firstName" name="EmergencyName_firstName"></input>
			<label htmlFor="EmergencyName_lastName">Emergency Contact - Last Name:</label>
			<input type="text" id="EmergencyName_lastName" name="EmergencyName_lastName"></input>
			<label htmlFor="EmergencyPhone">Emergency Contact - Phone:</label>
			<input type="text" id="EmergencyPhone" name="EmergencyPhone"></input>
			<label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
			<input type="text" id="EmergencyRelationship" name="EmergencyRelationship"></input>


			<label htmlFor="password">Password:</label>
			<input type="password" id="password" name="password"></input>
			<label htmlFor="passwordConfirm">Confirm New Password:</label>
			<input type="password" id="passwordConfirm" name="passwordConfirm"></input>

			<select name="group" id="group" form="registerForm">
				<option key="green" value="green">Green</option>
				<option key="yellow" value="yellow">Yellow</option>
				<option key="red" value="red">Red</option>
			</select>

			<button type="submit">Submit</button>



		</form>


	async function handleRegisterSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);

		const response = await fetch(APIServer + 'users/', {
			method: 'POST',
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
			},
			body: JSON.stringify(Object.fromEntries(formData))
		})
		if (response.status === 201) {
			navigate("/dashboard");
		} else if (response.status === 400) {
			const data = await response.json();
			console.log(data)
		} else {
			setEditUserInfoErrors(['API Error'])
		}
	}


	return (
		<>

			<div className="content">
				<Card heading='Register' body={registerForm} inverted={false} />
			</div>

		</>
	);
};

export default Register;