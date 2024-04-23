import modalStyles from './stylesheets/Modal.module.css'

const Loading = ({ open, children }) => {
    if (!open) return null

    return (
        <>
            <div className={modalStyles.overlay} ></div>
            <div className={modalStyles.spinnerContainer}>
                <div className={modalStyles.loader}></div>
                <div>{children}</div>
            </div>
        </>
    );
};

export default Loading;