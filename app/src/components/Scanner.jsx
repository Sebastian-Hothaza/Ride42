import { useEffect, useRef } from "react";
import QrScanner from 'qr-scanner'

const Scanner = ({ onDecodeEnd }) => {
    const videoRef = useRef(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        console.log('effect called')
        async function processScan(scanResult) {
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
            if (!videoRef.current) {
                scannerRef.current.destroy();
            }
        };
    }, []);

    return <video ref={videoRef}></video>;
};

export default Scanner;