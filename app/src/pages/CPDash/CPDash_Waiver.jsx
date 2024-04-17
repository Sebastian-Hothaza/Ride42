import styles from './stylesheets/CPDash_Waiver.module.css'
import ScrollToTop from "../../components/ScrollToTop";

const Waiver = () => {

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Waiver</h1>
            </div>
        </>
    );
};

export default Waiver;