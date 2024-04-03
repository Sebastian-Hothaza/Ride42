import { Link } from "react-router-dom";

import r42 from '../assets/ride42.png'
import helmet from '../assets/helmet.png'

const Navbar = () => {
	return (
		<nav className="navbar">
			<ul className="navbar-main">
				<li><Link to="/"><img src={r42} id='headerImg'></img></Link></li>
				<li><Link to="/dates">Dates</Link></li>
				<li><Link to="/rules">Rules</Link></li>
				<li className="selected"><Link to="/faq">FAQ</Link></li>
				<li><Link to="/shop">Shop</Link></li>
			</ul>

			<div className="navbar-dashboard">
				<Link to="/dashboard"><img src={helmet} id='helmetImg'></img></Link>
			</div>
			
		</nav>
	);
};

export default Navbar;
