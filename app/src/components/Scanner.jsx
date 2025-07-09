import { useEffect, useRef } from "react";
import QrScanner from 'qr-scanner'

const Scanner = ({ onDecodeEnd, resetTrigger }) => {
    const videoRef = useRef(null);
    const scannerRef = useRef(null);
    const scannedRef = useRef(false); // Tracks if a scan has already been processed to prevent multiple scans

    useEffect(() => {
        async function processScan(scanResult) {
            if (scannedRef.current) return; // Prevent double-calling
            scannedRef.current = true;
            await scannerRef.current.stop();
            onDecodeEnd(scanResult.data, scannerRef.current); // calls handleVerify in parent
        }

        QrScanner.listCameras(true).then((camList) => {
            scannerRef.current = new QrScanner(videoRef.current, processScan, {
                highlightScanRegion: true,
                highlightCodeOutline: false,
                preferredCamera: camList.at(-1).id,
            });
            scannerRef.current.start();
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

    return <video ref={videoRef}></video>;
};

export default Scanner;