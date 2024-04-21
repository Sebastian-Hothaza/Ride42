import styles from './stylesheets/CPDash_CheckIn.module.css'
import ScrollToTop from "../../components/ScrollToTop";

import { useState } from "react";
import Modal from "../../components/Modal";
import Scanner from '../../components/Scanner';


const CheckIn = ({ APIServer, allTrackdays }) => {
    const [pendingSubmit, setPendingSubmit] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState('');

    const [failModal, setFailModal] = useState('')

    const [nextTrackday, setNextTrackday] = useState(''); // Corresponds to next trackday object
    const [scanData, setScanData] = useState('')
    const [refreshScanner, setRefreshScanner] = useState(false) // Scanner watches for changes to this which prompts it to start scanning again
    const [scannerActive, setScannerActive] = useState(true);

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



    if (scanData && !failModal){
        const QRData = scanData.replace('https://ride42.ca/dashboard/', '').split('/');
        setScanData('')
        setScannerActive(false);
        handleCheckIn(QRData[0], QRData[1]);
    }


    async function handleCheckIn(userID, bikeID) {
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
                setTimeout(() => setScannerActive(true), 2000) // Prompt scanner to start scanning again
            } else if (response.status === 403) {
                const data = await response.json();
                setFailModal({ show: true, msg: data.msg })
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
                <Scanner setScanData={setScanData} scannerActive={scannerActive}></Scanner>
            </div>
            <Modal open={pendingSubmit.show} type='loading' text={pendingSubmit.msg}></Modal>
            <Modal open={showNotificationModal.show} type='notification' text={showNotificationModal.msg} onClose={() => setShowNotificationModal('')}></Modal>
            <Modal open={failModal.show} type='confirmation' text={`Error: \n ${failModal.msg}`} onClose={() =>{ setScannerActive(true); setFailModal('')}}
                okText="" closeText="Close" ></Modal>
        </>
    );
};

export default CheckIn;