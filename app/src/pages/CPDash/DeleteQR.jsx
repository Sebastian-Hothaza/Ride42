import { useState, useEffect } from "react";
import ScrollToTop from "../../components/ScrollToTop";


import modalStyles from '../../components/stylesheets/Modal.module.css';
import checkmark from './../../assets/checkmark.png';
import errormark from './../../assets/error.png';
import Loading from '../../components/Loading';
import Modal from "../../components/Modal";


import styles from './stylesheets/DeleteQR.module.css'


const DeleteQR = ({ allUsers, APIServer, fetchAPIData, }) => {


    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const [curUser, setCurUser] = useState('')
    const [curQR, setCurQR] = useState('')
    const [hasQRID, setHasQRID] = useState(true);

    


    if (!allUsers) {
        return null;
    } else {
        allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
    }


    
    async function handleDeleteQR(e) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Deleting QR' }); // Show loading modal
        try {
            const response = await fetch(APIServer + 'QR/' + e.target.qrid.value, {
                method: 'DELETE',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
            })
            if (response.ok) {
				setActiveModal({ type: 'success', msg: 'QR Deleted' });
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

    // Returns the QRID of a bike if it exists, otherwise returns empty and notifies user that selected user/bike does not have a QRID
    function getQRID(garageItem){
        if (garageItem.QRID){
            setHasQRID(true);
            return garageItem.QRID;
        }else{
            setHasQRID(false);
            return '';
        }
       
    }
 

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Delete QR</h1>

                <form onSubmit={(e) => handleDeleteQR(e)}>

                    
                    <div className={styles.inputPairing}>
                        <label htmlFor="user">Select User:</label>
                        <select className='capitalizeEach' name="user" id="user" onChange={() => { setCurUser(allUsers.find((candidateUser) => candidateUser._id === user.value)) }}>
                            <option key="none" value=""></option>
                            {allUsers && allUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id} >{user.firstName}, {user.lastName}</option>)}
                        </select>
                    </div>

                    {curUser &&
                        <div className={styles.inputPairing}>
                            <label htmlFor="bike">Select Bike:</label>
                            <select className='capitalizeEach' name="bike" id="bike" onChange={() => { setCurQR(getQRID(curUser.garage.find((garageItem) => garageItem._id === bike.value))) }}>
                                <option key="none" value=""></option>
                                {curUser && curUser.garage.map((garageItem) => <option className='capitalizeEach' key={garageItem._id} value={garageItem._id}>{garageItem.bike.year} {garageItem.bike.make} {garageItem.bike.model}</option>)}
                            </select>
                        </div>
                    }

                    {!hasQRID && 
                        <div>USER NO HAS QRID</div>
                    }

                    <div>--- OR ---</div>

                    <div className={styles.inputPairing}>
                        <label htmlFor="qrid">QR id to delete:</label>
                        <input type="text" name="qrid" id="qrid" onChange={() => { setCurQR(qrid.value) }} value={curQR} required></input>
                        <button>Delete</button>
                    </div>
                    



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


        </>
    );
};

export default DeleteQR;