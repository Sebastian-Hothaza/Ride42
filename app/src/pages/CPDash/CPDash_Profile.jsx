import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";
import Modal from "../../components/Modal";
import styles from './CPDash_Profile.module.css'

const Profile = ({ APIServer, userInfo, fetchAPIData }) => {

	const [editUserInfo, setEditUserInfo] = useState(false); // Tracks if we are editing fields
	const [editUserInfoErrors, setEditUserInfoErrors] = useState(); // Array corresponding to error messages received from API
	const [changePswErrorMsg, setChangePswErrorMsg] = useState(); // Array corresponding to error messages received from API
	const [pendingSubmit, setPendingSubmit] = useState('');
	const [showChangeGroupModal, setShowChangeGroupModal] = useState(false);
	const [showNotificationModal, setShowNotificationModal] = useState('');

	// Build array of groups user can switch into
	let groupChange = [{ value: 'green', displayValue: 'Green (Novice)' }, { value: 'yellow', displayValue: 'Yellow (Intermediate)' }, { value: 'red', displayValue: 'Red (Advanced)' }]
	// Remove group user is currently in from the array
	groupChange = groupChange.filter((group)=>group.value !== userInfo.group)

	

	async function handleEditUserInfoSubmit(e) {
		e.preventDefault();
		e.target.phone.value = e.target.phone.value.replace(/[^0-9]/g, '');
		e.target.EmergencyPhone.value = e.target.EmergencyPhone.value.replace(/[^0-9]/g, '');
		setPendingSubmit({ show: true, msg: 'Updating your profile' });
		const formData = new FormData(e.target);
		formData.append("group", userInfo.group);
		try {
			const response = await fetch(APIServer + 'users/' + userInfo._id, {
				method: 'PUT',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
					'Authorization': 'bearer ' + localStorage.getItem('accessToken') + ' ' + localStorage.getItem('refreshToken'),
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			if (response.ok) {
				// Updating accessToken in LS
				// const data = await response.json();
				// if (data.accessToken_FRESH) localStorage.setItem('accessToken', data.accessToken_FRESH);

				setEditUserInfo(false)
				setEditUserInfoErrors('');
				// TODO: Do we need to fetchapidata here? Maybe add it in before clearing out pending submit
				setShowNotificationModal({ show: true, msg: 'Profile updated' });
			} else if (response.status === 400) {
				const data = await response.json();
				setEditUserInfoErrors(data.msg)
			} else if (response.status === 409) {
				const data = await response.json();
				setEditUserInfoErrors([data.msg])
			} else {
				throw new Error('API Failure')
			}
		} catch (err) {
			console.log(err.message)
		}
		setPendingSubmit('');
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

	async function handleChangePasswordSubmit(e) {
		e.preventDefault();
		setPendingSubmit({ show: true, msg: 'Updating your password' });
		const formData = new FormData(e.target);
		try {
			const response = await fetch(APIServer + 'password/' + userInfo._id, {
				method: 'PUT',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
					'Authorization': 'bearer ' + localStorage.getItem('accessToken') + ' ' + localStorage.getItem('refreshToken'),
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			if (response.ok) {

				// Updating accessToken in LS
				// const data = await response.json();
				// if (data.accessToken_FRESH) localStorage.setItem('accessToken', data.accessToken_FRESH);

				setChangePswErrorMsg('');
				setShowNotificationModal({ show: true, msg: 'Password updated' });
			} else {
				const data = await response.json();
				setChangePswErrorMsg(data.msg)
			}
		} catch (err) {
			console.log(err.message)
		}
		e.target.reset();
		setPendingSubmit('');
	}

	async function handleUserGroupSubmit(e, newGroup) {
		e.preventDefault();
		setShowChangeGroupModal(false)
		setPendingSubmit({ show: true, msg: 'Updating your group' });
		try {
			const response = await fetch(APIServer + 'users/' + userInfo._id, {
				method: 'PUT',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
					'Authorization': 'bearer ' + localStorage.getItem('accessToken') + ' ' + localStorage.getItem('refreshToken'),
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
			if (response.ok) {

				// Updating accessToken in LS
				// const data = await response.json();
				// if (data.accessToken_FRESH) localStorage.setItem('accessToken', data.accessToken_FRESH);

				await fetchAPIData();
				setShowNotificationModal({ show: true, msg: 'Group updated' });
			} else if (response.status === 400) {
				const data = await response.json();
				console.log('Change group failed: ', data)
			} else {
				throw new Error('API Failure')
			}
		} catch (err) {
			console.log(err.message)
		}
		
		setPendingSubmit('');
	}



	return (
		<>
			<ScrollToTop />
			{!userInfo ? <div>...</div> :
				<div className={styles.content}>
					<h1>My Profile</h1>
					<div className={styles.inputSection}>
						<div id={styles.groupContainer}>
							<div>Group: {userInfo.group[0].toUpperCase() + userInfo.group.slice(1)}</div>
							<button onClick={() => setShowChangeGroupModal(true)}>Change Group</button>
						</div>

						<div>Days on Credit: {userInfo.credits}</div>
					</div>

					<form className={styles.inputSection} onSubmit={(e) => handleEditUserInfoSubmit(e)} >
						<div className={styles.inputPairing}>
							<label htmlFor="email">Email:</label>
							<input type="email" id="email" name="email" disabled={!editUserInfo} defaultValue={userInfo.contact.email} required></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="phone">Phone:</label>
							<input type="tel" id="phone" name="phone" disabled={!editUserInfo} defaultValue={userInfo.contact.phone} required onInput={checkPhoneFormat}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="address">Address:</label>
							<input type="text" id="address" name="address" disabled={!editUserInfo} defaultValue={userInfo.contact.address} required minLength={2} maxLength={50}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="city">City:</label>
							<input type="text" id="city" name="city" disabled={!editUserInfo} defaultValue={userInfo.contact.city} required minLength={2} maxLength={50}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="province">Province:</label>
							<select name="province" id="province" disabled={!editUserInfo} defaultValue={userInfo.contact.province} required>
								<option key="ontario" value="ontario">Ontario</option>
								<option key="quebec" value="quebec">Quebec</option>
								<option key="other" value="other">Other</option>
							</select>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyName_firstName">Emergency Contact - First Name:</label>
							<input type="text" id="EmergencyName_firstName" name="EmergencyName_firstName" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.firstName} required minLength={2} maxLength={50}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyName_lastName">Emergency Contact - Last Name:</label>
							<input type="text" id="EmergencyName_lastName" name="EmergencyName_lastName" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.lastName} required minLength={2} maxLength={50}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyPhone">Emergency Contact - Phone:</label>
							<input type="tel" id="EmergencyPhone" name="EmergencyPhone" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.phone} required onInput={checkPhoneFormat}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
							<input type="text" id="EmergencyRelationship" name="EmergencyRelationship" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.relationship} required minLength={2} maxLength={50}></input>
						</div>
						<div className={styles.btnContainer} >
							{editUserInfo ?
								<div className={styles.confirmContainer}>
									<button type="button" onClick={() => {
										setEditUserInfo(false);
										setEditUserInfoErrors('');
									}}>Cancel</button>
									<button className={styles.confirmBtn} type="submit">Confirm</button>
								</div>
								: <button type="button" onClick={() => setEditUserInfo(true)}>Edit Personal Info</button>}
						</div>
						{editUserInfoErrors && editUserInfoErrors.length > 0 &&
							<ul className="errorText">Encountered the following errors:
								{editUserInfoErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
							</ul>}
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
						{changePswErrorMsg && <div className="errorText">{changePswErrorMsg}</div>}
					</form>
				</div>
			}
			<Modal open={pendingSubmit.show} type='loading' text={pendingSubmit.msg}></Modal>
			<Modal open={showNotificationModal.show} type='notification' text={showNotificationModal.msg} onClose={() => setShowNotificationModal('')}></Modal>

			<Modal open={showChangeGroupModal} type='select' text='Which group?'
				onClose={() => setShowChangeGroupModal(false)} onOK={handleUserGroupSubmit}
				okText={'Confirm'} closeText={'Cancel'} selection={groupChange} ></Modal>
		</>
	);
};

export default Profile;