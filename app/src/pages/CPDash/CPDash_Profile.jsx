import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_Profile.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'



const Profile = ({ APIServer, userInfo, fetchAPIData }) => {

	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
	
	const [lockedUserInfo, setLockedUserInfo] = useState(true); // Tracks if we are editing fields



	// Build array of groups user can switch into
	let groupChange = [{ value: 'green', displayValue: 'Green (Novice)' }, { value: 'yellow', displayValue: 'Yellow (Intermediate)' }, { value: 'red', displayValue: 'Red (Advanced)' }]
	// Remove group user is currently in from the array
	groupChange = groupChange.filter((group) => group.value !== userInfo.group)


	function checkPhoneFormat() {
		let input = document.getElementById('phone');
		const phoneStr = input.value.replace(/[^0-9]/g, '');
		if (phoneStr.length === 10) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Phone must contain 10 digits');
		}
	}

	function checkPswFormat() {
		let input = document.getElementById('newPassword');
		if ((/^(?=.*[0-9])(?=.*[a-z])(?!.* ).{8,50}$/).test(input.value) && input.value.length >= 8 && input.value.length <= 50) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Password must contain minimum 8 characters be a combination of letters and numbers');
		}
	}

	function checkPswMatches() {
		let input = document.getElementById('newPasswordConfirm');
		if (input.value == document.getElementById('newPassword').value) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Password must match');
		}
	}


	async function handleUserGroupSubmit(e, newGroup) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Updating your group' });
		try {
			const response = await fetch(APIServer + 'users/' + userInfo._id, {
				method: 'PUT',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
					email: userInfo.contact.email,
					phone: userInfo.contact.phone,
					address: userInfo.contact.address,
					city: userInfo.contact.city,
					province: userInfo.contact.province,
					EmergencyName_firstName: userInfo.emergencyContact.firstName,
					EmergencyName_lastName: userInfo.emergencyContact.lastName,
					EmergencyPhone: userInfo.emergencyContact.phone,
					EmergencyRelationship: userInfo.emergencyContact.relationship,
					group: newGroup
				})
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Group updated' });
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

	async function handlelockedUserInfoSubmit(e) {
		e.preventDefault();
		e.target.phone.value = e.target.phone.value.replace(/[^0-9]/g, '');
		e.target.EmergencyPhone.value = e.target.EmergencyPhone.value.replace(/[^0-9]/g, '');
		setActiveModal({ type: 'loading', msg: 'Updating your profile' });
		const formData = new FormData(e.target);
		formData.append("group", userInfo.group);
		try {
			const response = await fetch(APIServer + 'users/' + userInfo._id, {
				method: 'PUT',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			await fetchAPIData(); //TODO: Should we refresh user displayed fields to new updated values? Or in case of fail, to old valid values?
			if (response.ok) {
				setLockedUserInfo(true)
				setActiveModal({ type: 'success', msg: 'Profile updated' });
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

	async function handleChangePasswordSubmit(e) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Updating your password' });
		const formData = new FormData(e.target);
		try {
			const response = await fetch(APIServer + 'password/' + userInfo._id, {
				method: 'PUT',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'Password updated' });
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
			{!userInfo ? <div>...</div> :
				<div className={styles.content}>
					<h1>My Profile</h1>
					<div className={styles.inputSection}>
						<div id={styles.groupContainer}>
							<div className='capitalizeEach'>Group: {userInfo.group}</div>
							<button onClick={() => setActiveModal({ type: 'selectGroup' })}>Change Group</button>
						</div>

						<div>Days on Credit: {userInfo.credits}</div>
					</div>

					<form className={styles.inputSection} onSubmit={(e) => handlelockedUserInfoSubmit(e)} >
						<div className={styles.inputPairing}>
							<label htmlFor="email">Email:</label>
							<input type="email" id="email" name="email" disabled={lockedUserInfo} defaultValue={userInfo.contact.email} required></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="phone">Phone:</label>
							<input type="tel" id="phone" name="phone" disabled={lockedUserInfo} defaultValue={userInfo.contact.phone} required onInput={checkPhoneFormat}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="address">Address:</label>
							<input className='capitalizeEach' type="text" id="address" name="address" disabled={lockedUserInfo} defaultValue={userInfo.contact.address} required minLength={2} maxLength={50}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="city">City:</label>
							<input className='capitalizeEach' type="text" id="city" name="city" disabled={lockedUserInfo} defaultValue={userInfo.contact.city} required minLength={2} maxLength={50}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="province">Province:</label>
							<select name="province" id="province" disabled={lockedUserInfo} defaultValue={userInfo.contact.province} required>
								<option key="ontario" value="ontario">Ontario</option>
								<option key="quebec" value="quebec">Quebec</option>
								<option key="other" value="other">Other</option>
							</select>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyName_firstName">Emergency Contact - First Name:</label>
							<input className='capitalizeEach' type="text" id="EmergencyName_firstName" name="EmergencyName_firstName" disabled={lockedUserInfo} defaultValue={userInfo.emergencyContact.firstName} required minLength={2} maxLength={50}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyName_lastName">Emergency Contact - Last Name:</label>
							<input className='capitalizeEach' type="text" id="EmergencyName_lastName" name="EmergencyName_lastName" disabled={lockedUserInfo} defaultValue={userInfo.emergencyContact.lastName} required minLength={2} maxLength={50}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyPhone">Emergency Contact - Phone:</label>
							<input type="tel" id="EmergencyPhone" name="EmergencyPhone" disabled={lockedUserInfo} defaultValue={userInfo.emergencyContact.phone} required onInput={checkPhoneFormat}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
							<input className='capitalizeEach' type="text" id="EmergencyRelationship" name="EmergencyRelationship" disabled={lockedUserInfo} defaultValue={userInfo.emergencyContact.relationship} required minLength={2} maxLength={50}></input>
						</div>
						<div className={styles.btnContainer} >
							{!lockedUserInfo ?
								<div className={styles.confirmContainer}>
									<button type="button" onClick={() => setLockedUserInfo(true)}>Cancel</button>								
									<button className={styles.confirmBtn} type="submit">Confirm</button>
								</div>
								: <button type="button" onClick={() => setLockedUserInfo(false)}>Edit Personal Info</button>}
						</div>
					</form>

					<form className={styles.inputSection} onSubmit={(e) => handleChangePasswordSubmit(e)}>
						<div className={styles.inputPairing}>
							<label htmlFor="oldPassword">Old Password:</label>
							<input type="password" id="oldPassword" name="oldPassword" required></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="newPassword">New Password:</label>
							<input type="password" id="newPassword" name="newPassword" required onInput={checkPswFormat}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="newPasswordConfirm">Confirm New Password:</label>
							<input type="password" id="newPasswordConfirm" name="newPasswordConfirm" required onInput={checkPswMatches}></input>
						</div>
						<div id={styles.changePswBtn} >
							<button className={styles.confirmBtn} type="submit">Change Password</button>
						</div>
					</form>
				</div>
			}
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

			<Modal open={activeModal.type === 'selectGroup'}>
				<>
					Which group?
					<form onSubmit={(e) => handleUserGroupSubmit(e, e.target.result.value)}>
						<select name="result" id="result" required>
							<option key="none" value="">---Select---</option>
							{groupChange.map((item) => <option key={item.value} value={item.value}>{item.displayValue}</option>)}
						</select>
						<button className={`actionButton ${styles.confirmBtn}`} type="submit">Confirm</button>
						<button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
					</form>
				</>
			</Modal>

		</>
	);
};

export default Profile;