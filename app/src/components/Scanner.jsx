import { useEffect, useRef, useState } from "react";
import QrScanner from 'qr-scanner'
import Modal from "./Modal";

const Scanner = ({ onDecodeEnd, resetTrigger }) => {
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const videoRef = useRef(null);
    const scannerRef = useRef(null);
    const scannedRef = useRef(false); // Tracks if a scan has already been processed to prevent multiple scans
    const [cameras, setCameras] = useState([]); // List of available cameras

    useEffect(() => {
        async function processScan(scanResult) {
            if (scannedRef.current) return; // Prevent double-calling
            scannedRef.current = true;
            await scannerRef.current.stop();
            onDecodeEnd(scanResult.data, scannerRef.current); // calls handleVerify in parent
        }


        QrScanner.listCameras(true).then((camList) => {
            setCameras(camList);
            try {
                scannerRef.current = new QrScanner(videoRef.current, processScan, {
                    highlightScanRegion: true,
                    highlightCodeOutline: false,
                    preferredCamera: localStorage.getItem('preferredCamera') ? localStorage.getItem('preferredCamera') : camList.at(-1).id,
                });
                scannerRef.current.start();
            }catch(err){
                console.error(err);
            }
            
        });

        return () => {
            if (scannerRef.current) {
                scannerRef.current.destroy();
            }
        };
    }, []);

    // Reset scanner when resetTrigger changes
    useEffect(() => {
        scannedRef.current = false;
        if (scannerRef.current) {
            scannerRef.current.start();
        }
    }, [resetTrigger]);

    async function updateCamera(e, cameraId) {
        e.preventDefault();
        localStorage.setItem('preferredCamera', cameraId);
        
        if (scannerRef.current) {
            await scannerRef.current.setCamera(cameraId);
        }
        
        setActiveModal('');
    }

    return <>

        <button onClick={() => setActiveModal({ type: 'selectCamera'})}>Change Camera</button>
        {!cameras.length && <h2>ERROR: No cameras detected on this device</h2>}
        <video ref={videoRef}></video>


        <Modal open={activeModal.type === 'selectCamera'}>
            <form onSubmit={(e) => updateCamera(e, e.target.camera.value)}>
                <label htmlFor="user">Select Camera for Scanning</label>
                <select name="camera" id="camera" required>
                    {cameras.map(camera => (
                        <option key={camera.id} value={camera.id}>
                            {camera.label}
                        </option>
                    ))}
                </select>

                <button className={`actionButton confirmBtn`} type="submit">Confirm</button>
                <button type="button" className='actionButton' onClick={() => setActiveModal('')}>Cancel</button>
            </form>

        </Modal>
    </>;
};

export default Scanner;