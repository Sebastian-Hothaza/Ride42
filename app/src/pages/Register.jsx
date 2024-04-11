import { useOutletContext, useNavigate } from "react-router-dom";
import { useState } from "react";


import styles from './stylesheets/Register.module.css'

import Card from "../components/Card"
import Modal_Loading from "../components/Modal_Loading";

const Register = () => {
	const [registerErrors, setRegisterErrors] = useState();
    const [pendingSubmit, setPendingSubmit] = useState(false);
	const { APIServer } = useOutletContext();
	const navigate = useNavigate();

	const registerForm =
		<form id={styles.registerForm} onSubmit={(e) => handleRegisterSubmit(e)} >
			<div className={styles.inputSection}>
				<div className={styles.inputPairing}>
					<label htmlFor="firstName">First Name:</label>
					<input type="text" id="firstName" name="firstName" required minLength={2} maxLength={50}></input>
				</div>

				<div className={styles.inputPairing}>
					<label htmlFor="lastName">Last Name:</label>
					<input type="text" id="lastName" name="lastName"  required minLength={2} maxLength={50}></input>
				</div>

				<div className={styles.inputPairing}>
					<label htmlFor="group">Group:</label>
					<select name="group" id="group" form={styles.registerForm} required>
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
					<input type="email" id="email" name="email" required></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="emailConfirm">Confirm Email:</label>
					<input type="email" id="emailConfirm" name="emailConfirm" required onInput={checkEmailMatches}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="phone">Phone:</label>
					<input type="tel" id="phone" name="phone" required minLength={10} maxLength={10}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="address">Street Address:</label>
					<input type="text" id="address" name="address" required minLength={2} maxLength={50}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="city">City:</label>
					<input type="text" id="city" name="city" required minLength={2} maxLength={50}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="province">Province:</label>
					<select name="province" id="province" form={styles.registerForm} required>
						<option key="ontario" value="ontario">Ontario</option>
						<option key="quebec" value="quebec">Quebec</option>
						<option key="other" value="other">Other</option>
					</select>
				</div>
			</div>
			<div className={styles.inputSection}>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyName_firstName">Emergency Contact - First Name:</label>
					<input type="text" id="EmergencyName_firstName" name="EmergencyName_firstName" required minLength={2} maxLength={50}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyName_lastName">Emergency Contact - Last Name:</label>
					<input type="text" id="EmergencyName_lastName" name="EmergencyName_lastName" required minLength={2} maxLength={50}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyPhone">Emergency Contact - Phone:</label>
					<input type="tel" id="EmergencyPhone" name="EmergencyPhone" required minLength={10} maxLength={10}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
					<input type="text" id="EmergencyRelationship" name="EmergencyRelationship" required minLength={2} maxLength={50}></input>
				</div>

			</div>

			<div className={styles.inputSection}>
				<div className={styles.inputPairing}>
					<label htmlFor="password">Password:</label>
					<input type="password" id="password" name="password" required onInput={checkPswFormat}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="passwordConfirm">Confirm Password:</label>
					<input type="password" id="passwordConfirm" name="passwordConfirm" required onInput={checkPswMatches}></input>
				</div>
			</div>

			{
				registerErrors && registerErrors.length > 0 &&
				<ul className="errorText">Encountered the following errors:
					{registerErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
				</ul>
			}

			<button className={styles.registerBtn} type="submit">Submit Registration</button>



		</form >



	function checkEmailMatches() {
		let input = document.getElementById('emailConfirm');
		if (input.value == document.getElementById('email').value) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Email must match');
		}
	}
	function checkPswFormat() {
		let input = document.getElementById('password');
		if ((/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,50}$/).test(input.value) && input.value.length>=8 && input.value.length<=50) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Password must contain minimum 8 characters and be a combination of letters and numbers');
		}
	}
	function checkPswMatches() {
		let input = document.getElementById('passwordConfirm');
		if (input.value == document.getElementById('password').value) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Password must match');
		}
	}


	async function handleRegisterSubmit(e) {
		e.preventDefault();
		setPendingSubmit(true);
		const formData = new FormData(e.target);
		try {
			const response = await fetch(APIServer + 'users/', {
				method: 'POST',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			setPendingSubmit(false);
			if (response.ok) {
				navigate("/dashboard");
			} else if (response.status === 400) {
				const data = await response.json();
				setRegisterErrors(data.msg);
			} else if (response.status === 409) {
				const data = await response.json();
				setRegisterErrors([data.msg]);
			} else {
				throw new Error('API Failure')
			}
		} catch (err) {
			console.log(err)
		}
	}



	return (
		<>
			<div className="content">
				<Card heading='Register' body={registerForm} inverted={false} />
			</div>
			<Modal_Loading open={pendingSubmit} text={'Submitting Your Registration...'}>  </Modal_Loading>
		</>
	);
};

export default Register;