import styles from './stylesheets/Modal.module.css'

const Modal = ({ children, open }) => {
    if (!open) return null
    return (
        <>
            <div className={styles.overlay} ></div>
            <div className={styles.modal}>
                {children}
            </div>
        </>
    );
};

export default Modal;