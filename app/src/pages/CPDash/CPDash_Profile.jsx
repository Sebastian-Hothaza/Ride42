import { useEffect, useState } from "react";

const Profile = ({ loggedInUser, APIServer }) => {


	const [userInfo, setUserInfo] = useState('');
	const [editUserInfo, setEditUserInfo] = useState(false);
	const [editUserInfoErrors, setEditUserInfoErrors] = useState();
	const [editUserGroup, setEditUserGroup] = useState(false);

	async function fetchAPIData() {
		try {
			const response = await fetch(APIServer + 'users/' + loggedInUser.id, {
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to get API Data")
			const data = await response.json();
			setUserInfo(data);
		} catch (err) {
			console.log(err.message)
		}

	}

	async function handleEditUserInfoSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("group", userInfo.group);
		const response = await fetch(APIServer + 'users/' + loggedInUser.id, {
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
		const response = await fetch(APIServer + 'password/' + loggedInUser.id, {
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
		const response = await fetch(APIServer + 'users/' + loggedInUser.id, {
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

	useEffect(() => {
		fetchAPIData();
	}, [])

	return (
		<>
			{!userInfo ? <div>...</div> :
				<>
					<div id="CPDash_Profile_heading">
						<div>
							<div>Group: {userInfo.group[0].toUpperCase() + userInfo.group.slice(1)}</div>
							{editUserGroup ? <div>
								<form id="CPDash_Profile_changeGroup" onSubmit={(e) => handleUserGroupSubmit(e)}>
									<select name="group" id="group" form="CPDash_Profile_changeGroup" defaultValue={userInfo.group}>
										<option key="green" value="green">Green</option>
										<option key="yellow" value="yellow">Yellow</option>
										<option key="red" value="red">Red</option>
									</select>
									<button type="submit">Confirm</button>
								</form>

								<button onClick={() => setEditUserGroup(false)}>Cancel</button>
							</div>
								: <button onClick={() => setEditUserGroup(true)}>Change Group</button>}
						</div>

						<div>Days on Credit: {userInfo.credits}</div>
					</div>

					<form id="CPDash_Profile_personalDetails" onSubmit={(e) => handleEditUserInfoSubmit(e)} >
						<label htmlFor="email">Email:</label>
						<input type="text" id="email" name="email" disabled={!editUserInfo} defaultValue={userInfo.contact.email}></input>
						<label htmlFor="phone">Phone:</label>
						<input type="text" id="phone" name="phone" disabled={!editUserInfo} defaultValue={userInfo.contact.phone}></input>
						<label htmlFor="address">Address:</label>
						<input type="text" id="address" name="address" disabled={!editUserInfo} defaultValue={userInfo.contact.address}></input>
						<label htmlFor="city">City:</label>
						<input type="text" id="city" name="city" disabled={!editUserInfo} defaultValue={userInfo.contact.city}></input>
						<label htmlFor="province">Province:</label>
						<input type="text" id="province" name="province" disabled={!editUserInfo} defaultValue={userInfo.contact.province}></input>

						<label htmlFor="EmergencyName_firstName">Emergency Contact - First Name:</label>
						<input type="text" id="EmergencyName_firstName" name="EmergencyName_firstName" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.firstName}></input>
						<label htmlFor="EmergencyName_lastName">Emergency Contact - Last Name:</label>
						<input type="text" id="EmergencyName_lastName" name="EmergencyName_lastName" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.lastName}></input>
						<label htmlFor="EmergencyPhone">Emergency Contact - Phone:</label>
						<input type="text" id="EmergencyPhone" name="EmergencyPhone" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.phone}></input>
						<label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
						<input type="text" id="EmergencyRelationship" name="EmergencyRelationship" disabled={!editUserInfo} defaultValue={userInfo.emergencyContact.relationship}></input>

						{editUserInfo ?
							<><button type="button" onClick={() => { setEditUserInfo(false); setEditUserInfoErrors([]) }}>Cancel</button>
								<button type="submit">Submit</button></>
							: <button type="button" onClick={() => setEditUserInfo(true)}>Edit Personal Info</button>}

						{editUserInfoErrors && editUserInfoErrors.length > 0 &&
							<ul>Encountered the following errors:
								{editUserInfoErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
							</ul>}
					</form>


					<form id="CPDash_Profile_changePassword" onSubmit={(e) => handleChangePasswordSubmit(e)}>
						<label htmlFor="oldPassword">Old Password:</label>
						<input type="password" id="oldPassword" name="oldPassword"></input>
						<label htmlFor="newPassword">New Password:</label>
						<input type="password" id="newPassword" name="newPassword"></input>
						<label htmlFor="newPasswordConfirm">Confirm New Password:</label>
						<input type="password" id="newPasswordConfirm" name="newPasswordConfirm"></input>
						<button type="submit">Change Password</button>
					</form>





				</>
			}
		</>
	);
};

export default Profile;