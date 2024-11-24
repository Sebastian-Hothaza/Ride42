import { useEffect, useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";
import Modal from "../../components/Modal";
import Loading from '../../components/Loading';
import styles from './stylesheets/CPDash_GenerateQR.module.css';
import modalStyles from '../../components/stylesheets/Modal.module.css';
import checkmark from './../../assets/checkmark.png';
import errormark from './../../assets/error.png';
import QRCode from 'qrcode';
import r42_small from '../../assets/R42_sticker.png';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const GenerateQR = ({ APIServer }) => {
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const [b64Arr, setb64Arr] = useState([]);

    async function handleGenerateQRSubmit(e) {
        e.preventDefault();
        const totalQR = Number(e.target.greenQR.value) + Number(e.target.yellowQR.value) + Number(e.target.redQR.value)



        setActiveModal({ type: 'loading', msg: 'Generating QR Codes' });
        try {
            const response = await fetch(APIServer + 'QR', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({ qty: totalQR })
            })

            if (response.ok) {
                const data = await response.json(); // Data is an array of objects where each object has form {id: "67436fe8bf5e6f497683cf3a"}
                data.forEach(async (item) => {
                    const b64 = await generateQR(item.id);
                    setb64Arr(prev => [...prev, {id: item.id, img: b64}])
                });

                setActiveModal({ type: 'success', msg: 'QR Codes Generated' });
                setTimeout(() => setActiveModal(''), 1500)
            } else {
                const data = await response.json();
                setActiveModal({ type: 'failure', msg: data.msg.join('\n') })
            }
        } catch (err) {
            setActiveModal({ type: 'failure', msg: 'API Failure' })
            console.log(err.message)
        }
    }

    async function generateQR(text) {
        try {
            const b64 = await QRCode.toDataURL(text, { errorCorrectionLevel: 'L' });
            return b64;
        } catch (err) {
            console.error(err);
        }
    }

    async function downloadAllImages() {
        const zip = new JSZip();
        const promises = b64Arr.map(async (item) => {
            const canvas = await html2canvas(document.getElementById(item.id), {
                onclone: (doc) => doc.getElementById('stickerContainer').style.display = 'block'
            });
            const image = canvas.toDataURL("image/png", 1.0).split(',')[1];
            zip.file(`${item.id}.png`, image, { base64: true });
        });

        await Promise.all(promises);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'QRCodes.zip');
    }

    // Download images once they are available
    useEffect(() => {
        const container = document.getElementById('stickerContainer');
        if (container && container.hasChildNodes()) downloadAllImages();
    }, [b64Arr]);

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Generate QR Codes</h1>
                <form onSubmit={(e) => handleGenerateQRSubmit(e)}>
                    <label htmlFor="greenQR">Green QR Codes:</label>
                    <input type="number" id="greenQR" name="greenQR" ></input>
                    <label htmlFor="yellowQR">Yellow QR Codes:</label>
                    <input type="number" id="yellowQR" name="yellowQR" ></input>
                    <label htmlFor="redQR">Red QR Codes:</label>
                    <input type="number" id="redQR" name="redQR" ></input>
                    <button className={styles.confirmBtn} type="submit">Generate QRs</button>
                </form>
            </div>
            {b64Arr &&
                <div id='stickerContainer' className={styles.stickerContainer}>
                    {b64Arr.map((item) => (
                        <div className={styles.sticker} key={item.id} id={item.id}>
                            <img src={item.img} alt="QR code"></img>
                            <img src={r42_small} alt="R42 sticker"></img>
                            <div className={styles.groupSticker}>GROUP</div>
                        </div>
                    ))}
                </div>
            }
            <Loading open={activeModal.type === 'loading'}>
                {activeModal.msg}
            </Loading>
            <Modal open={activeModal.type === 'success'}>
                <div className={modalStyles.modalNotif}></div>
                <img id={modalStyles.modalCheckmarkIMG} src={checkmark} alt="checkmark icon" />
                {activeModal.msg}
            </Modal>
            <Modal open={activeModal.type === 'failure'}>
                <div className={modalStyles.modalNotif}></div>
                <img id={modalStyles.modalCheckmarkIMG} src={errormark} alt="error icon" />
                {activeModal.msg}
                <button className='actionButton' onClick={() => setActiveModal('')}>Close</button>
            </Modal>
        </>
    );
};

export default GenerateQR;
