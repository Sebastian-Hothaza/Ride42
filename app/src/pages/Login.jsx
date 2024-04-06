import { NavLink, useOutletContext } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";




const Login = () => {

    const {handleLogin, loggedIn} =  useOutletContext();

    function handleLoginSubmit(formData) {
        formData.preventDefault();
        handleLogin(formData);
    }

    return (
        <>
            <Navbar />
            <div className="main inverted">
                <div id='registerCard' >
                    <div className='cardContent'>
                        <h1>Why Register?</h1>
                        <div>
                            <ul id="whyRegisterList">
                                <li>Access to pre-register for trackdays</li>
                                <li>Manage your booked trackdays</li>
                                <li>Express check-in</li>
                                <li>Vote for track layouts</li>
                                <li>One time waiver</li>
                            </ul>
                            <div id="registerBtnContainer">
                                <NavLink id="registerBtn" className="formattedButton" to="/register">Register Now!</NavLink>
                            </div>

                        </div>
                    </div>
                </div>
                <div id="loginCard">
                    <h1>Member Log-In</h1>
                    <form onSubmit={(formData) => handleLoginSubmit(formData)} >
                        <input type="text" name="email" placeholder="email" />
                        <input type="password" name="password" placeholder="password" />
                        <button id="logInBtn" type="submit">Log In</button>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Login;