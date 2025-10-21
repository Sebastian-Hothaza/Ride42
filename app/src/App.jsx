import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";

import './App.css'

import ScrollToTop from "./components/ScrollToTop";
import Navbar from './components/Navbar';
import Footer from './components/Footer';


function App() {
    const [loggedIn, setLoggedIn] = useState(false);


    // Deal with user redreshing the page which would reset logged in status
    if (!loggedIn && localStorage.getItem('user')) setLoggedIn(true)

    // Ping API to wake it up, FLY machine can take 2-3 seconds to wake
    async function wakeAPI() {
        try {
            await fetch(import.meta.env.VITE_API_SERVER);
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
            const response = await fetch(import.meta.env.VITE_API_SERVER + 'login', {
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
                setLoggedIn(true);
            } else {
                e.target.password.value = '';
                setLoggedIn(false); //TODO Why is it needed
                const data = await response.json();
                return data.msg.join('\n')
            }
        } catch (err) {
            return err.message;
        }
    }




async function handleLogout() {
    try {
        // Call logout endpoint to clear JWT cookies
        await fetch(import.meta.env.VITE_API_SERVER + 'logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error('Error during logout:', err);
    }
 
    localStorage.removeItem('user');
    setLoggedIn(false);
}


return (
    <>
        <Navbar />
        <ScrollToTop />
        <div className='main'>
            <Outlet context={{ APIServer: import.meta.env.VITE_API_SERVER, handleLogin, loggedIn, setLoggedIn, handleLogout }} />
            <Footer />
        </div>
    </>
)
}

export default App
