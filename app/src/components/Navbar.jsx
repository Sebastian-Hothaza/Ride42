import { Link } from "react-router-dom";

import r42 from '../assets/ride42.png'
import r42_small from '../assets/r42_small.png'
import helmet from '../assets/helmet.png'

const Navbar = () => {
	return (
		<nav className="navbar">
			{/* DESKTOP */}
			<ul className="navbar-main">
				<li><Link to="/"><img src={r42} id='headerImg'></img></Link></li>
				<li><Link to="/dates">Dates</Link></li>
				<li><Link to="/rules">Rules</Link></li>
				<li><Link to="/faq">FAQ</Link></li>
				<li><Link to="/shop">Shop</Link></li>
			</ul>
			<div className="navbar-dashboard">
				<Link to="/dashboard"><img src={helmet} id='helmetImg'></img></Link>
			</div>

			{/* MOBILE */}
			<ul className="navbar-mobile">
				<li className="menu-button">
					<span className="bar"></span>
					<span className="bar"></span>
					<span className="bar"></span>
				</li>
				<li><Link to="/"><img src={r42_small} id='headerImg'></img></Link></li>
				<li><Link to="/dashboard"><img src={helmet} id='helmetImg'></img></Link></li>
			</ul>
			<ul className="menu-button-links">

				<li><Link to="/dates">Dates</Link></li>
				<li><Link to="/rules">Rules</Link></li>
				<li><Link to="/faq">FAQ</Link></li>
				<li><Link to="/shop">Shop</Link></li>
			</ul>

		</nav>
	);
};

export default Navbar;
