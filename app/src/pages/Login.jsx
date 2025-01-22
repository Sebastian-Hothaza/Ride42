import { NavLink, useOutletContext } from "react-router-dom";
import { useState } from "react";
import ScrollToTop from "../components/ScrollToTop";

import Loading from '../components/Loading';
import Modal from '../components/Modal';

import styles from './stylesheets/Login.module.css'
import modalStyles from '../components/stylesheets/Modal.module.css'

import errormark from './../assets/error.png'

const Login = ({ APIServer }) => {
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const { handleLogin, loginErrorMsg } = useOutletContext();



    async function handleLoginSubmit(e) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Logging you in...' });
        const error_message = await handleLogin(e);
        setActiveModal({ type: 'failure', msg: error_message }); // Only executes if log in fails
    }

    async function handlePasswordResetRequest(e) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Generating your link...' });
        const formData = new FormData(e.target);
        try {
            const response = await fetch(APIServer + 'resetpassword', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            if (response.ok) {
                setActiveModal({ type: 'pswResetConfirm' })
            } else {
                const data = await response.json();
                setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
            }
        } catch (err) {
            setActiveModal({ type: 'failure', msg: 'API Failure' })
            console.log(err.message)
        }

    }



    function getToolbarHeight() {
        const root = document.documentElement;
        const toolBarHeight = getComputedStyle(root).getPropertyValue('--toolbar-thickness');
        const rootFontSize = parseFloat(getComputedStyle(root).fontSize); // Get root font size in pixels
        const toolBarHeightInPixels = parseFloat(toolBarHeight) * rootFontSize; // Convert rem to pixels
        return toolBarHeightInPixels;
    };

    console.log('toolBarHeightInPixels:', getToolbarHeight())

    return (
        <>
            <ScrollToTop />
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
                            <a style={{ color: 'blue', cursor: "pointer", alignSelf: 'flex-start' }} onClick={() => setActiveModal({ type: 'pswReset' })}>Forgot Password</a>
                            {loginErrorMsg && <div className="errorText">{loginErrorMsg}</div>}
                            <button id={styles.logInBtn} type="submit">Log In</button>
                            <button id={styles.scrollBtn} type="button" className="actionButton" onClick={() => {
                                const element = document.getElementById('loginCard');
                                const offset = -1.5 * getToolbarHeight();
                                const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                                const offsetPosition = elementPosition + offset;

                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: 'smooth'
                                });
                            }}>Not yet a member?</button>
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

            <Modal open={activeModal.type === 'pswReset'}>

                <div>Email associated with your account</div>
                <form onSubmit={(e) => handlePasswordResetRequest(e)} >
                    <input type="email" name="email" placeholder="email" required />
                    <button id={styles.logInBtn} type="submit" className='actionButton'>Reset Password</button>
                    <button className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
                </form>

            </Modal>

            <Modal open={activeModal.type === 'pswResetConfirm'}>
                <div>Please check your email for your password reset link</div>
                <button className='actionButton' onClick={() => setActiveModal('')}>Ok</button>
            </Modal>


        </>
    );
};

export default Login;