import styles from './stylesheets/Shop.module.css'

import pirelli from '../assets/pirelli.png'
import plus from '../assets/plus.png'
import kyt from '../assets/kyt.png'

const Shop = () => {
	const loggedInUser = JSON.parse(localStorage.getItem("user"))


	let firstName, lastName, email, tireURL, gearURL, helmetURL;
	try{
		firstName = loggedInUser.firstName.charAt(0).toUpperCase() + loggedInUser.firstName.slice(1);
		lastName = loggedInUser.lastName.charAt(0).toUpperCase() + loggedInUser.lastName.slice(1);
		email = loggedInUser.email;

		tireURL = `https://docs.google.com/forms/d/e/1FAIpQLSedERHrr-2ouj_Hn6JomVSXdawlV1wKG7t2F4ZrLKqpxELFhQ/viewform?usp=pp_url&entry.2139803447=${firstName}&entry.1577286330=${lastName}&entry.955192668=${email}`;
		gearURL = "https://docs.google.com/forms/d/e/1FAIpQLScGL_Dlr5OdkSkfqasaE85daJwk4oNZ_lyWVmWqHjWWEElHiQ/viewform?usp=sf_link";
		helmetURL = `https://docs.google.com/forms/d/e/1FAIpQLSd36rEVj5fDhajftdxEJZo5JvITdleA2hyyzlk5wEWRKuKn8w/viewform?usp=dialog&entry.138391781=${firstName}&entry.1628435625=${lastName}&entry.211925348=${email}`;
	}catch(error){
		tireURL = "https://docs.google.com/forms/d/e/1FAIpQLSedERHrr-2ouj_Hn6JomVSXdawlV1wKG7t2F4ZrLKqpxELFhQ/viewform?usp=sf_link";
		gearURL = "https://docs.google.com/forms/d/e/1FAIpQLScGL_Dlr5OdkSkfqasaE85daJwk4oNZ_lyWVmWqHjWWEElHiQ/viewform?usp=sf_link";
		helmetURL = "https://docs.google.com/forms/d/e/1FAIpQLSd36rEVj5fDhajftdxEJZo5JvITdleA2hyyzlk5wEWRKuKn8w/viewform?usp=dialog";
	}

	return (
		<div className={styles.content}>

			<a href={tireURL} target="_blank" className={styles.shopCard}>
				<img src={pirelli} alt="Pirelli Tire Photo" />
				<div>Tires</div>
			</a>
			<a href={gearURL} target="_blank" className={styles.shopCard}>
				<img src={plus} alt="PLUS Racing Gear Suit Photo" />
				<div>Gear</div>
			</a>
			<a href={helmetURL} target="_blank" className={styles.shopCard}>
				<img src={kyt} alt="KYT Helmet Photo" />
				<div>Helmets</div>
			</a>


		</div>
	);
};

export default Shop;