import styles from './stylesheets/CPDash_Waiver.module.css'
import ScrollToTop from "../../components/ScrollToTop";
import { useEffect, useState } from "react";
import Modal from "../../components/Modal";

const Waiver = ({ APIServer, fetchAPIData, allUsers }) => {

    const [pendingSubmit, setPendingSubmit] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState('');
    const [eligibleUsers, setEligibleUsers] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState('')



    // Load in eligible users (Ie. remove those who already have waiver completed)
    useEffect(() => {
        if (allUsers) {
            allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
            setEligibleUsers(allUsers.filter((user) => user.waiver === false));
        }
    }, [allUsers])

    // TOOD: Make handle errors more gracefully
    async function handleWaiverSubmit(userID) {
        setShowConfirmModal('');
        setPendingSubmit({ show: true, msg: 'Updating Waiver' });
        try {
            const response = await fetch(APIServer + 'waiver/' + userID, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            })
            if (response.ok) {
                await fetchAPIData();
                setPendingSubmit('');
                setShowNotificationModal({ show: true, msg: 'Waiver updated' })
            } else {
                throw new Error('API Failure')
            }
            setPendingSubmit('');
        } catch (err) {
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
                    e.target.reset();
                    setShowConfirmModal({ show: true, userID: e.target.user.value });
                }}>

                    <label htmlFor="year">Search members by last 4 digits of phone number:</label>
                    <input type="number" id="phoneEnd" name="phoneEnd" onInput={filterEligibleUsers}></input>


                    <select className='capitalizeEach' name="user" id="user" required>
                        {eligibleUsers && eligibleUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
                        {eligibleUsers.length==0 && <option key='empty' value=''>No entries found</option>}
                    </select>

                    <button className={styles.confirmBtn} type="submit">Update Waiver</button>
                </form>
            </div>
            <Modal open={pendingSubmit.show} type='loading' text={pendingSubmit.msg}></Modal>
            <Modal open={showNotificationModal.show} type='notification' text={showNotificationModal.msg} onClose={() => setShowNotificationModal('')}></Modal>
            <Modal open={showConfirmModal.show} type='confirmation' text='Does the waiver contain: Name, Date, Initials, Signature?' onClose={() => setShowConfirmModal('')}
                onOK={() => handleWaiverSubmit(showConfirmModal.userID)} okText="Yes" closeText="No" ></Modal>
        </>
    );
};

export default Waiver;