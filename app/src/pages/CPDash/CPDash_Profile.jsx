import { useState } from "react";

import styles from './CPDash_Profile.module.css'

const Profile = ({ APIServer, userInfo, fetchAPIData }) => {

	const [editUserInfo, setEditUserInfo] = useState(false); // Tracks if we are editing fields
	const [editUserInfoErrors, setEditUserInfoErrors] = useState(); // Array corresponding to error messages received from API
	const [changePswErrorMsg, setChangePswErrorMsg] = useState(); // Array corresponding to error messages received from API
	const [editUserGroup, setEditUserGroup] = useState(false); // Tracks if we are changing groups


	async function handleEditUserInfoSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("group", userInfo.group);
		try {
			const response = await fetch(APIServer + 'users/' + userInfo._id, {
				method: 'PUT',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			if (response.ok) {
				setEditUserInfo(false)
				setEditUserInfoErrors('');
				// TODO: Do we need to fetchapidata here?
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
			console.log(err)
		}

	}

	function checkPswFormat() {
		let input = document.getElementById('newPassword');
		if ((/^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/).test(input.value) && input.value.length>=8 && input.value.length<=50) {
			input.setCustomValidity(''); // input is valid -- reset the error message
		} else {
			input.setCustomValidity('Password must contain minimum 8 characters and be a combination of letters and numbers');
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
		const formData = new FormData(e.target);
		try {
			const response = await fetch(APIServer + 'password/' + userInfo._id, {
				method: 'PUT',
				credentials: 'include',
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			if (response.ok){
				setChangePswErrorMsg('');
				e.target.reset();
			}else{
				const data = await response.json();
				setChangePswErrorMsg(data.msg)
				e.target.reset();
			}
		} catch (err) {
			console.log(err)
		}
	}

	async function handleUserGroupSubmit(e) {
		e.preventDefault();
		try {
			const response = await fetch(APIServer + 'users/' + userInfo._id, {
				method: 'PUT',
				credentials: 'include',
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
					group: e.target.group.value
				})
			})
			if (response.ok) {
				setEditUserGroup(false)
				fetchAPIData();
			} else if (response.status === 400) {
				const data = await response.json();
				console.log('Change group failed: ', data)
			} else {
				throw new Error('API Failure')
			}
		} catch (err) {
			console.log(err)
		}
	}



	return (
		<>
			{!userInfo ? <div>...</div> :
				<div className={styles.content}>
					<h1>My Profile</h1>
					<div className={styles.inputSection}>
						<div id={styles.groupContainer}>
							<div>Group: {userInfo.group[0].toUpperCase() + userInfo.group.slice(1)}</div>
							{editUserGroup ?
								<div >
									<form className={styles.confirmContainer} onSubmit={(e) => handleUserGroupSubmit(e)}>
										<select name="group" id="group" defaultValue={userInfo.group}>
											<option key="green" value="green">Green</option>
											<option key="yellow" value="yellow">Yellow</option>
											<option key="red" value="red">Red</option>
										</select>

										<button type="button" onClick={() => setEditUserGroup(false)}>Cancel</button>
										<button className={styles.confirmBtn} type="submit">Confirm</button>
									</form>

								</div>
								:
								<button onClick={() => setEditUserGroup(true)}>Change Group</button>}
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
							<input type="text" id="phone" name="phone" disabled={!editUserInfo} defaultValue={userInfo.contact.phone} required minLength={10} maxLength={10}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="address">Address:</label>
							<input type="text" id="address" name="address" disabled={!editUserInfo} defaultValue={userInfo.contact.address} minLength={2} maxLength={50}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="city">City:</label>
							<input type="text" id="city" name="city" disabled={!editUserInfo} defaultValue={userInfo.contact.city} minLength={2} maxLength={50}></input>
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
							<input type="text" id="EmergencyPhone" name="EmergencyPhone" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.phone} required minLength={10} maxLength={10}></input>
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
						{ changePswErrorMsg && <div className="errorText">{changePswErrorMsg}</div> }
					</form>
				</div>
			}
		</>
	);
};

export default Profile;