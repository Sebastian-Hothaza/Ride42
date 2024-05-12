import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';
import Scanner from '../../components/Scanner';

import styles from './stylesheets/CPDash_Verify.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

// TODO: Fix issue when scanning a user's bike and bike is no longer in users garage

const CheckIn = ({ APIServer, allTrackdays, allUsers }) => {
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
        const date = new Date(upcomingTrackdays[0].date)
        const month = date.toLocaleString('default', { month: 'long' })
        const numericDay = date.toLocaleString('default', { day: 'numeric' })
        const formattedDate = month + ' ' + numericDay;

        nextTrackday = { date: formattedDate, id: upcomingTrackdays[0].id };
    }

    async function handleVerify(scanData, scanner) {
        const [userID, bikeID] = scanData.replace("https://ride42.ca/dashboard/", "").split("/");
        const user = allUsers.find((user)=> user._id === userID)
        const bike = user.garage.find((garageItem)=>garageItem.bike._id===bikeID).bike
        
        setActiveModal({ type: 'loading', msg: 'Verifying user' }); // Show loading modal
        try {
            const response = await fetch(APIServer + 'verify/' + userID + '/' + nextTrackday.id + '/' + bikeID, {
                method: 'GET',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
            })
            if (response.ok) {
                const data = await response.json();
                if (data.verified === true) {
                    setActiveModal({ type: 'success', msg: `${user.firstName}, ${user.lastName}\nGroup: ${user.group}\n${bike.year} ${bike.make} ${bike.model}` })
                    setTimeout(() => setActiveModal(''), 1500)
                    setTimeout(() => scanner.start(), 2000) // Prompt scanner to start scanning again
                } else {
                    setActiveModal({ type: 'failure', msg: `${user.firstName}, ${user.lastName}\nGroup: ${user.group}\n${bike.year} ${bike.make} ${bike.model}`, scanner: scanner })
                }
                
            } else {
                const data = await response.json();
                setActiveModal({ type: 'failure', msg: data.msg.join('\n'), scanner: scanner })
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
                <h1>{nextTrackday.date} Verify</h1>
                <Scanner onDecodeEnd={handleVerify} />
            </div>

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
				<button className='actionButton' onClick={() => {setActiveModal(''); activeModal.scanner.start()}}>Close</button>
			</Modal>


        </>
    );
};

export default CheckIn;