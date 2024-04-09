import { NavLink, useOutletContext } from "react-router-dom";


import styles from './stylesheets/Login.module.css'


const Login = () => {

    const { handleLogin } = useOutletContext();

    function handleLoginSubmit(formData) {
        formData.preventDefault();
        handleLogin(formData);
    }

    return (
        <>
            <div className="content">
                <div className={styles.invertedContent}>
                    <div id={styles.registerCard} >
                        <div className="cardContent">
                            <h1>Why Register?</h1>
                            <div>
                                <ul id={styles.whyRegisterUl}>
                                    <li>Access to pre-register for trackdays</li>
                                    <li>Manage your booked trackdays</li>
                                    <li>Express check-in</li>
                                    <li>Vote for track layouts</li>
                                    <li>One time waiver</li>
                                </ul>
                                <div id={styles.registerBtnContainer}>
                                    <NavLink className={styles.registerBtn}  to="/register">Register Now!</NavLink>
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
            </div>
        </>
    );
};

export default Login;