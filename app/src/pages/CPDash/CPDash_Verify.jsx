import styles from './stylesheets/CPDash_Verify.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'
import ScrollToTop from "../../components/ScrollToTop";

import { useState } from "react";
import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import Scanner from '../../components/Scanner';
import checkmark from './../../assets/checkmark.png'

const CheckIn = ({ APIServer, allTrackdays }) => {
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

    async function handleVerify(scanData, scanner) {
        const [userID, bikeID] = scanData.replace("https://ride42.ca/dashboard/", "").split("/");

        setActiveModal({ type: 'loading', msg: 'Verifying user' }); // Show loading modal
        try {
            const response = await fetch(APIServer + 'verify/' + userID + '/' + nextTrackday.id + '/' + bikeID, {
                method: 'GET',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
            })
            setActiveModal(''); // Clear loading modal
            if (response.ok) {
                const data = await response.json();
                if (data.verified === 'true') {
                    setActiveModal({ type: 'verified', msg: 'OK' })
                    setTimeout(() => setActiveModal(''), 1500)
                } else {
                    setActiveModal({ type: 'verified', msg: 'BAD' })
                    setTimeout(() => setActiveModal(''), 1500)
                }
                setTimeout(() => scanner.start(), 2000) // Prompt scanner to start scanning again
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
                <h1>{nextTrackday.date} Verify</h1>
                <Scanner onDecodeEnd={handleVerify} />
            </div>

            <Loading open={activeModal.type==='loading'}>
                {activeModal.msg}
            </Loading>

            <Modal open={activeModal.type==='verified'} type='testing' >
                <div className={modalStyles.modalNotif}></div>
                <img id={modalStyles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
                {activeModal.msg}
            </Modal>


        </>
    );
};

export default CheckIn;