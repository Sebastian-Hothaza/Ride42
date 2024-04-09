import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useOutletContext, useNavigate } from "react-router-dom";

import styles from './stylesheets/Register.module.css'

import Card from "../components/Card"

const Register = () => {

	const { APIServer } = useOutletContext();
	const navigate = useNavigate();

	const registerForm =
		<form id={styles.registerForm} onSubmit={(e) => handleRegisterSubmit(e)} >
			<div className={styles.inputSection}>
				<div className={styles.inputPairing}>
					<label htmlFor="firstName">First Name:</label>
					<input type="text" id="firstName" name="firstName"></input>
				</div>

				<div className={styles.inputPairing}>
					<label htmlFor="lastName">Last Name:</label>
					<input type="text" id="lastName" name="lastName"></input>
				</div>

				<div className={styles.inputPairing}>
					<label htmlFor="group">Group:</label>
					<select name="group" id="group" form={styles.registerForm}>
						<option key="groupNone" value="">---Choose Group---</option>
						<option key="green" value="green">Green (Novice)</option>
						<option key="yellow" value="yellow">Yellow (Intermediate)</option>
						<option key="red" value="red">Red (Advanced)</option>
					</select>
				</div>

			</div>

			<div className={styles.inputSection}>
				<div className={styles.inputPairing}>
					<label htmlFor="email">Email:</label>
					<input type="text" id="email" name="email"></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="phone">Phone:</label>
					<input type="text" id="phone" name="phone"></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="address">Street Address:</label>
					<input type="text" id="address" name="address"></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="city">City:</label>
					<input type="text" id="city" name="city"></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="province">Province:</label>
					<select name="province" id="province" form={styles.registerForm}>
						<option key="ontario" value="ontario">Ontario</option>
						<option key="quebec" value="quebec">Quebec</option>
						<option key="other" value="other">Other</option>
					</select>
				</div>
			</div>
			<div className={styles.inputSection}>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyName_firstName">Emergency Contact - First Name:</label>
					<input type="text" id="EmergencyName_firstName" name="EmergencyName_firstName"></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyName_lastName">Emergency Contact - Last Name:</label>
					<input type="text" id="EmergencyName_lastName" name="EmergencyName_lastName"></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyPhone">Emergency Contact - Phone:</label>
					<input type="text" id="EmergencyPhone" name="EmergencyPhone"></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
					<input type="text" id="EmergencyRelationship" name="EmergencyRelationship"></input>
				</div>

			</div>
			<div className={styles.inputSection}>
				<div className={styles.inputPairing}>
					<label htmlFor="password">Password:</label>
					<input type="password" id="password" name="password"></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="passwordConfirm">Confirm Password:</label>
					<input type="password" id="passwordConfirm" name="passwordConfirm"></input>
				</div>
			</div>


			<button className={styles.registerBtn} type="submit">Submit</button>



		</form >


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