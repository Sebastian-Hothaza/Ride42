import { useEffect, useState } from "react";
import styles from './stylesheets/ControlPanel.module.css'
import modalStyles from '../components/stylesheets/Modal.module.css'

import { useOutletContext } from "react-router-dom";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import Trackdays from './CPDash/Trackdays'
import Profile from './CPDash/Profile'
import Garage from './CPDash/Garage'

import StaffTools from './CPDash/StaffTools'
import Waiver from './CPDash/Waiver'
import GateRegister from './CPDash/GateRegister'
import CheckIn from './CPDash/CheckIn'
import Verify from './CPDash/Verify'

import ManageQR from './CPDash/ManageQR'

import ManageUsers from './CPDash/ManageUsers'
import ManageTrackdays from './CPDash/ManageTrackdays'
import MarkPaid from './CPDash/MarkPaid'
import TrackdayState from './CPDash/TrackdayState'
import ServerLogs from "./CPDash/ServerLogs";


const ControlPanel = ({ APIServer }) => {

    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const { handleLogout } = useOutletContext();
    const loggedInUser = JSON.parse(localStorage.getItem("user"))
    const [userInfo, setUserInfo] = useState('');
    const [allUsers, setAllUsers] = useState('');
    const [allTrackdaysFULL, setAllTrackdaysFULL] = useState('');

    const [userTrackdays, setUserTrackdays] = useState('');
    const [allTrackdays, setAllTrackdays] = useState('');

    const [activeTab, setActiveTab] = (loggedInUser.memberType == 'staff' || loggedInUser.memberType == 'admin') ? useState('staffTools') : useState('trackdays')



    // Refreshes user & trackday data to ensure we are using latest data
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
            let allUsersData, allTrackdaysFULLData = []
            try {

                const [allUsersResponse, allTrackdaysFULLResponse] = await Promise.all([
                    fetch(APIServer + 'users', { credentials: "include" }),
                    fetch(APIServer + 'trackdays', { credentials: "include" })]);

                if (!allUsersResponse.ok) throw new Error('Failed to build API Data for allUsers');
                if (!allTrackdaysFULLResponse.ok) throw new Error('Failed to build API Data for allTrackdaysFULL');


                [allUsersData, allTrackdaysFULLData] = await Promise.all([allUsersResponse.json(), allTrackdaysFULLResponse.json()])

                setAllUsers(allUsersData)
                setAllTrackdaysFULL(allTrackdaysFULLData)


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
                    <div className={styles.mainControls}>
                        <div id={styles.greeting}>Welcome {loggedInUser.firstName[0].toUpperCase() + loggedInUser.firstName.slice(1)},</div>
                        <button className={activeTab == 'profile' ? styles.selected : undefined} onClick={() => setActiveTab('profile')}>My Profile</button>
                        <button className={activeTab == 'trackdays' ? styles.selected : undefined} onClick={() => setActiveTab('trackdays')}>My Trackdays</button>
                        <button className={activeTab == 'garage' ? styles.selected : undefined} onClick={() => setActiveTab('garage')}>My Garage</button>
                        {(loggedInUser.memberType == 'staff' || loggedInUser.memberType == 'admin') &&
                            <button className={activeTab == 'staffTools' ? styles.selected : undefined} onClick={() => setActiveTab('staffTools')}>Staff Tools</button>
                        }
                    </div>
                    <button id={styles.logOutBtn} onClick={() => setActiveModal({ type: 'logoutConfirm' })}>LOG OUT</button>
                </div>


                <div className={styles.CPDash}>
                    {/* CPDash rendered based on active tab */}
                    {activeTab == 'profile' && <Profile APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} />}
                    {activeTab == 'trackdays' && <Trackdays APIServer={APIServer} userInfo={userInfo} allTrackdays={allTrackdays} userTrackdays={userTrackdays} fetchAPIData={fetchAPIData} setActiveTab={setActiveTab} />}
                    {activeTab == 'garage' && <Garage APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} setActiveTab={setActiveTab} />}

                    {/* STAFF */}
                    {activeTab == 'staffTools' && <StaffTools setActiveTab={setActiveTab} memberType={loggedInUser.memberType} APIServer={APIServer} />}
                    {activeTab == 'waiver' && <Waiver APIServer={APIServer} fetchAPIData={fetchAPIData} allUsers={allUsers} />}
                    {activeTab == 'gateRegister' && <GateRegister APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} allUsers={allUsers} allTrackdays={allTrackdays} />}
                    {activeTab == 'trackdayState' && <TrackdayState fetchAPIData={fetchAPIData} allUsers={allUsers} allTrackdays={allTrackdays} allTrackdaysFULL={allTrackdaysFULL} />}
                    {activeTab == 'checkIn' && <CheckIn APIServer={APIServer} allTrackdays={allTrackdays} allUsers={allUsers} />}
                    {activeTab == 'verify' && <Verify APIServer={APIServer} allTrackdays={allTrackdays} allUsers={allUsers} />}
                    {activeTab == 'manageQR' && <ManageQR APIServer={APIServer} allUsers={allUsers} fetchAPIData={fetchAPIData} />}
                    {/* ADMIN */}
                    
                    {activeTab == 'manageUsers' && <ManageUsers APIServer={APIServer} fetchAPIData={fetchAPIData} allUsers={allUsers} />}
                    {activeTab == 'manageTrackdays' && <ManageTrackdays APIServer={APIServer} allTrackdaysFULL={allTrackdaysFULL} allUsers={allUsers} fetchAPIData={fetchAPIData} />}
                    {activeTab == 'markPaid' && <MarkPaid APIServer={APIServer} fetchAPIData={fetchAPIData} allUsers={allUsers} allTrackdaysFULL={allTrackdaysFULL} />}
                    {activeTab == 'serverLogs' && <ServerLogs APIServer={APIServer}/>}




                </div>
                {/* MOBILE TOOLBAR*/}
                <div className={styles.CPMenuMobile}>
                    <button className={activeTab == 'profile' ? styles.selected : undefined} onClick={() => setActiveTab('profile')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'profile' ? styles.selected : undefined}`}> person </span></button>
                    <button className={activeTab == 'trackdays' ? styles.selected : undefined} onClick={() => setActiveTab('trackdays')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'trackdays' ? styles.selected : undefined}`}> calendar_month </span></button>
                    {(loggedInUser.memberType == 'staff' || loggedInUser.memberType == 'admin') && <button className={activeTab == 'staffTools' ? styles.selected : undefined} onClick={() => setActiveTab('staffTools')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'staffTools' ? styles.selected : undefined}`}> shield_person </span></button>}
                    <button className={activeTab == 'garage' ? styles.selected : undefined} onClick={() => setActiveTab('garage')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'garage' ? styles.selected : undefined}`}> garage_home </span></button>
                    <button onClick={() => setActiveModal({ type: 'logoutConfirm' })}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined`}> logout </span></button>
                </div>
            </div>

            <Loading open={!userInfo || !allTrackdays || !userTrackdays}>
                Fetching your data...
            </Loading>

            <Loading open={(userInfo && allTrackdays && userTrackdays) && !allUsers && (userInfo.memberType === 'admin' || userInfo.memberType === 'staff')}>
                Fetching staff data...
            </Loading>




            <Modal open={activeModal.type === 'logoutConfirm'}>
                <>
                    Are you sure you want to log out?
                    <button className={`actionButton confirmBtn`} onClick={() => handleLogout()}>Yes</button>
                    <button className='actionButton' onClick={() => setActiveModal('')}>No</button>
                </>
            </Modal>
        </>
    );
};

export default ControlPanel;