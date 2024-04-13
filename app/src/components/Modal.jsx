import styles from './stylesheets/Modal.module.css'

import checkmark from './../assets/checkmark.png'

// open: boolean to decide if modal should be open
// type: oneOf{loading, confirmation, select, notification}
// text: Text content of the modal
// onClose: Modal calls this function when closed
// onOK: Modal calls this function when OK button is pressed
// okText: Text that appears on the OK button of the modal. If empty, then OK button is not shown
// closeText: Text that appears on the close button of the modal





const Modal = ({ open, type, text, onClose, onOK, okText, closeText, }) => {



    if (!open) return null

    switch (type) {
        case 'loading':
            return (
                <>
                    <div className={styles.overlay} ></div>
                    <div className={styles.spinnerContainer}>
                        <div className={styles.loader}></div>
                        <div> {text} </div>
                    </div>
                </>
            );
        case 'confirmation':
            return (
                <>
                    <div className={styles.overlay} ></div>
                    <div className={styles.modal}>
                        {text}
                        {okText && <button className={`actionButton ${styles.confirmBtn}`} onClick={onOK}>{okText}</button>}
                        <button className='actionButton' onClick={onClose}>{closeText}</button>
                    </div>
                </>
            );
        case 'notification':
            setTimeout(() => onClose(), 1500)
            return (
                <>
                    <div className={styles.overlay} ></div>
                    <div id={styles.modalCheckmark} className={styles.modal}>
                        <img id={styles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
                        {text}
                    </div>
                </>
            );
        case 'select':
            return <div>select</div>
        default:
            return <div>INVALID MODAL</div>
    }
};

export default Modal;