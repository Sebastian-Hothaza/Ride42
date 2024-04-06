import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";

import './App.css'

import ScrollToTop from "./components/ScrollToTop";
import Navbar from './components/Navbar';
import Footer from './components/Footer';



function App() {
    const APIServer = (process.env.NODE_ENV === 'production') ? 'https://api.ride42.ca/' : 'http://localhost:3000/'
    const [allTrackdays, setAllTrackdays] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);



    async function fetchAPIData() {
        try {
            const response = await fetch(APIServer + 'presentTrackdays');
            if (!response.ok) throw new Error("Failed to get API Data")
            const data = await response.json();
            setAllTrackdays(data);
        } catch (err) {
            console.log(err.message)
        }
    }

    useEffect(() => {
        fetchAPIData();
    }, [])



    async function handleLogin(formData) {
        const response = await fetch(APIServer + 'login', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
            // body: JSON.stringify({email: formData.target.email.value, password: formData.target.password.value})
            body: JSON.stringify({ email: "sebastianhothaza@gmail.com", password: "Sebi1234" })
        })
        if (!response.ok){
			// Set some error message in state variable similar to how we did the comment post error message
            // Incorrect password or user does not exist
            // TODO
			console.log("BAD LOGIN")
			formData.target.password.value = '';
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
            <Outlet context={{ allTrackdays, handleLogin, loggedIn, handleLogout }} />
            <Footer />
        </>
    )
}

export default App
