import styles from './stylesheets/StaffTools.module.css'
import ScrollToTop from "../../components/ScrollToTop";


import waiver from '../../assets/staffTools/waiver.png'
import checkin from '../../assets/staffTools/checkin.png'
import manageTrackdays from '../../assets/staffTools/manageTrackdays.png'
import gate from '../../assets/staffTools/gate.png'
import manageUsers from '../../assets/staffTools/manageUsers.png'
import manageQR from '../../assets/staffTools/manageQR.png'
import paid from '../../assets/staffTools/paid.png'
import server from '../../assets/staffTools/server.png'
import state from '../../assets/staffTools/state.png'
import verify from '../../assets/staffTools/verify.png'


import fetchLogs from '../logUtils';

const staffTools = ({ setActiveTab, memberType, APIServer }) => {
    return (
        <>
            <ScrollToTop />
            <h1>Staff Tools</h1>
            <div className={styles.content}>

                <button onClick={() => setActiveTab('waiver')}><img src={waiver}></img>Waiver</button>
                <button onClick={() => setActiveTab('gateRegister')}><img src={gate}></img>Gate Register</button>
                <button onClick={() => setActiveTab('trackdayState')}><img src={state}></img>Trackday State</button>
                <button onClick={() => setActiveTab('checkIn')}><img src={checkin}></img>Check In</button>
                <button onClick={() => setActiveTab('verify')}><img src={verify}></img>Verify</button>
        

                {/* ADMIN */}
                {memberType === 'admin' &&
                    <>
                        <button onClick={() => setActiveTab('manageQR')}><img src={manageQR}></img>Manage QR</button>
                        <button onClick={() => setActiveTab('manageUsers')}><img src={manageUsers}></img>Manage Users</button>
                        <button onClick={() => setActiveTab('manageTrackdays')}><img src={manageTrackdays}></img>Manage Trackdays</button>
                        <button onClick={() => setActiveTab('markPaid')}><img src={paid}></img>Mark Paid</button>
                        <button onClick={() => fetchLogs(APIServer)}><img src={server}></img>Server Logs</button>
                    </>
                }
            </div>
        </>
    );
};

export default staffTools;