import { useEffect, useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_Waiver.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

const Waiver = ({ APIServer, fetchAPIData, allUsers }) => {

    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const [eligibleUsers, setEligibleUsers] = useState(''); // TODO: move this out of a state variable?
  



    // Load in eligible users (Ie. remove those who already have waiver completed)
    useEffect(() => {
        if (allUsers) {
            allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
            setEligibleUsers(allUsers.filter((user) => user.waiver === false));
        }
    }, [allUsers])


    async function handleWaiverSubmit(userID) {
        setActiveModal({ type: 'loading', msg: 'Updating Waiver' });
        try {
            const response = await fetch(APIServer + 'waiver/' + userID, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            })
            await fetchAPIData();
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'Waiver updated' });
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
        setEligibleUsers(allUsers.filter((user) => input.value === user.contact.phone.slice(6, 6 + input.value.length) && user.waiver === false))
    }

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Waiver Submission</h1>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    setActiveModal({ type: 'confirmWaiver', userID: e.target.user.value });
                    e.target.reset();
                }}>

                    <label htmlFor="year">Search members by last 4 digits of phone number:</label>
                    <input type="number" id="phoneEnd" name="phoneEnd" onInput={filterEligibleUsers}></input>


                    <select className='capitalizeEach' name="user" id="user" required>
                        {eligibleUsers && eligibleUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
                        {eligibleUsers.length == 0 && <option key='empty' value=''>No entries found</option>}
                    </select>

                    <button className={styles.confirmBtn} type="submit">Update Waiver</button>
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


            <Modal open={activeModal.type === 'confirmWaiver'}>
                <>
                    Does the waiver contain: Name, Date, Initials, Signature?
                    <button className={`actionButton ${styles.confirmBtn}`} onClick={() => handleWaiverSubmit(activeModal.userID)}>Yes</button>
                    <button className='actionButton' onClick={() => setActiveModal('')}>No</button>
                </>
            </Modal>
        </>
    );
};

export default Waiver;