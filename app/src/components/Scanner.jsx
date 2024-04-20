import { useEffect, useRef } from "react";
import QrScanner from 'qr-scanner'

const Scanner = ({ setScanData, refreshScanner }) => {
    const videoRef = useRef(null);
    const scanner = useRef(null)

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

    // Watch the parent refreshScanner state to know when it is time to scan again
    useEffect(()=>{
        if (scanner.current) scanner.current.start();
    }, [refreshScanner])

    async function processScan(scan) {
        scanner.current.stop(); 
        setScanData(scan.data);
    }
    return (
        <video ref={videoRef}></video>
    );
};

export default Scanner;