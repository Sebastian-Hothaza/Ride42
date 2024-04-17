import styles from './stylesheets/CPDash_CheckIn.module.css'
import ScrollToTop from "../../components/ScrollToTop";

const CheckIn = () => {

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>CheckIn</h1>
            </div>
        </>
    );
};

export default CheckIn;