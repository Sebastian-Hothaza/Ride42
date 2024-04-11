
import styles from './stylesheets/Modal_Loading.module.css'

const Modal_Loading = ({ open, text }) => {
    if (!open) return null

    return (
        <>
            <div className={styles.overlay} ></div>
            <div className={styles.spinnerContainer}>
                <div className={styles.loader}></div>
                <div> {text} </div>
            </div>
        </>
    );
};

export default Modal_Loading;