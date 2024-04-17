import styles from './stylesheets/CPDash_AdminSelect.module.css'
import ScrollToTop from "../../components/ScrollToTop";

const AdminSelect = ({ setActiveTab }) => {
    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Staff Tools</h1>
                <button onClick={() => setActiveTab('waiver')}>Waiver</button>
                <button onClick={() => setActiveTab('gateRegister')}>Gate Register</button>
                <button onClick={() => setActiveTab('walkOn')}>Walk On</button>
                <button onClick={() => setActiveTab('checkIn')}>Check In</button>
                <button onClick={() => setActiveTab('verify')}>Verify</button>
            </div>
        </>
    );
};

export default AdminSelect;