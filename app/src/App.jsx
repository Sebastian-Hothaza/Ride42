import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";

import './App.css'

import ScrollToTop from "./components/ScrollToTop";

async function handleLogin(formData) {
    formData.preventDefault();
    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
        // body: JSON.stringify({email: formData.target.email.value, password: formData.target.password.value})
        body: JSON.stringify({ email: "sebastianhothaza@gmail.com", password: "Sebi1234" })
    })
    const data = await response.json();
    console.log('response: ', response);
    console.log('data: ', data)
}


function App() {
    const [allTrackdays, setAllTrackdays] = useState('');

    const APIServer = (process.env.NODE_ENV === 'production') ? 'https://api.ride42.ca/' : 'http://localhost:3000/'
    useEffect(() => {
        fetchAPIData();
    }, [])
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
    return (
        <>
            <ScrollToTop />
            <Outlet context={{ allTrackdays, handleLogin, }} />
        </>
    )
}

export default App
