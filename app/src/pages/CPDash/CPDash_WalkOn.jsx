import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_WalkOn.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'



const WalkOn = ({ APIServer, fetchAPIData, allTrackdays }) => {

    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

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
        const date = new Date(allTrackdays[0].date)
        const month = date.toLocaleString('default', { month: 'long' })
        const numericDay = date.toLocaleString('default', { day: 'numeric' })
        const formattedDate = month + ' ' + numericDay;

        nextTrackday = { date: formattedDate, id: upcomingTrackdays[0].id };
    }

    async function handleRegistrationSubmit(e) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Submitting walk-on registration' });
        const formData = new FormData(e.target);
        try {
            const response = await fetch(APIServer + 'walkons/' + nextTrackday.id, {
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
    }

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Walk-Ons Registration ({nextTrackday.date})</h1>
                <form onSubmit={(e) => handleRegistrationSubmit(e)}>
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
                            <option key="green" value="green">Green</option>
                            <option key="yellow" value="yellow">Yellow</option>
                            <option key="red" value="red">Red</option>
                        </select>
                    </div>
                    <button className={styles.confirmBtn} type="submit">Register Walk-On</button>
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
        </>
    );
};

export default WalkOn;