import { useState, useRef } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';
import Scanner from '../../components/Scanner';

import styles from './stylesheets/CheckIn.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'


const CheckIn = ({ APIServer, allTrackdays, allUsers }) => {
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackdayId is 
    const selectedTrackdayRef = useRef(null); // Ref to keep track of the latest selectedTrackday
    const [resetTrigger, setResetTrigger] = useState(0); // Used to reset the scanner when a scan is successful


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

    // Set the ref
    if (selectedTrackdayId) { // Once we have defined trackday to use
        selectedTrackdayRef.current = allTrackdays.find((td) => td.id === selectedTrackdayId); // Update the ref with the latest selectedTrackday
    } else if (allTrackdays) {  // Load in the selectedTrackday to default value 
        const lateAllowance = 12 * 60 * 60 * 1000; // Time in ms that a trackday will still be considered the next trackday AFTER it has already passed. Default is 12H
        // Remove trackdays in the past
        const upcomingTrackdays = allTrackdays.filter((trackday) => {
            return new Date(trackday.date).getTime() + lateAllowance >= Date.now(); // Trackday is in the future
        });
        if (upcomingTrackdays.length === 0) return console.error('no more TD'); // Protect against no trackdays

        upcomingTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
        setSelectedTrackdayId(upcomingTrackdays[0].id); // This prompts render and sets ref
    }

    // NOTE: handleCheckIn is called by scanner

    async function handleCheckIn(scanData) {
        // Build API URL, depends on legacy or updated QR
        let APIURL; 
        if (scanData.includes('https://ride42.ca/dashboard/')) {
            const [userID, bikeID] = scanData.replace("https://ride42.ca/dashboard/", "").split("/");
            APIURL = APIServer + 'checkin/' + userID + '/' + selectedTrackdayRef.current.id + '/' + bikeID;
        } else {
            const QRID = scanData.replace("https://Ride42.ca/QR/", "")
            APIURL = APIServer + 'checkin/' + QRID + '/' + selectedTrackdayRef.current.id;
        }

        setActiveModal({ type: 'loading', msg: 'Checking user in' });
        try {
            const response = await fetch(APIURL, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
            })
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Check-In complete' });
                setTimeout(() => {
                    setActiveModal('');
                    setResetTrigger(t => !t); // Reset scanner for next scan
                }, 1500)
            } else {
                const data = await response.json();
                setActiveModal({ type: 'failure', msg: `${data.msg.join('\n')}`})
            }
        } catch (err) {
            setActiveModal({ type: 'failure', msg: 'API Failure' })
            console.log(err.message)
        }

    }

    return (
        <>
            <ScrollToTop />
            {selectedTrackdayRef.current &&
                <div className={styles.content}>
                    <h1>Check In -
                        <form>
                            <div className={styles.inputPairing}>
                                <select name="trackday" id="trackday" value={selectedTrackdayRef.current.id} onChange={() => setSelectedTrackdayId(trackday.value)} required>
                                    {allTrackdays.map((trackday) => <option key={trackday.id} value={trackday.id}>{trackday.prettyDate}</option>)}
                                </select>
                            </div>
                        </form>
                    </h1>
                    <Scanner onDecodeEnd={handleCheckIn} resetTrigger={resetTrigger}/>
                </div>
            }

            <Loading open={activeModal.type === 'loading'}>
                {activeModal.msg}
            </Loading>

            <Modal open={activeModal.type === 'success'}>
                <div className={modalStyles.modalNotif}></div>
                <img id={modalStyles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
                <div className="capitalizeEach">{activeModal.msg}</div>
            </Modal>

            <Modal open={activeModal.type === 'failure'}>
                <div className={modalStyles.modalNotif}></div>
                <img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
                <div className="capitalizeEach">{activeModal.msg}</div>
                <button className='actionButton' onClick={() => { setActiveModal(''); setResetTrigger(t => !t); }}>Close</button>
            </Modal>
        </>
    );
};

export default CheckIn;