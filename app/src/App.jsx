import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";

import './App.css'

import ScrollToTop from "./components/ScrollToTop";
import Navbar from './components/Navbar';
import Footer from './components/Footer';


function App() {
    const APIServer = (process.env.NODE_ENV === 'production') ? 'https://ride42api.fly.dev/' : 'http://localhost:3000/'
    const [loggedIn, setLoggedIn] = useState(false);

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
            // Set some error message in state variable similar to how we did the comment post error message
            // Incorrect password or user does not exist
            // TODO
            console.log("BAD LOGIN")
            e.target.password.value = '';
            const data = await response.json();
            console.log(data);
            return;
        }
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data)); // Store user in localStorage
        setLoggedIn(true);
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
                <Outlet context={{ APIServer, handleLogin, loggedIn, handleLogout }} />
                <Footer />
            </div>


        </>
    )
}

export default App
