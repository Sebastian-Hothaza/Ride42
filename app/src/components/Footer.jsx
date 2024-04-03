import { Link, NavLink } from "react-router-dom";
import { useState } from 'react'

import r42_small from '../assets/r42_small.png'

import './stylesheets/footer.css'

const Navbar = () => {

	return (
		<div className="footer">
            <div id="desktop-contact">Contact Us:<br></br> <a href="mailto:info@ride42.ca">info@ride42.ca</a></div>
            <div id="mobile-contact"><a href="mailto:info@ride42.ca">✉</a></div>
            <Link to="/" id="footer-logo"><img src={r42_small} id='headerImg'></img></Link>
            <div>© Sebastian Hothaza</div>
		</div>
	);
};

export default Navbar;
