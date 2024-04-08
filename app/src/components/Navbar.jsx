import { Link, NavLink } from "react-router-dom";
import { useState } from 'react'

import r42 from '../assets/ride42.png'
import r42_small from '../assets/r42_small.png'
import helmet from '../assets/helmet.png'

import styles from './stylesheets/Navbar.module.css'

const Navbar = () => {
	const [expandedMenu, setExpandedMenu] = useState(false)

	return (
		<>
		<nav className={styles.navbar}>
			{/* DESKTOP */}
			<ul className={styles.navbarMain}>
				<Link to="/"><img src={r42} id={styles.headerImg}></img></Link>
				<NavLink to="/dates">Dates</NavLink>
				<NavLink to="/rules">Rules</NavLink>
				<NavLink to="/faq">FAQ</NavLink>
				<NavLink to="/shop">Shop</NavLink>
			</ul>
			<div className={styles.navbarDashboard}>
				<NavLink to="/dashboard"><img src={helmet} id={styles.helmetImg}></img></NavLink>
			</div>
			{/* MOBILE */}
			<ul className={styles.navbarMainMobile}>
				<li className={styles.menuButton} onClick={() => setExpandedMenu(!expandedMenu)}>
					<span className={styles.bar}></span>
					<span className={styles.bar}></span>
					<span className={styles.bar}></span>
				</li>
				<Link to="/"><img src={r42_small} id={styles.headerImg}></img></Link>
				<Link to="/dashboard" className={styles.navbarDashboardMobile}><img src={helmet} id={styles.helmetImg}></img></Link>
			</ul>
			
		</nav>
		{expandedMenu &&
			<ul className={styles.menuButtonLinks} >
				<Link reloadDocument to="/">Home</Link>
				<Link reloadDocument to="/dates">Dates</Link>
				<Link reloadDocument to="/rules">Rules</Link>
				<Link reloadDocument to="/faq">FAQ</Link>
				<Link reloadDocument to="/shop">Shop</Link>
			</ul>
		}
		</>
	);
};

export default Navbar;