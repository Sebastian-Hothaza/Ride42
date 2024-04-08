import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import './stylesheets/controlPanel.css'

import CPDash_Trackdays from './CPDash/CPDash_Trackdays'
import CPDash_Profile from './CPDash/CPDash_Profile'
import CPDash_Garage from './CPDash/CPDash_Garage'

const ControlPanel = ({APIServer}) => {

    const { handleLogout } = useOutletContext();
    const loggedInUser = JSON.parse(localStorage.getItem("user"))

    const [activeTab, setActiveTab] = useState('trackdays')

    return (
        <div id="controlPanel">
            <div className="CPMenu">
                {/* Menu items rendered on memberType */}
                <div>Hello {loggedInUser.firstName}</div>
                <button onClick={()=>setActiveTab('profile')}>My Profile</button>
                <button onClick={()=>setActiveTab('trackdays')}>My Trackdays</button>
                <button onClick={()=>setActiveTab('garage')}>My Garage</button>
                {/* {loggedInUser.memberType=='admin' && <button onClick={()=>setActiveTab('manageUsers')}>Manage Users</button>} */}
                <button onClick={handleLogout}>LOG OUT</button>
            </div>

            <div className="CPDash">
                {/* CPDash rendered based on active tab */}
                {activeTab=='profile' && <CPDash_Profile loggedInUser={loggedInUser} APIServer={APIServer}/>}
                {activeTab=='trackdays' && <CPDash_Trackdays loggedInUser={loggedInUser} APIServer={APIServer}/>}
                {activeTab=='garage' && <CPDash_Garage loggedInUser={loggedInUser} APIServer={APIServer}/>}
            </div>

        </div>
    );
};

export default ControlPanel;