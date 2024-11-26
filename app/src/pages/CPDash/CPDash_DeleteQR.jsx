import { useState, useEffect } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Loading from '../../components/Loading';
import Scanner from '../../components/Scanner';

import styles from './stylesheets/CPDash_DeleteQR.module.css'


const DeleteQR = ({ allUsers, APIServer, fetchAPIData, }) => {


    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const [curUser, setCurUser] = useState('')
    const [curBike, setCurBike] = useState('')


    if (!allUsers) {
        return null;
    } else {
        allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
    }


    //router.put('/QR/:QRID/:userID/:bikeID', userController.marryQR)
    async function handleMarryQR(scanData, scanner) {
        const QRID = scanData.replace("https://Ride42.ca/QR/", "")
        setActiveModal({ type: 'loading', msg: 'Verifying user' }); // Show loading modal
        try {
            const response = await fetch(APIServer + 'QR/' + QRID + '/' + curUser._id + '/' + curBike._id, {
                method: 'PUT',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
            })
            if (response.ok) {
                const data = await response.json();
                if (data.verified === true) {
                    setActiveModal({ type: 'success', msg: 'good' })
                    setTimeout(() => setActiveModal(''), 1500)
                    // setTimeout(() => scanner.start(), 2000) // Prompt scanner to start scanning again
                } else {
                    setActiveModal({ type: 'failure', msg: 'FAIL', scanner: scanner })
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
                <h1>Delete QR</h1>

                {/* <form>

                    
                    <div className={styles.inputPairing}>
                        <label htmlFor="user">Select User:</label>
                        <select className='capitalizeEach' name="user" id="user" onChange={() => { setCurUser(allUsers.find((candidateUser) => candidateUser._id === user.value)) }} required>
                            <option key="none" value=""></option>
                            {allUsers && allUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id} >{user.firstName}, {user.lastName}</option>)}
                        </select>
                    </div>

                    {curUser &&
                        <div className={styles.inputPairing}>
                            <label htmlFor="bike">Select Bike:</label>
                            <select className='capitalizeEach' name="bike" id="bike" onChange={() => { setCurBike((curUser.garage.find((garageItem) => garageItem._id === bike.value)).bike) }} required>
                                <option key="none" value=""></option>
                                {curUser && curUser.garage.map((garageItem) => <option className='capitalizeEach' key={garageItem._id} value={garageItem._id}>{garageItem.bike.year} {garageItem.bike.make} {garageItem.bike.model}</option>)}
                            </select>
                        </div>
                    }

                    {curBike &&
                        <>
                            <div>Scan {curUser.group} sticker below:</div>
                            <Scanner onDecodeEnd={handleMarryQR} />
                        </>

                    }



                </form> */}


            </div>
        </>
    );
};

export default DeleteQR;