import styles from './stylesheets/CPDash_ViewQR.module.css'
import ScrollToTop from "../../components/ScrollToTop";
import { useState } from "react";
import html2canvas from 'html2canvas'

import r42_small from '../../assets/R42_sticker.png'


const ViewQR = ({ allUsers }) => {
    const [curUser, setCurUser] = useState(allUsers[0])

    if (allUsers) allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))



    async function downloadImage(user, garageItem) {
        const canvas = await html2canvas(document.getElementById(garageItem._id), { onclone: (doc) => doc.getElementById('stickerContainer').style.display = 'block' })
        const image = canvas.toDataURL("image/png", 1.0);
        const link = window.document.createElement('a');
        link.download = `${user.firstName}_${garageItem.bike.model}`
        link.href = image
        link.click();
    }

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>View QR</h1>
                <form>
                    <select className='capitalizeEach' name="user" id="user" required onChange={() => setCurUser(allUsers.find((candidateUser) => candidateUser._id === user.value))}>
                        {allUsers && allUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
                    </select>
                </form>
                {
                    curUser &&
                    <>
                        <div className={styles.allBikes}>
                            <>
                                {curUser.garage.map((garageItem) => (
                                    <div key={garageItem.bike._id}>
                                        <div className={styles.bikeEntry}>
                                            <h2 className='capitalizeEach' >{garageItem.bike.year} {garageItem.bike.make} <span className='capitalizeAll'>{garageItem.bike.model}</span></h2>
                                            <img src={garageItem.qr}></img>
                                            <button key={garageItem._id} onClick={() => downloadImage(curUser, garageItem)}>Download Sticker</button>
                                        </div>
                                        
                                    </div>
                                ))}
                            </>
                        </div>

                        {/* STICKERS - not displayed */}
                        <div id='stickerContainer' className={styles.stickerContainer}>
                            {curUser.garage.map((garageItem) => (
                                <div className={styles.sticker} key={garageItem.bike._id} id={garageItem._id}>
                                    <img src={garageItem.qr}></img>
                                    <img src={r42_small}></img>
                                    <div className={styles.groupSticker}>GROUP</div>
                                </div>
                            ))}
                        </div>
                    </>
                }

            </div>
        </>
    );
};

export default ViewQR;


