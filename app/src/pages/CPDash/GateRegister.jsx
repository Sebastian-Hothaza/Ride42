import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/GateRegister.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


const GateRegister = ({ APIServer, fetchAPIData, allUsers, allTrackdays }) => {

    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const [eligibleUsers, setEligibleUsers] = useState('');
    const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackdayId is 

    // Augment prettydate of allTrackdays to be a nice format
    allTrackdays.forEach((trackday) => {
        const date = new Date(trackday.date)
        const weekday = date.toLocaleString('default', { weekday: 'short' })
        const month = date.toLocaleString('default', { month: 'long' })
        const numericDay = date.toLocaleString('default', { day: 'numeric' })
        const formattedDate = weekday + ' ' + month + ' ' + numericDay;
        trackday.prettyDate = formattedDate;
    })

    // Removed archived trackdays
    allTrackdays = allTrackdays.filter((td) => td.status != 'archived')

    // Set the selected trackday 
    let selectedTrackday;
    if (selectedTrackdayId) selectedTrackday = allTrackdays.find((td) => td.id === selectedTrackdayId)

    // Load in the selectedTrackday to default value
    if (allTrackdays && !selectedTrackdayId) {
        const lateAllowance = 12 * 60 * 60 * 1000; // Time in ms that a trackday will still be considered the next trackday AFTER it has already passed. Default is 12H

        // Remove trackdays in the past
        const upcomingTrackdays = allTrackdays.filter((trackday) => {
            return new Date(trackday.date).getTime() + lateAllowance >= Date.now() // Trackday is in future
        })
        if (upcomingTrackdays.length == 0) return console.error('no more TD')// Protect against no trackdays

        upcomingTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
        setSelectedTrackdayId(upcomingTrackdays[0].id);
    }


    // Load in eligible users (sorted by first name). 
    if (allUsers && !eligibleUsers) {
        allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
        setEligibleUsers(allUsers);
    }

    async function handleRegistrationSubmit(userID) {
        setActiveModal({ type: 'loading', msg: 'Submitting gate registration' });
        try {
            const response = await fetch(APIServer + 'register/' + userID + '/' + selectedTrackday.id, {
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

    async function handleWalkOnSubmit(e) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Submitting walk-on registration' });
        const formData = new FormData(e.target);
        try {
            const response = await fetch(APIServer + 'walkons/' + selectedTrackday.id, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            await fetchAPIData();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Walk-On Registration Complete' });
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

    // Called by filter input everytime there is a change, filters by last 4 digits of phone number
    function filterEligibleUsers() {
        let input = document.getElementById('phoneEnd');
        setEligibleUsers(allUsers.filter((user) => input.value === user.contact.phone.slice(6, 6 + input.value.length)))
    }

    return (
        <>
            <ScrollToTop />
            {selectedTrackday &&
                <>
                    <div className={styles.content}>
                        <h1>Gate Register -
                            <form>
                                <div className={styles.inputPairing}>
                                    <select name="trackday" id="trackday" value={selectedTrackday.id} onChange={() => setSelectedTrackdayId(trackday.value)} required>
                                        {allTrackdays.map((trackday) => <option key={trackday.id} value={trackday.id}>{trackday.prettyDate}</option>)}
                                    </select>
                                </div>
                            </form>
                        </h1>

                        <div>
                            <h3>Existing Members</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();

                                handleRegistrationSubmit(e.target.user.value)

                                e.target.reset();
                                setEligibleUsers(allUsers);
                            }}>

                                <label htmlFor="year">Search members by last 4 digits of phone number:</label>
                                <input type="number" id="phoneEnd" name="phoneEnd" onInput={filterEligibleUsers}></input>


                                <select className='capitalizeEach' name="user" id="user" required>
                                    {eligibleUsers && eligibleUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
                                    {eligibleUsers.length == 0 && <option key='empty' value=''>No entries found</option>}
                                </select>

                                <button className='confirmBtn' type="submit">Gate Register</button>
                            </form>
                        </div>

                        <div>
                            <h3>Walk-Ons</h3>
                            <form onSubmit={(e) => handleWalkOnSubmit(e)}>
                                <div className={styles.inputPairing}>
                                    <label htmlFor="firstName">First Name:</label>
                                    <input type="text" autoComplete='off' id="firstName" name="firstName" required minLength={2} maxLength={50}></input>
                                </div>

                                <div className={styles.inputPairing}>
                                    <label htmlFor="lastName">Last Name:</label>
                                    <input type="text" autoComplete='off' id="lastName" name="lastName" required minLength={2} maxLength={50}></input>
                                </div>

                                <div className={styles.inputPairing}>
                                    <label htmlFor="group">Group:</label>
                                    <select name="group" id="group" form={styles.registerForm} required>
                                        <option key="groupNone" value="">---Choose Group---</option>
                                        <option key="green" value="green">Green</option>
                                        <option key="yellow" value="yellow">Yellow</option>
                                        <option key="red" value="red">Red</option>
                                    </select>
                                </div>
                                <button className='confirmBtn' type="submit">Register Walk-On</button>
                            </form>
                        </div>


                    </div>




                </>
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
        </>
    );
};

export default GateRegister;