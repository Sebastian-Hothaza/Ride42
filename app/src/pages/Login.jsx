import { NavLink, useOutletContext } from "react-router-dom";
import { useState } from "react";

import styles from './stylesheets/Login.module.css'

import Modal_Loading from "../components/Modal_Loading";


const Login = () => {

    const {  handleLogin, loginErrorMsg } = useOutletContext();
    const [pendingSubmit, setPendingSubmit] = useState(false);


    async function handleLoginSubmit(e) {
        e.preventDefault();
        setPendingSubmit(true);
        await handleLogin(e);
        setPendingSubmit(false);
    }

    return (
        <>
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
            <Modal_Loading open={pendingSubmit} text={'Logging you in...'}>  </Modal_Loading>
        </>
    );
};

export default Login;