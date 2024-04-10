import { useState } from "react";

import styles from './CPDash_Profile.module.css'

const Profile = ({ APIServer, userInfo,fetchAPIData }) => {

	const [editUserInfo, setEditUserInfo] = useState(false);
	const [editUserInfoErrors, setEditUserInfoErrors] = useState();
	const [editUserGroup, setEditUserGroup] = useState(false);


	async function handleEditUserInfoSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("group", userInfo.group);
		const response = await fetch(APIServer + 'users/' + userInfo._id, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
			},
			body: JSON.stringify(Object.fromEntries(formData))
		})
		if (response.status === 201) {
			setEditUserInfo(false)
		} else if (response.status === 400) {
			const data = await response.json();
			setEditUserInfoErrors(data.msg)
		} else {
			setEditUserInfoErrors(['API Error'])
		}
	}

	async function handleChangePasswordSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const response = await fetch(APIServer + 'password/' + userInfo._id, {
			method: 'PUT',
			credentials: 'include',
			headers: {
				'Content-type': 'application/json; charset=UTF-8',
			},
			body: JSON.stringify(Object.fromEntries(formData))
		})
		console.log(response);
		const data = await response.json();
		console.log(data)
	}


	async function handleUserGroupSubmit(e) {
		e.preventDefault();
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
		if (response.status === 201) {
			setEditUserGroup(false)
		} else if (response.status === 400) {
			const data = await response.json();
			console.log(data)
		}
		fetchAPIData();
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
										<select name="group" id="group" form={styles.changeGroupForm} defaultValue={userInfo.group}>
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
							<input type="text" id="email" name="email" disabled={!editUserInfo} defaultValue={userInfo.contact.email}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="phone">Phone:</label>
							<input type="text" id="phone" name="phone" disabled={!editUserInfo} defaultValue={userInfo.contact.phone}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="address">Address:</label>
							<input type="text" id="address" name="address" disabled={!editUserInfo} defaultValue={userInfo.contact.address}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="city">City:</label>
							<input type="text" id="city" name="city" disabled={!editUserInfo} defaultValue={userInfo.contact.city}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="province">Province:</label>
							<input type="text" id="province" name="province" disabled={!editUserInfo} defaultValue={userInfo.contact.province}></input>
						</div>

						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyName_firstName">Emergency Contact - First Name:</label>
							<input type="text" id="EmergencyName_firstName" name="EmergencyName_firstName" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.firstName}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyName_lastName">Emergency Contact - Last Name:</label>
							<input type="text" id="EmergencyName_lastName" name="EmergencyName_lastName" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.lastName}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyPhone">Emergency Contact - Phone:</label>
							<input type="text" id="EmergencyPhone" name="EmergencyPhone" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.phone}></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
							<input type="text" id="EmergencyRelationship" name="EmergencyRelationship" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.relationship}></input>
						</div>
						<div className={styles.btnContainer} >
							{editUserInfo ?
								<div className={styles.confirmContainer}>
									<button type="button" onClick={() => { setEditUserInfo(false); setEditUserInfoErrors([]) }}>Cancel</button>
									<button className={styles.confirmBtn} type="submit">Confirm</button>
								</div>
								: <button type="button" onClick={() => setEditUserInfo(true)}>Edit Personal Info</button>}
						</div>
						{editUserInfoErrors && editUserInfoErrors.length > 0 &&
							<ul>Encountered the following errors:
								{editUserInfoErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
							</ul>}
					</form>

					<form className={styles.inputSection} onSubmit={(e) => handleChangePasswordSubmit(e)}>
						<div className={styles.inputPairing}>
							<label htmlFor="oldPassword">Old Password:</label>
							<input type="password" id="oldPassword" name="oldPassword"></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="newPassword">New Password:</label>
							<input type="password" id="newPassword" name="newPassword"></input>
						</div>
						<div className={styles.inputPairing}>
							<label htmlFor="newPasswordConfirm">Confirm New Password:</label>
							<input type="password" id="newPasswordConfirm" name="newPasswordConfirm"></input>
						</div>
						<div id={styles.changePswBtn} >
							<button className={styles.confirmBtn} type="submit">Change Password</button>
						</div>
					</form>
				</div>
			}
		</>
	);
};

export default Profile;