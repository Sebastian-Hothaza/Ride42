import { useEffect, useState } from "react";
import styles from './stylesheets/ControlPanel.module.css'
import modalStyles from '../components/stylesheets/Modal.module.css'

import { useOutletContext } from "react-router-dom";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import CPDash_Trackdays from './CPDash/CPDash_Trackdays'
import CPDash_Profile from './CPDash/CPDash_Profile'
import CPDash_Garage from './CPDash/CPDash_Garage'

import CPDash_AdminSelect from './CPDash/CPDash_AdminSelect'
import CPDash_Waiver from './CPDash/CPDash_Waiver'
import CPDash_GateRegister from './CPDash/CPDash_GateRegister'
import CPDash_WalkOn from './CPDash/CPDash_WalkOn'
import CPDash_CheckIn from './CPDash/CPDash_CheckIn'
import CPDash_Verify from './CPDash/CPDash_Verify'

import CPDash_ViewQR from './CPDash/CPDash_ViewQR'
import CPDash_ManageUsers from './CPDash/CPDash_ManageUsers'
import CPDash_ManageTrackdays from './CPDash/CPDash_ManageTrackdays'
import CPDash_MarkPaid from './CPDash/CPDash_MarkPaid'
import CPDash_TrackdayState from './CPDash/CPDash_TrackdayState'
import CPDash_TrackdaySummary from './CPDash/CPDash_TrackdaySummary'
import CPDash_CheckInManual from './CPDash/CPDash_CheckInManual'
import CPDash_Emailer from './CPDash/CPDash_Emailer'


const ControlPanel = ({ APIServer }) => {

    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const { handleLogout } = useOutletContext();
    const loggedInUser = JSON.parse(localStorage.getItem("user"))
    const [userInfo, setUserInfo] = useState('');
    const [allUsers, setAllUsers] = useState('');

    const [userTrackdays, setUserTrackdays] = useState('');
    const [allTrackdays, setAllTrackdays] = useState('');

    const [activeTab, setActiveTab] = (loggedInUser.memberType == 'staff' || loggedInUser.memberType == 'admin') ? useState('adminSelect') : useState('trackdays')




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
                const allUsers = await fetch(APIServer + 'users', { credentials: "include" });

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
                        {/* ADMIN */}
                        {(loggedInUser.memberType == 'admin') &&
                            <>
                                <button className={activeTab == 'viewQR' ? styles.selected : undefined} onClick={() => setActiveTab('viewQR')}>View QR</button>
                                <button className={activeTab == 'manageUsers' ? styles.selected : undefined} onClick={() => setActiveTab('manageUsers')}>Manage Users</button>
                                <button className={activeTab == 'manageTrackdays' ? styles.selected : undefined} onClick={() => setActiveTab('manageTrackdays')}>Manage Trackdays</button>
                                <button className={activeTab == 'markPaid' ? styles.selected : undefined} onClick={() => setActiveTab('markPaid')}>Mark Paid</button>
                                <button className={activeTab == 'trackdayState' ? styles.selected : undefined} onClick={() => setActiveTab('trackdayState')}>Trackday State</button>
                                <button className={activeTab == 'trackdaySummary' ? styles.selected : undefined} onClick={() => setActiveTab('trackdaySummary')}>Trackday Summary</button>
                                <button className={activeTab == 'checkInManual' ? styles.selected : undefined} onClick={() => setActiveTab('checkInManual')}>Manual Check In</button>
                                <button className={activeTab == 'emailer' ? styles.selected : undefined} onClick={() => setActiveTab('emailer')}>Emailer</button>
                            </>
                        }

                    </div>
                    <button id={styles.logOutBtn} onClick={() => setActiveModal({ type: 'logoutConfirm' })}>LOG OUT</button>
                </div>
                <div className={styles.CPDash}>
                    {/* CPDash rendered based on active tab */}
                    {activeTab == 'profile' && <CPDash_Profile APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} />}
                    {activeTab == 'trackdays' && <CPDash_Trackdays APIServer={APIServer} userInfo={userInfo} allTrackdays={allTrackdays} userTrackdays={userTrackdays} fetchAPIData={fetchAPIData} setActiveTab={setActiveTab} />}
                    {activeTab == 'garage' && <CPDash_Garage APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} setActiveTab={setActiveTab} />}

                    {/* STAFF */}
                    {activeTab == 'adminSelect' && <CPDash_AdminSelect setActiveTab={setActiveTab} memberType={loggedInUser.memberType} />}
                    {activeTab == 'waiver' && <CPDash_Waiver APIServer={APIServer} fetchAPIData={fetchAPIData} allUsers={allUsers} />}
                    {activeTab == 'gateRegister' && <CPDash_GateRegister APIServer={APIServer} userInfo={userInfo} fetchAPIData={fetchAPIData} allUsers={allUsers} allTrackdays={allTrackdays} />}
                    {activeTab == 'walkOn' && <CPDash_WalkOn APIServer={APIServer} fetchAPIData={fetchAPIData} allTrackdays={allTrackdays} />}
                    {activeTab == 'checkIn' && <CPDash_CheckIn APIServer={APIServer} allTrackdays={allTrackdays} allUsers={allUsers} />}
                    {activeTab == 'verify' && <CPDash_Verify APIServer={APIServer} allTrackdays={allTrackdays} allUsers={allUsers} />}
                    {/* ADMIN */}
                    {activeTab == 'viewQR' && <CPDash_ViewQR allUsers={allUsers} />}
                    {activeTab == 'manageUsers' && <CPDash_ManageUsers APIServer={APIServer}/>}
                    {activeTab == 'manageTrackdays' && <CPDash_ManageTrackdays APIServer={APIServer}/>}
                    {activeTab == 'markPaid' && <CPDash_MarkPaid APIServer={APIServer}/>}
                    {activeTab == 'trackdayState' && <CPDash_TrackdayState APIServer={APIServer}/>}
                    {activeTab == 'trackdaySummary' && <CPDash_TrackdaySummary APIServer={APIServer}/>}
                    {activeTab == 'checkInManual' && <CPDash_CheckInManual APIServer={APIServer}/>}
                    {activeTab == 'emailer' && <CPDash_Emailer APIServer={APIServer}/>}


                </div>
                {/* MOBILE TOOLBAR*/}
                <div className={styles.CPMenuMobile}>
                    <button className={activeTab == 'profile' ? styles.selected : undefined} onClick={() => setActiveTab('profile')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'profile' ? styles.selected : undefined}`}> person </span></button>
                    <button className={activeTab == 'trackdays' ? styles.selected : undefined} onClick={() => setActiveTab('trackdays')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'trackdays' ? styles.selected : undefined}`}> calendar_month </span></button>
                    {(loggedInUser.memberType == 'staff' || loggedInUser.memberType == 'admin') && <button className={activeTab == 'adminSelect' ? styles.selected : undefined} onClick={() => setActiveTab('adminSelect')}><span className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'adminSelect' ? styles.selected : undefined}`}> shield_person </span></button>}
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
                    <button className={`actionButton ${modalStyles.confirmBtn}`} onClick={() => handleLogout()}>Yes</button>
                    <button className='actionButton' onClick={() => setActiveModal('')}>No</button>
                </>
            </Modal>
        </>
    );
};

export default ControlPanel;