import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/ManageUsers.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


const ManageUsers = ({ APIServer, fetchAPIData, allUsers }) => {

    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const [lockedUserInfo, setLockedUserInfo] = useState(true); // Tracks if we are editing fields

    const [user, setUser] = useState(''); // Tracks current user we are managing


    async function handleUserInfoSubmit(e) {
		e.preventDefault();
		e.target.phone.value = e.target.phone.value.replace(/[^0-9]/g, '');
		e.target.EmergencyPhone.value = e.target.EmergencyPhone.value.replace(/[^0-9]/g, '');
		setActiveModal({ type: 'loading', msg: 'Updating users profile' });
		const formData = new FormData(e.target);
		try {
			const response = await fetch(APIServer + 'users/' + user._id, {
				method: 'PUT',
				credentials: "include",
				headers: {
					'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify(Object.fromEntries(formData))
			})
			await fetchAPIData();
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

    async function handlePasswordSubmit(e) {
		e.preventDefault();
		setActiveModal({ type: 'loading', msg: 'Updating user password' });
		const formData = new FormData(e.target);
        formData.append("oldPassword", 'xxxx1111'); // Old password not required when admin submits password change request
		try {
			const response = await fetch(APIServer + 'password/' + user._id, {
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
        e.target.reset();
	}

    async function handleDeleteUser(userID){
		setActiveModal({ type: 'loading', msg: 'Deleting user' });
		try {
			const response = await fetch(APIServer + 'users/' + userID, {
				method: 'DELETE',
				credentials: "include",
			})
			await fetchAPIData();
			if (response.ok) {
				setActiveModal({ type: 'success', msg: 'User deleted' });
				setTimeout(() => setActiveModal(''), 1500)
			} else {
				const data = await response.json();
				setActiveModal({ type: 'failure', msg: data.msg })
			}
		} catch (err) {
			setActiveModal({ type: 'failure', msg: 'API Failure' })
			console.log(err.message)
		}
	}

    if (!allUsers) {
        return null;
    } else {
        allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
    }
    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Manage User-
                    <form>
                        <select className='capitalizeEach' name="result" id="result" onChange={() => setUser(allUsers.find((user) => user._id === result.value))}>
                            <option style={{ textAlign: 'center' }} key="none" value="">-------Select-------</option>
                            {allUsers.map((user) => <option key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
                        </select>
                    </form>
                </h1>



                {user && <>
                    <form className={styles.inputSection} onSubmit={(e) => handleUserInfoSubmit(e)} >
                        <div className={styles.inputPairing}>
                            <label htmlFor="firstName">First Name:</label>
                            <input className='capitalizeEach' type="text" id="firstName" name="firstName" disabled={lockedUserInfo} value={user.firstName} onChange={(e) => setUser({ ...user, firstName: e.target.value })} required></input>
                        </div>
                        <div className={styles.inputPairing}>
                            <label htmlFor="lastName">Last Name:</label>
                            <input className='capitalizeEach' type="text" id="lastName" name="lastName" disabled={lockedUserInfo} value={user.lastName} onChange={(e) => setUser({ ...user, lastName: e.target.value })}required></input>
                        </div>
                        <div className={styles.inputPairing}>
                            <label htmlFor="email">Email:</label>
                            <input type="email" id="email" name="email" disabled={lockedUserInfo} value={user.contact.email} onChange={(e) => setUser({ ...user, contact: { ...user.contact, email: e.target.value } })} required></input>
                        </div>
                        <div className={styles.inputPairing}>
                            <label htmlFor="phone">Phone:</label>
                            <input type="tel" id="phone" name="phone" disabled={lockedUserInfo} value={user.contact.phone} onChange={(e) => setUser({ ...user, contact: { ...user.contact, phone: e.target.value } })} required ></input>
                        </div>

                        <div className={styles.inputPairing}>
                            <label htmlFor="address">Address:</label>
                            <input className='capitalizeEach' type="text" id="address" name="address" disabled={lockedUserInfo} value={user.contact.address} onChange={(e) => setUser({ ...user, contact: { ...user.contact, address: e.target.value } })} required minLength={2} maxLength={50}></input>
                        </div>

                        <div className={styles.inputPairing}>
                            <label htmlFor="city">City:</label>
                            <input className='capitalizeEach' type="text" id="city" name="city" disabled={lockedUserInfo} value={user.contact.city} onChange={(e) => setUser({ ...user, contact: { ...user.contact, city: e.target.value } })}required minLength={2} maxLength={50}></input>
                        </div>

                        <div className={styles.inputPairing}>
                            <label htmlFor="province">Province:</label>
                            <select name="province" id="province" disabled={lockedUserInfo} value={user.contact.province} onChange={(e) => setUser({ ...user, contact: { ...user.contact, province: e.target.value } })}required>
                                <option key="ontario" value="ontario">Ontario</option>
                                <option key="quebec" value="quebec">Quebec</option>
                                <option key="other" value="other">Other</option>
                            </select>
                        </div>

                        <div className={styles.inputPairing}>
                            <label htmlFor="EmergencyName_firstName">Emergency Contact - First Name:</label>
                            <input className='capitalizeEach' type="text" id="EmergencyName_firstName" name="EmergencyName_firstName" disabled={lockedUserInfo} value={user.emergencyContact.firstName} onChange={(e) => setUser({ ...user, emergencyContact: { ...user.emergencyContact, firstName: e.target.value } })} required minLength={2} maxLength={50}></input>
                        </div>
                        <div className={styles.inputPairing}>
                            <label htmlFor="EmergencyName_lastName">Emergency Contact - Last Name:</label>
                            <input className='capitalizeEach' type="text" id="EmergencyName_lastName" name="EmergencyName_lastName" disabled={lockedUserInfo} value={user.emergencyContact.lastName} onChange={(e) => setUser({ ...user, emergencyContact: { ...user.emergencyContact, lastName: e.target.value } })} required minLength={2} maxLength={50}></input>
                        </div>
                        <div className={styles.inputPairing}>
                            <label htmlFor="EmergencyPhone">Emergency Contact - Phone:</label>
                            <input type="tel" id="EmergencyPhone" name="EmergencyPhone" disabled={lockedUserInfo} value={user.emergencyContact.phone} onChange={(e) => setUser({ ...user, emergencyContact: { ...user.emergencyContact, phone: e.target.value } })} required></input>
                        </div>
                        <div className={styles.inputPairing}>
                            <label htmlFor="EmergencyRelationship">Emergency Contact - Relationship:</label>
                            <input className='capitalizeEach' type="text" id="EmergencyRelationship" name="EmergencyRelationship" disabled={lockedUserInfo} value={user.emergencyContact.relationship} onChange={(e) => setUser({ ...user, emergencyContact: { ...user.emergencyContact, relationship: e.target.value } })} required minLength={2} maxLength={50}></input>
                        </div>
                        <div className={styles.inputPairing}>
                            <label htmlFor="waiver">Waiver:</label>
                            <select name="waiver" id="waiver" disabled={lockedUserInfo} value={user.waiver} onChange={(e) => setUser({ ...user, waiver: e.target.value })} required>
                                <option key="true" value={true}>True</option>
                                <option key="false" value={false}>False</option>
                            </select>
                        </div>
                        <div className={styles.inputPairing}>
                            <label htmlFor="memberType">Member Type:</label>
                            <select name="memberType" id="memberType" disabled={lockedUserInfo} value={user.memberType} onChange={(e) => setUser({ ...user, memberType: e.target.value })} required>
                                <option key="regular" value="regular">Regular</option>
                                <option key="coach" value="coach">Coach</option>
                                <option key="staff" value="staff">Staff</option>
                                <option key="admin" value="admin">Admin</option>
                            </select>
                        </div>

                        <div className={styles.inputPairing}>
                            <label htmlFor="group">Group:</label>
                            <select name="group" id="group" disabled={lockedUserInfo} value={user.group} onChange={(e) => setUser({ ...user, group: e.target.value })} required>
                                <option key="green" value="green">Green</option>
                                <option key="yellow" value="yellow">Yellow</option>
                                <option key="red" value="red">Red</option>
                            </select>
                        </div>

                        <div className={styles.inputPairing}>
                            <label htmlFor="phone">Credits:</label>
                            <input type="number" id="credits" name="credits" disabled={lockedUserInfo} value={user.credits} min={0} onChange={(e) => setUser({ ...user, credits: e.target.value })} required ></input>
                        </div>



                        <div className={styles.btnContainer} >
                            {!lockedUserInfo ?
                                <div className={styles.confirmContainer}>
                                    <button type="button" onClick={() => setLockedUserInfo(true)}>Cancel</button>
                                    <button className='confirmBtn' type="submit">Confirm</button>
                                </div>
                                : <button type="button" onClick={() => setLockedUserInfo(false)}>Edit User Info</button>}
                        </div>
                    </form>

                    <form className={styles.inputSection} onSubmit={(e) => handlePasswordSubmit(e)}>

                        <div className={styles.inputPairing}>
                            <label htmlFor="password">Set Password:</label>
                            <input type="password" id="newPassword" name="newPassword" required ></input>
                        </div>

                        <div id={styles.changePswBtn} >
                            <button className='confirmBtn' type="submit">Set New Password</button>
                        </div>
                    </form>

                    <button style={{ margin: 'auto', backgroundColor: 'red' }} onClick={() => setActiveModal({ type: 'deleteUser', user: user })}>Delete User</button>

                </>}

            </div>

			<Modal open={activeModal.type === 'deleteUser'}>
				<>
					Are you sure you want to delete this user?
					<button className={`actionButton confirmBtn`} onClick={() => handleDeleteUser(activeModal.user._id)}>Delete</button>
					<button className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
				</>
			</Modal>

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




        </>
    );
};

export default ManageUsers;