import styles from './stylesheets/CPDash_ViewQR.module.css'
import ScrollToTop from "../../components/ScrollToTop";
import { useState } from "react";


const ViewQR = ({ allUsers }) => {
    const [curUser, setCurUser] = useState(allUsers[0])

    if (allUsers) allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>View QR</h1>
                <form>
                    <select className='capitalizeEach' name="user" id="user" required onChange={()=>setCurUser(allUsers.find((candidateUser) => candidateUser._id === user.value))}>
                        {allUsers && allUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
                    </select>
                </form>
                {
                    curUser &&

                    <div className={styles.allBikes}>
                        <>
                            {curUser.garage.map((garageItem) => (
                                <div key={garageItem.bike._id} className={styles.bikeEntry}>
                                    <h2 className='capitalizeEach' >{garageItem.bike.year} {garageItem.bike.make} <span className='capitalizeAll'>{garageItem.bike.model}</span></h2>
                                    <img src={garageItem.qr}></img>
                                </div>
                            ))}
                        </>
                    </div>
                }
            </div>
        </>
    );
};

export default ViewQR;