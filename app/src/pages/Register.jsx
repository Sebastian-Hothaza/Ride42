import { useOutletContext, useNavigate } from "react-router-dom";
import { useState } from "react";

import Card from "../components/Card"
import Modal from "../components/Modal";
import Loading from '../components/Loading';

import styles from './stylesheets/Register.module.css'
import modalStyles from '../components/stylesheets/Modal.module.css'

import checkmark from './../assets/checkmark.png'
import errormark from './../assets/error.png'

const Register = () => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

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
					<input type="text" id="lastName" name="lastName" required minLength={2} maxLength={50}></input>
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
					<input type="email" id="email" name="email" required onInput={checkEmailMatches}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="emailConfirm">Confirm Email:</label>
					<input type="email" id="emailConfirm" name="emailConfirm" required onInput={checkEmailMatches}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="phone">Phone:</label>
					<input type="tel" id="phone" name="phone" required onInput={checkPhoneFormat}></input>
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
					<input type="tel" id="EmergencyPhone" name="EmergencyPhone" required onInput={checkPhoneFormat}></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
					<input type="text" id="EmergencyRelationship" name="EmergencyRelationship" required minLength={2} maxLength={50}></input>
				</div>

			</div>
			<div className={styles.inputSection}>
				<div className={styles.inputPairing}>
					<label htmlFor="password">Password:</label>
					<input type="password" id="password" name="password" required onInput={checkPswFormat} ></input>
				</div>
				<div className={styles.inputPairing}>
					<label htmlFor="passwordConfirm">Confirm Password:</label>
					<input type="password" id="passwordConfirm" name="passwordConfirm" required onInput={checkPswMatches}></input>
				</div>
			</div>
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
		if ((/^(?=.*[0-9])(?=.*[a-z])(?!.* ).{8,50}$/).test(input.value) && input.value.length >= 8 && input.value.length <= 50) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Password must contain minimum 8 characters and be a combination of letters and numbers');
		}
	}
	function checkPhoneFormat() {
		let input = document.getElementById('phone');
		const phoneStr = input.value.replace(/[^0-9]/g, '');
		if (phoneStr.length === 10) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Phone must contain 10 digits');
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
		setActiveModal({ type: 'loading', msg: 'Submitting Your Registration...' });
		// Strip out non-numerical values from phone and emergency phone
		e.target.phone.value = e.target.phone.value.replace(/[^0-9]/g, '');
		e.target.EmergencyPhone.value = e.target.EmergencyPhone.value.replace(/[^0-9]/g, '');

		const formData = new FormData(e.target);
		try {
			const response = await fetch(APIServer + 'users/', {
				method: 'POST',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})

			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Account created, taking you to log in page...' });
				setTimeout(() => navigate("/dashboard"), 3000)
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
			<div className="content">
				<Card heading='Register' body={registerForm} inverted={false} />
			</div>

			<Loading open={activeModal.type === 'loading'}>
				{activeModal.msg}
			</Loading>

			<Modal open={activeModal.type === 'success'} type='testing' >
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
				{activeModal.msg}
			</Modal>

			<Modal open={activeModal.type === 'failure'} type='testing' >
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
				{activeModal.msg}
				<button className='actionButton' onClick={() => setActiveModal('')}>Ok</button>
			</Modal>


		</>
	);
};

export default Register;