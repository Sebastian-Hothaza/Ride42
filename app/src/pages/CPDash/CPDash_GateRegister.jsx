import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_GateRegister.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


const GateRegister = ({ APIServer, fetchAPIData, allUsers, allTrackdays }) => {

    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const [eligibleUsers, setEligibleUsers] = useState('');

    let nextTrackday = { date: 'ERROR: NO UPCOMING DATE' }

    // Load in the nextTrackday
    if (allTrackdays) {
        const lateAllowance = 12 * 60 * 60 * 1000; // Time in ms that a trackday will still be considered the next trackday AFTER it has already passed. Default is 12H

        // Remove trackdays in the past
        const upcomingTrackdays = allTrackdays.filter((trackday) => {
            return new Date(trackday.date).getTime() + lateAllowance >= Date.now() // Trackday is in future
        })
        if (upcomingTrackdays.length == 0) {
            return console.error('no more TD')// Protect against no trackdays
        }

        upcomingTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))

        // Formatting
        const date = new Date(upcomingTrackdays[0].date)
        const month = date.toLocaleString('default', { month: 'long' })
        const numericDay = date.toLocaleString('default', { day: 'numeric' })
        const formattedDate = month + ' ' + numericDay;

        nextTrackday = { date: formattedDate, id: upcomingTrackdays[0].id };
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
            if (!response.ok) {
                setActiveModal({ type: 'failure', msg: 'Failed to update waiver for user' })
            }
        } catch (err) {
            setActiveModal({ type: 'failure', msg: 'API Failure' })
            console.log(err.message)
        }
        handleRegistrationSubmit(userID) //TODO: some refinement here needed; do we want to block a gate reg if waiver update fails?
    }

    async function handleRegistrationSubmit(userID) {
        setActiveModal({ type: 'loading', msg: 'Submitting gate registration' });
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
            await fetchAPIData();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Gate Registration Complete' });
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
                        setActiveModal({ type: 'waiverWarning', userID: e.target.user.value });
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
            
            </div>
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

            <Modal open={activeModal.type === 'waiverWarning'}>
                <>
                    Waiver not on file! Please make sure to collect a waiver for this user!
                    <button className='actionButton' onClick={() => updateWaiver(activeModal.userID) }>Ok</button>
                </>
            </Modal>
        </>
    );
};

export default GateRegister;