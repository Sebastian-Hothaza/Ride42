import styles from './stylesheets/Shop.module.css'

import square from '../assets/square.jpg'

const Shop = () => {
	return (
		<div className="content">
			<div className={styles.invertedContent}>
				<a href="http://google.ca" target="_blank" className={styles.shopCard}>
					<img src={square} alt="Pirelli Tire Photo" />
					<div>Tires</div>
				</a>
				<a href="http://google.ca" target="_blank" className={styles.shopCard}>
					<img src={square} alt="PLUS Racing Gear Suit Photo" />
					<div>Gear</div>
				</a>
				<a href="http://google.ca" target="_blank" className={styles.shopCard}>
					<img src={square} alt="KYT Helmet Photo" />
					<div>Helmets</div>
				</a>
			</div>

		</div>
	);
};

export default Shop;