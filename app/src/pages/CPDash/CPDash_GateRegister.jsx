import styles from './stylesheets/CPDash_GateRegister.module.css'
import ScrollToTop from "../../components/ScrollToTop";
import { useState } from "react";
import Modal from "../../components/Modal";


const GateRegister = ({ APIServer, fetchAPIData, allUsers, allTrackdays }) => {
    const [pendingSubmit, setPendingSubmit] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState('');
    const [eligibleUsers, setEligibleUsers] = useState('');
    const [waiverModal, setWaiverModal] = useState('')

    const [nextTrackday, setNextTrackday] = useState(''); // Corresponds to next trackday object
    const [registerErrors, setRegisterErrors] = useState('');



    // Load in the nextTrackday
    if (allTrackdays && !nextTrackday) {
        const lateAllowance = 12 * 60 * 60 * 1000; // Time in ms that a trackday will still be considered the next trackday AFTER it has already passed. Default is 12H

        // Remove trackdays in the past
        allTrackdays = allTrackdays.filter((trackday) => {
            return new Date(trackday.date).getTime() + lateAllowance >= Date.now() // Trackday is in future
        })
        if (allTrackdays.length == 0) {
            setNextTrackday({ date: 'ERROR' })
            return console.error('no more TD')// Protect against no trackdays
        }

        allTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))

        // Formatting
        const date = new Date(allTrackdays[0].date)
        const month = date.toLocaleString('default', { month: 'long' })
        const numericDay = date.toLocaleString('default', { day: 'numeric' })
        const formattedDate = month + ' ' + numericDay;

        setNextTrackday({ date: formattedDate, id: allTrackdays[0].id });
    }



    // Load in eligible users (sorted by first name). 
    if (allUsers && !eligibleUsers) {
        allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
        setEligibleUsers(allUsers);
    }

    // Marks user as having waiver complete when gate registering user without waiver
    async function updateWaiver(userID) {
        try {
            const response = await fetch(APIServer + 'waiver/' + userID, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            })
            if (!response.ok) throw new Error('API Failure')
        } catch (err) {
            console.log(err.message)
        }
    }

    async function handleRegistrationSubmit(userID) {
        setWaiverModal('');
        setPendingSubmit({ show: true, msg: 'Submitting gate registration' });
        try {
            const response = await fetch(APIServer + 'register/' + userID + '/' + nextTrackday.id, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                    paymentMethod: 'gate',
                    layoutVote: 'none',
                    guests: 1
                })
            })
            setPendingSubmit('');
            if (response.ok) {
                await fetchAPIData();
                setRegisterErrors('');
                setShowNotificationModal({ show: true, msg: 'Gate registration complete' })
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
            console.log(err.message)
        }
    }

    // Called by filter input everytime there is a change, filters by last 4 digits of phone number
    function filterEligibleUsers() {
        let input = document.getElementById('phoneEnd');
        setEligibleUsers(allUsers.filter((user) => input.value === user.contact.phone.slice(6, 6 + input.value.length)))
    }



    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Gate Registration for Existing Members ({nextTrackday.date})</h1>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    // If user has no waiver completed, show modal. Else proceed directly with gate reg
                    if (allUsers.find((user) => user._id === e.target.user.value && user.waiver === false)) {
                        setWaiverModal({ show: true, userID: e.target.user.value });
                    } else {
                        handleRegistrationSubmit(e.target.user.value)
                    }
                    e.target.reset();
                    setEligibleUsers(allUsers);
                }}>

                    <label htmlFor="year">Search members by last 4 digits of phone number:</label>
                    <input type="number" id="phoneEnd" name="phoneEnd" onInput={filterEligibleUsers}></input>


                    <select className='capitalizeEach' name="user" id="user" required>
                        {eligibleUsers && eligibleUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
                        {eligibleUsers.length == 0 && <option key='empty' value=''>No entries found</option>}
                    </select>

                    <button className={styles.confirmBtn} type="submit">Gate Register</button>
                </form>
                {registerErrors && registerErrors.length > 0 &&
                    <ul className="errorText">Encountered the following errors:
                        {registerErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
                    </ul>}
            </div>
            <Modal open={pendingSubmit.show} type='loading' text={pendingSubmit.msg}></Modal>
            <Modal open={showNotificationModal.show} type='notification' text={showNotificationModal.msg} onClose={() => setShowNotificationModal('')}></Modal>

            <Modal open={waiverModal.show} type='confirmation' text='Waiver not on file! Please make sure to submit a waiver for this user' onClose={() => { updateWaiver(waiverModal.userID); handleRegistrationSubmit(waiverModal.userID) }}
                okText="" closeText="Ok" ></Modal>
        </>
    );
};

export default GateRegister;