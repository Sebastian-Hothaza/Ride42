import { NavLink, useOutletContext } from "react-router-dom";
import { useState } from "react";
import ScrollToTop from "../components/ScrollToTop";

import Loading from '../components/Loading';
import Modal from '../components/Modal';

import styles from './stylesheets/Login.module.css'
import modalStyles from '../components/stylesheets/Modal.module.css'

import errormark from './../assets/error.png'

const Login = () => {
	const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const { handleLogin, loginErrorMsg } = useOutletContext();



    async function handleLoginSubmit(e) {
        e.preventDefault();
        setActiveModal({type: 'loading', msg: 'Logging you in...'});
        const error_message = await handleLogin(e);
        setActiveModal({type: 'failure', msg: error_message}); // Only executes if log in fails
    }

    return (
        <>
        <ScrollToTop/>
            <div className="content">
                <div className={styles.invertedContent}>
                    <div id={styles.registerCard} >
                        <div className="cardContent" id="loginCard">
                            <h1>Why Become a Member?</h1>
                            <div>
                                <ul id={styles.whyRegisterUl}>
                                    <li>Access to pre-register for trackdays</li>
                                    <li>Manage your booked trackdays</li>
                                    <li>Express check-in</li>
                                    <li>Vote for track layouts</li>
                                    <li>One time waiver</li>
                                </ul>
                                <div id={styles.registerBtnContainer}>
                                    <NavLink className={styles.registerBtn} to="/register">Join Now!</NavLink>
                                </div>

                            </div>
                        </div>
                    </div>
                    <div id={styles.loginCard}>
                        <h1>Member Log-In</h1>
                        <form onSubmit={(e) => handleLoginSubmit(e)} >
                            <input type="email" name="email" placeholder="email" required />
                            <input type="password" name="password" placeholder="password" required />
                            {loginErrorMsg && <div className="errorText">{loginErrorMsg}</div>}
                            <button id={styles.logInBtn} type="submit">Log In</button>
                            <button id={styles.scrollBtn} type="button" className="actionButton" onClick={() => document.getElementById('loginCard').scrollIntoView()}>Not yet a member?</button>
                        </form>
                    </div>

                </div>
            </div>
            
			<Loading open={activeModal.type === 'loading'}>
				{activeModal.msg}
			</Loading>

            <Modal open={activeModal.type === 'failure'}>
				<div className={modalStyles.modalNotif}></div>
				<img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
				{activeModal.msg}
				<button className='actionButton' onClick={() => setActiveModal('')}>Ok</button>
			</Modal>


        </>
    );
};

export default Login;