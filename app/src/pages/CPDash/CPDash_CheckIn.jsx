import styles from './stylesheets/CPDash_CheckIn.module.css'
import ScrollToTop from "../../components/ScrollToTop";

import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import QrScanner from 'qr-scanner'


const CheckIn = ({ APIServer, fetchAPIData, allTrackdays }) => {
    const [pendingSubmit, setPendingSubmit] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState('');

    const [nextTrackday, setNextTrackday] = useState(''); // Corresponds to next trackday object
    const [registerErrors, setRegisterErrors] = useState('');

    const [scanData, setScanData] = useState('');

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

    // Setting up QR scanner
    let scanner;
    const videoElem = document.getElementById('qrVideo');
    useEffect(() => {
        if (videoElem) {
            scanner = new QrScanner(
                videoElem,
                processScan,
                {
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                },
            );
            scanner.start();
            return () => scanner.destroy();
        }
        
    }, [videoElem])



    function processScan(scan) {
        scanner.stop();
        const QRData = scan.data.replace('https://ride42.ca/dashboard/', '').split('/');
        handleCheckIn(QRData[0], QRData[1]);
    }


    async function handleCheckIn(userID, bikeID, trackdayID) {

        // setPendingSubmit({ show: true, msg: 'Checking user in' });
        console.log('checking in userID:', userID, 'with bikeID', bikeID, 'for trackdayID', nextTrackday.id)
        return;
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







    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>{nextTrackday.date} Check In</h1>
                <video id="qrVideo"></video>

            </div>
            <Modal open={pendingSubmit.show} type='loading' text={pendingSubmit.msg}></Modal>
            <Modal open={showNotificationModal.show} type='notification' text={showNotificationModal.msg} onClose={() => setShowNotificationModal('')}></Modal>
        </>
    );
};

export default CheckIn;