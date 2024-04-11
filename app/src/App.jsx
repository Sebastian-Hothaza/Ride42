import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";

import './App.css'

import ScrollToTop from "./components/ScrollToTop";
import Navbar from './components/Navbar';
import Footer from './components/Footer';


function App() {
    const APIServer = (process.env.NODE_ENV === 'production') ? 'https://api.ride42.ca/' : 'http://localhost:3000/'
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
        const response = await fetch(APIServer + 'login', {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify(Object.fromEntries(formData))
        })
        if (!response.ok) {
            e.target.password.value = '';
            const data = await response.json();
            setLoginErrorMsg(data.msg);
            setLoggedIn(false);
        }else{
            const data = await response.json();
            localStorage.setItem("user", JSON.stringify(data)); // Store user in localStorage
            setLoginErrorMsg('')
            setLoggedIn(true);
        }

    }

    function handleLogout() {
        // TODO: API call to logout
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
