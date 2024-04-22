import styles from './stylesheets/CPDash_CheckIn.module.css'
import ScrollToTop from "../../components/ScrollToTop";

import { useState } from "react";
import Modal from "../../components/Modal";
import Scanner from '../../components/Scanner';


const CheckIn = ({ APIServer, allTrackdays }) => {
    const [pendingSubmit, setPendingSubmit] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState('');
    const [failModal, setFailModal] = useState('')
    let nextTrackday = { date: 'ERROR: NO UPCOMING DATE'}

    
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

    async function handleCheckIn(scanData, scanner) {
        const [userID, bikeID] = scanData.replace("https://ride42.ca/dashboard/", "").split("/");
        setPendingSubmit({ show: true, msg: 'Checking user in' });
        try {
            const response = await fetch(APIServer + 'checkin/' + userID + '/' + nextTrackday.id + '/' + bikeID, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
            })
            setPendingSubmit(''); // Clear loading screen
            if (response.ok) {
                setShowNotificationModal({ show: true, msg: 'Check-In complete' })
                setTimeout(() => scanner.start(), 2000) // Prompt scanner to start scanning again
            } else if (response.status === 403) {
                const data = await response.json();
                setFailModal({ show: true, msg: data.msg, scanner: scanner })
            } else {
                throw new Error('API Failure')
            }
        } catch (err) {
            console.log(err.message)
        }
    }

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>{nextTrackday.date} Check In</h1>
                <Scanner onDecodeEnd={handleCheckIn} />
            </div>
            <Modal open={pendingSubmit.show} type='loading' text={pendingSubmit.msg}></Modal>
            <Modal open={showNotificationModal.show} type='notification' text={showNotificationModal.msg} onClose={() => setShowNotificationModal('')}></Modal>
            <Modal open={failModal.show} type='confirmation' text={`Error: \n ${failModal.msg && failModal.msg.join('\n')}`} onClose={() =>{ setFailModal(''); failModal.scanner.start()}}
                okText="" closeText="Close" ></Modal>
        </>
    );
};

export default CheckIn;