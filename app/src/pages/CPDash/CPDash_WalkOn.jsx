import styles from './stylesheets/CPDash_WalkOn.module.css'
import ScrollToTop from "../../components/ScrollToTop";

import { useState } from "react";
import Modal from "../../components/Modal";

const WalkOn = ({ APIServer, fetchAPIData, allTrackdays }) => {
    const [pendingSubmit, setPendingSubmit] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState('');

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

    async function handleRegistrationSubmit(e) {
        e.preventDefault();
        setPendingSubmit({ show: true, msg: 'Submitting walk-on registration' });
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
            setPendingSubmit('');
            if (response.ok) {
                await fetchAPIData();
                setRegisterErrors('');
                setShowNotificationModal({ show: true, msg: 'Walk-on registration complete' })
            } else {
                throw new Error('API Failure')
            }
        } catch (err) {
            console.log(err.message)
        }
        e.target.reset();
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
                {registerErrors && registerErrors.length > 0 &&
                    <ul className="errorText">Encountered the following errors:
                        {registerErrors.map((errorItem) => <li key={errorItem}>{errorItem}</li>)}
                    </ul>}
            </div>
            <Modal open={pendingSubmit.show} type='loading' text={pendingSubmit.msg}></Modal>
            <Modal open={showNotificationModal.show} type='notification' text={showNotificationModal.msg} onClose={() => setShowNotificationModal('')}></Modal>
        </>
    );
};

export default WalkOn;