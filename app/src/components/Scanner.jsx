import { useEffect, useRef } from "react";
import QrScanner from 'qr-scanner'

const Scanner = ({ setScanData, refreshScanner, setRefreshScanner }) => {
    const videoRef = useRef(null);
    const scanner = useRef(null)

    if (refreshScanner){
        scanner.current.start()
        setRefreshScanner(false);
    }

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
        // setTimeout(() => scanner.current.start(), 1500)
    }
    return (
        <video ref={videoRef}></video>
    );
};

export default Scanner;