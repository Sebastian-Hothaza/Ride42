import { useEffect } from 'react';
import styles from './stylesheets/Modal.module.css';

const Modal = ({ children, open }) => {
    useEffect(() => {
        if (open) {
            document.body.classList.add(styles.noScroll);
        }

        // Cleanup function to remove the class when the component unmounts
        return () => {
            document.body.classList.remove(styles.noScroll);
        };
    }, [open]);

    if (!open) return null;

    return (
        <>
            <div className={styles.overlay}></div>
            <div className={styles.modal}>
                {children}
            </div>
        </>
    );
};

export default Modal;