import './stylesheets/shop.css'

import square from '../assets/square.jpg'

const Shop = () => {
	return (
		<div className="main inverted">
			<a href="http://google.ca" target="_blank" className="shopCard">
				<img src={square} alt="Pirelli Tire Photo" />
				<div>Tires</div>
			</a>
			<a href="http://google.ca" target="_blank" className="shopCard">
				<img src={square} alt="PLUS Racing Gear Suit Photo" />
				<div>Gear</div>
			</a>
			<a href="http://google.ca" target="_blank" className="shopCard">
				<img src={square} alt="KYT Helmet Photo" />
				<div>Helmets</div>
			</a>
		</div>
	);
};

export default Shop;