import styles from './stylesheets/Modal.module.css'

// Creates a whole page modal

// open: boolean to decide if modal should be open
// onClose: Modal calls this function when closed
// text: Text content of the modal
// okText: Text that appears on the OK button of the modal. If empty, then OK button is not shown
// closeText: Text that appears on the close button of the modal
// fn: Modal calls this function when OK button is pressed

const Modal = ({ open, onClose, text, okText, closeText, fn }) => {
    if (!open) return null
    return (
        <>
            <div className={styles.overlay} ></div>
            <div className={styles.modal}>
                {text}
                {okText && <button className={`actionButton ${styles.confirmBtn}`} onClick={fn}>{okText}</button>} 
                <button className='actionButton' onClick={onClose}>{closeText}</button>
            </div>
        </>
    );
};

export default Modal;