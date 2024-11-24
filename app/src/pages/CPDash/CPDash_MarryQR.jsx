import { useState } from "react";
import ScrollToTop from "../../components/ScrollToTop";

import styles from './stylesheets/CPDash_MarryQR.module.css'




const MarryQR = ({ allUsers }) => {
    if (!allUsers) {
        return null;
    } else {
        allUsers.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0))
    }

    const [curUser, setCurUser] = useState(allUsers[0])

    return (
        <>
            <ScrollToTop />
            <div className={styles.content}>
                <h1>Assign QR</h1>
                <form>
                    <select className='capitalizeEach' name="user" id="user" required onChange={() => setCurUser(allUsers.find((candidateUser) => candidateUser._id === user.value))}>
                        {allUsers.map((user) => <option className='capitalizeEach' key={user._id} value={user._id}>{user.firstName}, {user.lastName}</option>)}
                    </select>
                </form>
                

            </div>
        </>
    );
};

export default MarryQR;