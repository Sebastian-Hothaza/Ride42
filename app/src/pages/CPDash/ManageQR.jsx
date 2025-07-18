import { useEffect, useState, useRef } from "react";
import ScrollToTop from "../../components/ScrollToTop";
import Modal from "../../components/Modal";
import Loading from '../../components/Loading';
import Scanner from '../../components/Scanner';
import styles from './stylesheets/ManageQR.module.css';
import modalStyles from '../../components/stylesheets/Modal.module.css';
import checkmark from './../../assets/checkmark.png';
import errormark from './../../assets/error.png';
import QRCode from 'qrcode';
import r42_small from '../../assets/R42_sticker.png';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ManageQR = ({ APIServer, allUsers, allTrackdaysFULL, fetchAPIData, }) => {
    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown
    const [b64Arr, setb64Arr] = useState([]);

    const [curUserDelete, setCurUserDelete] = useState('')
    const [curQRDelete, setCurQRDelete] = useState('')

    const [curUserAssign, setCurUserAssign] = useState('')
    const [curBikeAssign, setCurBikeAssign] = useState('')

    const [selectedTrackdayId, setSelectedTrackdayId] = useState(''); // Tracks what the current working trackdayId is 
    const selectedTrackdayRef = useRef(null); // Ref to keep track of the latest selectedTrackday

    const [hasQRID, setHasQRID] = useState(true);


    if (!allUsers || !allTrackdaysFULL) {
        return null;
    } else {
        allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))

        // Only show trackdays for current year
        allTrackdaysFULL = allTrackdaysFULL.filter(trackday => {
            const candidateTrackdayYear = new Date(trackday.date).getFullYear();
            const selectedYear = new Date().getFullYear();
            return candidateTrackdayYear === selectedYear;
        });
        allTrackdaysFULL.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0))
    }

    // Augment prettydate of allTrackdaysFULL to be a nice format
    allTrackdaysFULL.forEach((trackday) => {
        const date = new Date(trackday.date)
        const weekday = date.toLocaleString('default', { weekday: 'short' })
        const month = date.toLocaleString('default', { month: 'long' })
        const numericDay = date.toLocaleString('default', { day: 'numeric' })
        const formattedDate = weekday + ' ' + month + ' ' + numericDay;
        trackday.prettyDate = formattedDate;
    })

    // Set the ref
    if (selectedTrackdayId && selectedTrackdayId !== 'all') { // Once we have defined a specific trackday to use
        selectedTrackdayRef.current = allTrackdaysFULL.find((td) => td._id === selectedTrackdayId); // Update the ref with the latest selectedTrackday
        allUsers = allUsers.filter((user) => {
            return selectedTrackdayRef.current.members.some((member) => member.user._id === user._id);
        });
    } else if (allTrackdaysFULL && selectedTrackdayId !== 'all') {  // Load in the selectedTrackday to default value 
        const lateAllowance = 12 * 60 * 60 * 1000; // Time in ms that a trackday will still be considered the next trackday AFTER it has already passed. Default is 12H
        // Remove trackdays in the past
        const upcomingTrackdays = allTrackdaysFULL.filter((trackday) => {
            return new Date(trackday.date).getTime() + lateAllowance >= Date.now(); // Trackday is in the future
        });
        if (upcomingTrackdays.length === 0) return console.error('no more TD'); // Protect against no trackdays

        upcomingTrackdays.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
        setSelectedTrackdayId(upcomingTrackdays[0]._id); // This prompts render and sets ref
    }

   

    async function handleGenerateQRSubmit(e) {
        e.preventDefault();
        setb64Arr([]);
        const totalQR = Number(e.target.greenQR.value) + Number(e.target.yellowQR.value) + Number(e.target.redQR.value)
        let greenBal = Number(e.target.greenQR.value);
        let yellowBal = Number(e.target.yellowQR.value);
        let redBal = Number(e.target.redQR.value);



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
                    const b64 = await generateQR('https://Ride42.ca/QR/' + item.id);
                    if (greenBal) {
                        setb64Arr(prev => [...prev, { id: item.id, img: b64, group: '#00ff00' }])
                        greenBal--;
                    } else if (yellowBal) {
                        setb64Arr(prev => [...prev, { id: item.id, img: b64, group: '#ffee00' }])
                        yellowBal--;
                    } else if (redBal) {
                        setb64Arr(prev => [...prev, { id: item.id, img: b64, group: '#ff0000' }])
                        redBal--;
                    }

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
        e.target.reset();
    }

    async function generateQR(text) {
        try {
            const b64 = await QRCode.toDataURL(text, { errorCorrectionLevel: 'L' });
            return b64;
        } catch (err) {
            console.error(err);
        }
    }

    // Called when stickerContainer has children
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


    async function handleDeleteQR(e) {
        e.preventDefault();
        setActiveModal({ type: 'loading', msg: 'Deleting QR' }); // Show loading modal
        try {
            const response = await fetch(APIServer + 'QR/' + e.target.qrid.value, {
                method: 'DELETE',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
            })
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'QR Deleted' });
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

    // Returns the QRID of a bike if it exists, otherwise returns empty and notifies user that selected user/bike does not have a QRID
    function getQRID(garageItem) {
        if (garageItem.QRID) {
            setHasQRID(true);
            return garageItem.QRID;
        } else {
            setHasQRID(false);
            return '';
        }

    }

    //router.put('/QR/:QRID/:userID/:bikeID', userController.marryQR)
    async function handleMarryQR(scanData, scanner) {
        const QRID = scanData.replace("https://Ride42.ca/QR/", "")
        setActiveModal({ type: 'loading', msg: 'Verifying user' }); // Show loading modal
        try {
            const response = await fetch(APIServer + 'QR/' + QRID + '/' + curUserAssign._id + '/' + curBikeAssign._id, {
                method: 'PUT',
                credentials: "include",
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                }
            })
            if (response.ok) {
                setActiveModal({ type: 'success', msg: 'QR Assigned' });
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


    // Download images once they are available
    useEffect(() => {
        const container = document.getElementById('stickerContainer');
        if (container && container.hasChildNodes()) downloadAllImages();
    }, [b64Arr]);



    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>

                {/* ASSIGN QR */}

                {selectedTrackdayRef.current &&
                    <div className={styles.QRCell}>
                        <h2>Assign QR</h2>
                        <form>
                            {/* Select trackday filter*/}

                            <label htmlFor="trackdayFilter">Trackday Filter:</label>
                            <select name="trackday" id="trackday" value={selectedTrackdayId} onChange={() => setSelectedTrackdayId(trackday.value)} required>
                                <option key="none" value='all'>ALL</option>
                                {allTrackdaysFULL.map((trackday) => <option key={trackday._id} value={trackday._id}>{trackday.prettyDate}</option>)}
                            </select>


                            {/* Select curUserAssign */}
                            <label htmlFor="userAssign">Select User:</label>
                            <select className='capitalizeEach' name="userAssign" id="userAssign" onChange={() => { setCurUserAssign(allUsers.find((candidateUser) => candidateUser._id === userAssign.value)); setCurBikeAssign('') }} required>
                                <option key="none" value='none' ></option>
                                {allUsers && allUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id} >{user.firstName}, {user.lastName}</option>)}
                            </select>

                            {curUserAssign &&
                                <>
                                    <label htmlFor="bikeAssign">Select Bike:</label>
                                    <select className='capitalizeEach' name="bikeAssign" id="bikeAssign" onChange={() => { setCurBikeAssign(bikeAssign.value ? (curUserAssign.garage.find((garageItem) => garageItem._id === bikeAssign.value)).bike : '') }} required>
                                        <option key="none" value='' ></option>
                                        {curUserAssign && curUserAssign.garage.map((garageItem) => <option className='capitalizeEach' key={garageItem._id} value={garageItem._id}>{garageItem.bike.year} {garageItem.bike.make} {garageItem.bike.model}</option>)}
                                    </select>
                                </>
                            }

                            {curBikeAssign &&
                                <>
                                    <div>Scan {curUserAssign.group} sticker below:</div>
                                    <Scanner onDecodeEnd={handleMarryQR} />
                                </>
                            }
                        </form>
                    </div>
                }

                {/* GENERATE DECALS */}
                <div className={styles.QRCell}>
                    <h2>Generate Decals</h2>
                    <form onSubmit={(e) => handleGenerateQRSubmit(e)}>
                        <label htmlFor="greenQR">Green QR Codes:</label>
                        <input type="number" id="greenQR" name="greenQR" ></input>
                        <label htmlFor="yellowQR">Yellow QR Codes:</label>
                        <input type="number" id="yellowQR" name="yellowQR" ></input>
                        <label htmlFor="redQR">Red QR Codes:</label>
                        <input type="number" id="redQR" name="redQR" ></input>
                        <button className='actionButton confirmBtn' type="submit">Generate QRs</button>
                    </form>
                </div>

                {/* DELETE QR CODES */}
                <div className={styles.QRCell}>
                    <h2>Delete QR Code</h2>
                    <form onSubmit={(e) => handleDeleteQR(e)}>

                        <label htmlFor="userDelete">Select User:</label>
                        <select className='capitalizeEach' name="userDelete" id="userDelete" onChange={() => { setCurUserDelete(allUsers.find((candidateUser) => candidateUser._id === userDelete.value)) }}>
                            <option key="none" value=''></option>
                            {allUsers && allUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id} >{user.firstName}, {user.lastName}</option>)}
                        </select>

                        {curUserDelete &&
                            <>
                                <label htmlFor="bikeDelete">Select Bike:</label>
                                <select className='capitalizeEach' name="bikeDelete" id="bikeDelete" onChange={() => { setCurQRDelete(bikeDelete.value ? getQRID(curUserDelete.garage.find((garageItem) => garageItem._id === bikeDelete.value)) : '') }}>
                                    <option key="none" value=''></option>
                                    {curUserDelete && curUserDelete.garage.map((garageItem) => <option className='capitalizeEach' key={garageItem._id} value={garageItem._id}>{garageItem.bike.year} {garageItem.bike.make} {garageItem.bike.model}</option>)}
                                </select>
                            </>
                        }

                        {!hasQRID &&
                            <div style={{ color: 'red', textAlign: 'center' }}><strong>- NO QRID EXISTS -</strong></div>
                        }

                        <label htmlFor="qrid">QR id to delete:</label>
                        <input type="text" autoComplete="off" name="qrid" id="qrid" onChange={() => { setCurQRDelete(qrid.value) }} value={curQRDelete} required></input>
                        <button className='actionButton confirmBtn' type="submit">Delete</button>

                    </form>
                </div>



                {/* CONTENT END */}
            </div>

            {b64Arr &&
                <div id='stickerContainer' className={styles.stickerContainer}>
                    {b64Arr.map((item) => (
                        <div className={styles.sticker} key={item.id} id={item.id} style={{ backgroundColor: item.group }}>
                            <img src={item.img} alt="QR code"></img>
                            <img className={styles.logo} src={r42_small} alt="R42 sticker"></img>
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

export default ManageQR;
