import { useEffect, useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import Modal from "../../components/Modal";
import Loading from '../../components/Loading';

import styles from './stylesheets/CPDash_GenerateQR.module.css'
import modalStyles from '../../components/stylesheets/Modal.module.css'

import checkmark from './../../assets/checkmark.png'
import errormark from './../../assets/error.png'

const GenerateQR = ({ APIServer }) => {

    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    
    async function handleGenerateQRSubmit(e) {
        e.preventDefault();
        const totalQR = Number(e.target.greenQR.value) + Number(e.target.yellowQR.value) + Number(e.target.redQR.value)

        
        
        setActiveModal({ type: 'loading', msg: 'Generating QR Codes' });
        try {
            const response = await fetch(APIServer + 'QR', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({qty: totalQR})
            })
            
            if (response.ok) {
                const data = await response.json(); // Data is an array of objects where each object has form {id: "67436fe8bf5e6f497683cf3a"}
                
                setActiveModal({ type: 'success', msg: 'QR Codes Generated' });
                setTimeout(() => setActiveModal(''), 1500)
                console.log(data);
            } else {
                const data = await response.json();
                setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
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
                <h1>Generate QR Codes</h1>
                <form onSubmit={(e) =>  handleGenerateQRSubmit(e) }>
               
                

                    <label htmlFor="greenQR">Green QR Codes:</label>
                    <input type="number" id="greenQR" name="greenQR" ></input>

                    <label htmlFor="yellowQR">Yellow QR Codes:</label>
                    <input type="number" id="yellowQR" name="yellowQR" ></input>

                    <label htmlFor="redQR">Red QR Codes:</label>
                    <input type="number" id="redQR" name="redQR" ></input>


           

                    <button className={styles.confirmBtn} type="submit">Generate QRs</button>
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

export default GenerateQR;