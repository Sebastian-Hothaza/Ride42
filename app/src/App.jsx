import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";

import './App.css'

import ScrollToTop from "./components/ScrollToTop";
import Navbar from './components/Navbar';
import Footer from './components/Footer';


function App() {
    const APIServer = (process.env.NODE_ENV === 'production') ? 'https://api.ZZZZZride42ZZZZ.ca/' : 'http://localhost:3000/'
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginErrorMsg, setLoginErrorMsg] = useState();

    // Deal with user redreshing the page which would reset logged in status
    if (!loggedIn && localStorage.getItem('user')) setLoggedIn(true)

    // Ping API to wake it up, FLY machine can take 2-3 seconds to wake
    async function wakeAPI() {
        try {
            await fetch(APIServer);
        } catch (err) {
            console.log('Could not contact API')
        }
    }



    useEffect(() => {
        wakeAPI();
    }, [])



    async function handleLogin(e) {
        const formData = new FormData(e.target);
        try {
            const response = await fetch(APIServer + 'login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("user", JSON.stringify(data)); // Store user in localStorage
                // Store JWT's in localStorage
                // localStorage.setItem('accessToken', data.accessToken);
                // localStorage.setItem('refreshToken', data.refreshToken);

                setLoginErrorMsg('')
                setLoggedIn(true);

            } else if (response.status === 403) {
                const data = await response.json();
                e.target.password.value = '';
                
                setLoginErrorMsg(data.msg);
                setLoggedIn(false);
            } else {
                throw new Error('API Failure')
            }
        } catch (err) {
            console.log(err.message)
        }
    }

    function handleLogout() {
        // TODO: API call to logout to wipe refresh token out?
        localStorage.clear();
        setLoggedIn(false);
    }

    return (
        <>
            <Navbar />
            <ScrollToTop />
            <div className='main'>
                <Outlet context={{ APIServer, handleLogin, loginErrorMsg, loggedIn, setLoggedIn, handleLogout }} />
                <Footer />
            </div>


        </>
    )
}

export default App
