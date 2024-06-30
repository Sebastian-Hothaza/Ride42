import Card from "../components/Card"
import styles from './stylesheets/PasswordReset.module.css'
import { useParams, useOutletContext, NavLink } from "react-router-dom";
import { useState } from "react";

import Loading from '../components/Loading';
import Modal from '../components/Modal';


import modalStyles from '../components/stylesheets/Modal.module.css'

import errormark from './../assets/error.png'

const PasswordReset = () => {
    const { APIServer } = useOutletContext();
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const params = useParams();



    function checkPswFormat() {
        let input = document.getElementById('password');
        if ((/^(?=.*[0-9])(?=.*[a-z])(?!.* ).{8,50}$/).test(input.value) && input.value.length >= 8 && input.value.length <= 50) {
            input.setCustomValidity(''); // input is valid -- reset the error message
        } else {
            input.setCustomValidity('Password must contain minimum 8 characters and be a combination of letters and numbers');
        }
    }

    function checkPswMatches() {
        let input = document.getElementById('passwordConfirm');
        if (input.value == document.getElementById('password').value) {
            input.setCustomValidity(''); // input is valid -- reset the error message
        } else {
            input.setCustomValidity('Password must match');
        }
    }

    async function handlePasswordReset(e) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Updating your password...' });
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch(APIServer + `resetpassword/${params.userID}/${params.token}`, {
                method: 'PUT',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            if (response.ok) {
                setActiveModal({ type: 'pswResetConfirm' })
            } else {
                setActiveModal({ type: 'failure', msg: 'Failed to reset password - JWT failed to verify (possibly due to expired link). Please try resetting password again' })
            }
        } catch (err) {
            setActiveModal({ type: 'failure', msg: 'API Failure' })
            console.log(err.message)
        }

    }

    const HTML_ResetPassword = <div className={styles.rulesCard}>
        <h3>Enter your new password below. Password must contain minimum 8 characters and be a combination of letters and numbers</h3>
        <br></br><br></br>

        <form onSubmit={(e) => handlePasswordReset(e)} >
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" required onInput={checkPswFormat} ></input>

            <label htmlFor="passwordConfirm">Confirm Password:</label>
            <input type="password" id="passwordConfirm" name="passwordConfirm" required onInput={checkPswMatches}></input>

            <button type="submit" className='actionButton'>Reset Password</button>
        </form>
    </div>

    return (
        <div className="content">

            <Card heading='Password Reset' body={HTML_ResetPassword} />
            <Modal open={activeModal.type === 'pswResetConfirm'}>
                <div>Password updated - you can now log in with your new password.</div>
                <NavLink className='actionButton' to="/dashboard">Take me to login page</NavLink>
            </Modal>

            <Modal open={activeModal.type === 'failure'}>
                <div className={modalStyles.modalNotif}></div>
                <img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
                {activeModal.msg}
                <NavLink className='actionButton' to="/dashboard">Ok</NavLink>
            </Modal>

            <Loading open={activeModal.type === 'loading'}>
                {activeModal.msg}
            </Loading>
        </div>
    );
};

export default PasswordReset;