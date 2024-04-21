import { useEffect, useRef } from "react";
import QrScanner from 'qr-scanner'

const Scanner = ({ setScanData, scannerActive }) => {
    const videoRef = useRef(null);
    const scanner = useRef(null);

    if (scanner.current && scannerActive) scanner.current.start(); // This is what allows parent to restart scanner

    useEffect(() => {
        const initScanner = async () => {
            const camList = await QrScanner.listCameras(true);
            scanner.current = new QrScanner(
                videoRef.current,
                processScan,
                {
                    highlightScanRegion: true,
                    highlightCodeOutline: false,
                    preferredCamera: camList[camList.length - 1].id,
                },
            );
            scanner.current.start();
        }
        initScanner();

        return () => {
            if (!videoRef.current){
                scanner.current.destroy()
            }
        }
    }, [])

    async function processScan(scan) {
        scanner.current.stop(); 
        setScanData(scan.data);
    }
    return (
        <video ref={videoRef}></video>
    );
};

export default Scanner;