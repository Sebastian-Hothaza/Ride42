import styles from './stylesheets/CPDash_AdminSelect.module.css'
import ScrollToTop from "../../components/ScrollToTop";

const AdminSelect = ({ setActiveTab, memberType }) => {
    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Staff Tools</h1>
                <button onClick={() => setActiveTab('waiver')}>Waiver</button>
                <button onClick={() => setActiveTab('gateRegister')}>Gate Register</button>
                <button onClick={() => setActiveTab('walkOn')}>Walk On</button>
                <button onClick={() => setActiveTab('trackdayState')}>Trackday State</button>
                <button onClick={() => setActiveTab('checkIn')}>Check In</button>
                <button onClick={() => setActiveTab('verify')}>Verify</button>

                {/* ADMIN */}
                {memberType === 'admin' &&
                    <>
                        <button onClick={() => setActiveTab('generateQR')}>Generate QR</button>
                        <button onClick={() => setActiveTab('viewQR')}>View QR</button>
                        <button onClick={() => setActiveTab('manageUsers')}>Manage Users</button>
                        <button onClick={() => setActiveTab('manageTrackdays')}>Manage Trackdays</button>
                        <button onClick={() => setActiveTab('markPaid')}>Mark Paid</button>
                        <button onClick={() => setActiveTab('trackdaySummary')}>Trackday Summary</button>
                        <button onClick={() => setActiveTab('checkInManual')}>Manual Check In</button>
                        <button onClick={() => setActiveTab('emailer')}>Emailer</button>
                    </>
                }


            </div>
        </>
    );
};

export default AdminSelect;