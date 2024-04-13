import styles from './stylesheets/Shop.module.css'

import pirelli from '../assets/pirelli.png'
import plus from '../assets/plus.png'
import kyt from '../assets/kyt.png'

const Shop = () => {
	return (
		<div className={styles.content}>

			<a href="https://docs.google.com/forms/d/e/1FAIpQLScMWJdjsgDFigjbJutJtFg7zzrUBpboBkEmTTWQEkjJyWtPPg/viewform?usp=sf_link" target="_blank" className={styles.shopCard}>
				<img src={pirelli} alt="Pirelli Tire Photo" />
				<div>Tires</div>
			</a>
			<a href="https://docs.google.com/forms/d/e/1FAIpQLScGL_Dlr5OdkSkfqasaE85daJwk4oNZ_lyWVmWqHjWWEElHiQ/viewform?usp=sf_link" target="_blank" className={styles.shopCard}>
				<img src={plus} alt="PLUS Racing Gear Suit Photo" />
				<div>Gear</div>
			</a>
			<a href="https://www.eurorace.ca/kyt" target="_blank" className={styles.shopCard}>
				<img src={kyt} alt="KYT Helmet Photo" />
				<div>Helmets</div>
			</a>


		</div>
	);
};

export default Shop;