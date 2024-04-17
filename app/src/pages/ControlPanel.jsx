
import { useEffect, useState } from "react";
import styles from './stylesheets/ControlPanel.module.css'

import { useOutletContext } from "react-router-dom";
import Modal from "../components/Modal";
import CPDash_Trackdays from './CPDash/CPDash_Trackdays'
import CPDash_Profile from './CPDash/CPDash_Profile'
import CPDash_Garage from './CPDash/CPDash_Garage'
import CPDash_Waiver from './CPDash/CPDash_Waiver'
import CPDash_GateRegister from './CPDash/CPDash_GateRegister'
import CPDash_WalkOn from './CPDash/CPDash_WalkOn'
import CPDash_CheckIn from './CPDash/CPDash_CheckIn'
import CPDash_Verify from './CPDash/CPDash_Verify'

const ControlPanel = ({ APIServer, setLoggedIn }) => {


    const { handleLogout } = useOutletContext();
    const loggedInUser = JSON.parse(localStorage.getItem("user"))
    const [userInfo, setUserInfo] = useState('');
    const [allUsers, setAllUsers] = useState('');

    const [userTrackdays, setUserTrackdays] = useState('');
    const [allTrackdays, setAllTrackdays] = useState('');

    const [activeTab, setActiveTab] = useState('trackdays')
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    async function fetchAPIData() {
        let userInfoData, allTrackdaysData, userTrackdaysData = []
        try {
            const [userInfoResponse, allTrackdaysResponse, userTrackdaysResponse] = await Promise.all([
                fetch(APIServer + 'users/' + loggedInUser.id, { credentials: "include", }),
                fetch(APIServer + 'presentTrackdays'),
                fetch(APIServer + 'presentTrackdays/' + loggedInUser.id)]);
            if (!userInfoResponse.ok) throw new Error('Failed to build API Data for userInfo');
            if (!allTrackdaysResponse.ok) throw new Error('Failed to build API Data for allTrackdays');
            if (!userTrackdaysResponse.ok) throw new Error('Failed to build API Data for userTrackdays');

            [userInfoData, allTrackdaysData, userTrackdaysData] = await Promise.all([userInfoResponse.json(), allTrackdaysResponse.json(), userTrackdaysResponse.json()])


            setUserInfo(userInfoData);
            setAllTrackdays(allTrackdaysData);
            setUserTrackdays(userTrackdaysData);

        } catch (err) {
            console.log(err.message)
            handleLogout(); // If any of the above API calls failed, there is a serious issue and we do not permit user access
        }



        // Fetch staff API Data
        if (userInfoData.memberType === 'staff' || userInfoData.memberType === 'admin') {
            let allUsersData = []
            try {
                const [allUsers] = await Promise.all([
                    fetch(APIServer + 'users', { credentials: "include", }),
                ]);
                if (!allUsers.ok) throw new Error('Failed to build API Data for userInfo');


                [allUsersData] = await Promise.all([allUsers.json()])

                setAllUsers(allUsersData)


            } catch (err) {
                console.log(err.message)
                handleLogout(); // If any of the above API calls failed, there is a serious issue and we do not permit user access
            }
       
        }
    }




    useEffect(() => {
        fetchAPIData();
    }, [])

    return (
        <>
            <div className={styles.controlPanel}>
                <div className={styles.CPMenu}>
                    {/* Menu items rendered on memberType */}
                    <div className={styles.mainControls}>
                        <div id={styles.greeting}>Welcome {loggedInUser.firstName[0].toUpperCase() + loggedInUser.firstName.slice(1)},</div>
                        <button className={activeTab == 'profile' ? styles.selected : undefined} onClick={() => setActiveTab('profile')}>My Profile</button>
                        <button className={activeTab == 'trackdays' ? styles.selected : undefined} onClick={() => setActiveTab('trackdays')}>My Trackdays</button>
                        <button className={activeTab == 'garage' ? styles.selected : undefined} onClick={() => setActiveTab('garage')}>My Garage</button>
                        {/* STAFF */}
                        {(loggedInUser.memberType == 'staff' || loggedInUser.memberType == 'admin') &&
                            <>
                                <button className={activeTab == 'waiver' ? styles.selected : undefined} onClick={() => setActiveTab('waiver')}>Waiver</button>
                                <button className={activeTab == 'gateRegister' ? styles.selected : undefined} onClick={() => setActiveTab('gateRegister')}>Gate Register</button>
                                <button className={activeTab == 'walkOn' ? styles.selected : undefined} onClick={() => setActiveTab('walkOn')}>Walk On</button>
                                <button className={activeTab == 'checkIn' ? styles.selected : undefined} onClick={() => setActiveTab('checkIn')}>Check In</button>
                                <button className={activeTab == 'verify' ? styles.selected : undefined} onClick={() => setActiveTab('verify')}>Verify</button>
                            </>
                        }

                    </div>


                    <button id={styles.logOutBtn} onClick={() => setShowLogoutModal(true)}>LOG OUT</button>
                </div>

                <div className={styles.CPDash}>
                    {/* CPDash rendered based on active tab */}
                    {activeTab == 'profile' && <CPDash_Profile APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} />}
                    {activeTab == 'trackdays' && <CPDash_Trackdays APIServer={APIServer} userInfo={userInfo} allTrackdays={allTrackdays} userTrackdays={userTrackdays} fetchAPIData={fetchAPIData} setActiveTab={setActiveTab} />}
                    {activeTab == 'garage' && <CPDash_Garage APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} setActiveTab={setActiveTab} />}

                    {activeTab == 'waiver' && <CPDash_Waiver APIServer={APIServer} fetchAPIData={fetchAPIData} allUsers={allUsers}/>}
                    {activeTab == 'gateRegister' && <CPDash_GateRegister APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} allUsers={allUsers} allTrackdays={allTrackdays} />}
                    {activeTab == 'walkOn' && <CPDash_WalkOn APIServer={APIServer} fetchAPIData={fetchAPIData} allTrackdays={allTrackdays} />}
                    {activeTab == 'checkIn' && <CPDash_CheckIn APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} />}
                    {activeTab == 'verify' && <CPDash_Verify APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} />}
                </div>

                {/* MOBILE */}
                <div className={styles.CPMenuMobile}>
                    {/* Menu items rendered on memberType */}

                    <button className={activeTab == 'profile' ? styles.selected : undefined} onClick={() => setActiveTab('profile')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'profile' ? styles.selected : undefined}`}> person </span></button>
                    <button className={activeTab == 'trackdays' ? styles.selected : undefined} onClick={() => setActiveTab('trackdays')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'trackdays' ? styles.selected : undefined}`}> calendar_month </span></button>
                    <button className={activeTab == 'garage' ? styles.selected : undefined} onClick={() => setActiveTab('garage')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'garage' ? styles.selected : undefined}`}> garage_home </span></button>
                    {/* {loggedInUser.memberType=='admin' && <button onClick={()=>setActiveTab('xxx')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined`}> menu </span></button>} */}
                    <button onClick={() => setShowLogoutModal(true)}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined`}> logout </span></button>




                </div>

            </div>
            <Modal open={!userInfo || !allTrackdays || !userTrackdays} type='loading' text={'Fetching your data...'}>  </Modal>
            <Modal open={(userInfo && allTrackdays && userTrackdays) && !allUsers && (userInfo.memberType === 'admin' || userInfo.memberType === 'staff')} type='loading' text={'Fetching staff data...'}>  </Modal>
            <Modal open={showLogoutModal} type='confirmation' text='Are you sure you want to log out?' onClose={() => setShowLogoutModal(false)} onOK={() => handleLogout()} okText="Yes" closeText="No" ></Modal>
        </>
    );
};

export default ControlPanel;