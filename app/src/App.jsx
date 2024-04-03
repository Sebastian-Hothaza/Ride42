import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";

import './App.css'



function App() {
    const [allTrackdays, setAllTrackdays] = useState('');
    const [activeTab, setActiveTab] = useState('');

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
            <Outlet context={allTrackdays} />
        </>
    )
}

export default App
