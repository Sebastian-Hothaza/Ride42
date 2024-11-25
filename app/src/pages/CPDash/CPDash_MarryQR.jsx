import { useState, useEffect } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import styles from './stylesheets/CPDash_MarryQR.module.css'


const MarryQR = ({ allUsers, APIServer, fetchAPIData, }) => {


    const [activeModal, setActiveModal] = useState(''); // Tracks what modal should be shown

    const [curUser, setCurUser] = useState('')
    const [curBike, setCurBike] = useState('')

    if (!allUsers) {
        return null;
    } else {
        allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
    }


    async function handleMarryQR(e) {
        e.preventDefault();
        console.log('marry QR called')
    }



    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Assign QR</h1>
                <form onSubmit={(e) => handleMarryQR(e)}>

                    {/* Select curUser */}
                    <div className={styles.inputPairing}>
                        <label htmlFor="user">Select User:</label>
                        <select className='capitalizeEach' name="user" id="user" onChange={() => { setCurUser(allUsers.find((candidateUser) => candidateUser._id === user.value)) }} required>
                            <option key="none" value=""></option>
                            {allUsers && allUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id} >{user.firstName}, {user.lastName}</option>)}
                        </select>
                    </div>

                    {curUser &&
                        <div className={styles.inputPairing}>
                            <label htmlFor="bike">Select Bike:</label>
                            <select className='capitalizeEach' name="bike" id="bike" onChange={() => { setCurBike(curUser.garage.find((garageItem) => garageItem._id === bike.value)) }} required>
                                <option key="none" value=""></option>
                                {curUser && curUser.garage.map((garageItem) => <option className='capitalizeEach' key={garageItem._id} value={garageItem._id}>{garageItem.bike.year} {garageItem.bike.make} {garageItem.bike.model}</option>)}
                            </select>
                        </div>
                    }

                    {curBike &&
                        <>
                            <div className='capitalizeEach'>Group: {curUser.group}</div>
                            <div>QR SCANNER HERE</div>
                        </>

                    }



                </form>


            </div>
        </>
    );
};

export default MarryQR;