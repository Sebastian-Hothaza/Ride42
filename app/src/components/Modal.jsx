import styles from './stylesheets/Modal.module.css'

import checkmark from './../assets/checkmark.png'

// open: boolean to decide if modal should be open
// type: oneOf{loading, confirmation, select, notification}
// text: Text content of the modal
// onClose: Modal calls this function when closed
// onOK: Modal calls this function when OK button is pressed
// okText: Text that appears on the OK button of the modal. If empty, then OK button is not shown
// closeText: Text that appears on the close button of the modal
// selection: Array of items to appear in the select






const Modal = ({ open, type, text, onClose, onOK, okText, closeText, selection }) => {




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
            return (
                <>
                    <div className={styles.overlay} ></div>
                    <div className={styles.modal}>
                        {text}
                        <form onSubmit={(e) => onOK(e, e.target.date.value)}>
                            <select name="date" id="date" required>
                                <option key="dateNone" value="">---Select---</option>
                                {selection.map((trackday) => <option key={trackday.id} value={trackday.id}>{trackday.prettyDate}</option>)}
                            </select>
                            <button className={`actionButton ${styles.confirmBtn}`} type="submit">{okText}</button>
                            <button type="button" className='actionButton' onClick={onClose}>{closeText}</button>
                        </form>

                    </div>
                </>
            );
        default:
            return <div>INVALID MODAL</div>
    }
};

export default Modal;