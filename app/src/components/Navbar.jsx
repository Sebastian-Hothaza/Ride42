import { Link, NavLink } from "react-router-dom";
import { useState } from 'react'

import r42 from '../assets/ride42.png'
import r42_small from '../assets/r42_small.png'
import helmet from '../assets/helmet.png'

const Navbar = () => {
	const [expandedMenu, setExpandedMenu] = useState(false)

	return (
		<nav className="navbar">
			{/* DESKTOP */}
			<ul className="navbar-main">
				<NavLink to="/"><img src={r42} id='headerImg'></img></NavLink>
				<NavLink to="/dates">Dates</NavLink>
				<NavLink to="/rules">Rules</NavLink>
				<NavLink to="/faq">FAQ</NavLink>
				<NavLink to="/shop">Shop</NavLink>
			</ul>
			<div className="navbar-dashboard">
				<NavLink to="/dashboard"><img src={helmet} id='helmetImg'></img></NavLink>
			</div>

			{/* MOBILE */}
			<ul className="navbar-mobile">
				<li className="menu-button" onClick={()=>setExpandedMenu(!expandedMenu)}>
					<span className="bar"></span>
					<span className="bar"></span>
					<span className="bar"></span>
				</li>
				<Link to="/"><img src={r42_small} id='headerImg'></img></Link>
				<Link to="/dashboard"><img src={helmet} id='helmetImg'></img></Link>
			</ul>
			{ expandedMenu &&
				<ul className="menu-button-links" >
				<Link to="/dates">Dates</Link>
				<Link to="/rules">Rules</Link>
				<Link to="/faq">FAQ</Link>
				<Link to="/shop">Shop</Link>
				</ul>
			}

		</nav>
	);
};

export default Navbar;
