import { NavLink, useOutletContext } from "react-router-dom";


import styles from './stylesheets/Login.module.css'


const Login = () => {

    const {handleLogin} =  useOutletContext();

    function handleLoginSubmit(formData) {
        formData.preventDefault();
        handleLogin(formData);
    }

    return (
        <>
            <div className={styles.inverted}>
                <div id={styles.registerCard} >
                    <div className={styles.cardContent}>
                        <h1>Why Register?</h1>
                        <div>
                            <ul id={styles.whyRegisterList}>
                                <li>Access to pre-register for trackdays</li>
                                <li>Manage your booked trackdays</li>
                                <li>Express check-in</li>
                                <li>Vote for track layouts</li>
                                <li>One time waiver</li>
                            </ul>
                            <div id={styles.registerBtnContainer}>
                                <NavLink id={styles.registerBtn} className="actionButton" to="/register">Register Now!</NavLink>
                            </div>

                        </div>
                    </div>
                </div>
                <div id={styles.loginCard}>
                    <h1>Member Log-In</h1>
                    <form onSubmit={(formData) => handleLoginSubmit(formData)} >
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <button id={styles.logInBtn} type="submit">Log In</button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Login;