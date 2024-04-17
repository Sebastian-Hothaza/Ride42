import styles from './stylesheets/CPDash_WalkOn.module.css'
import ScrollToTop from "../../components/ScrollToTop";

const WalkOn = () => {

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>WalkOn</h1>
            </div>
        </>
    );
};

export default WalkOn;