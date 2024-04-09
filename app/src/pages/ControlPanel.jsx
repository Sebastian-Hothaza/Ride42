import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from './stylesheets/ControlPanel.module.css'

import CPDash_Trackdays from './CPDash/CPDash_Trackdays'
import CPDash_Profile from './CPDash/CPDash_Profile'
import CPDash_Garage from './CPDash/CPDash_Garage'

const ControlPanel = ({ APIServer }) => {

    const { handleLogout } = useOutletContext();
    const loggedInUser = JSON.parse(localStorage.getItem("user"))

    const [activeTab, setActiveTab] = useState('garage')

    return (
        <div className={styles.controlPanel}>
            <div className={styles.CPMenu}>
                {/* Menu items rendered on memberType */}
                <div className={styles.mainControls}>
                    <div id={styles.greeting}>Welcome {loggedInUser.firstName[0].toUpperCase() + loggedInUser.firstName.slice(1)},</div>
                    <button className={activeTab == 'profile'? styles.selected : undefined} onClick={() => setActiveTab('profile')}>My Profile</button>
                    <button className={activeTab == 'trackdays'? styles.selected : undefined} onClick={() => setActiveTab('trackdays')}>My Trackdays</button>
                    <button className={activeTab == 'garage'? styles.selected : undefined} onClick={() => setActiveTab('garage')}>My Garage</button>
                    {/* {loggedInUser.memberType=='admin' && <button onClick={()=>setActiveTab('manageUsers')}>Manage Users</button>} */}
                </div>


                <button id={styles.logOutBtn} onClick={handleLogout}>LOG OUT</button>
            </div>

            <div className={styles.CPDash}>
                {/* CPDash rendered based on active tab */}
                {activeTab == 'profile' && <CPDash_Profile loggedInUser={loggedInUser} APIServer={APIServer} />}
                {activeTab == 'trackdays' && <CPDash_Trackdays loggedInUser={loggedInUser} APIServer={APIServer} />}
                {activeTab == 'garage' && <CPDash_Garage loggedInUser={loggedInUser} APIServer={APIServer} />}
            </div>

            {/* MOBILE */}
            <div className={styles.CPMenuMobile}>
                {/* Menu items rendered on memberType */}

                <button className={activeTab == 'profile'? styles.selected : undefined} onClick={() => setActiveTab('profile')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'profile'? styles.selected : undefined}`}> person </span></button>
                <button className={activeTab == 'trackdays'? styles.selected : undefined} onClick={() => setActiveTab('trackdays')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'trackdays'? styles.selected : undefined}`}> calendar_month </span></button>
                <button className={activeTab == 'garage'? styles.selected : undefined} onClick={() => setActiveTab('garage')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'garage'? styles.selected : undefined}`}> garage_home </span></button>
                {/* {loggedInUser.memberType=='admin' && <button onClick={()=>setActiveTab('xxx')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined`}> menu </span></button>} */}
                <button onClick={handleLogout}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined`}> logout </span></button>
                



            </div>

        </div>
    );
};

export default ControlPanel;