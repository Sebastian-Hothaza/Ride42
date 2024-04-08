import { Link, NavLink } from "react-router-dom";
import { useState } from 'react'

import r42_small from '../assets/r42_small.png'

import styles from './stylesheets/Footer.module.css'

const Navbar = () => {

      return (
            <div className={styles.footer}>
                  <div id={styles.desktopContact}>Contact Us:<br></br> <a href="mailto:info@ride42.ca">info@ride42.ca</a></div>
                  <div id={styles.mobileContact}><a href="mailto:info@ride42.ca">✉</a></div>
                  <Link to="/" id={styles.footerLogo}><img src={r42_small} id={styles.headerImg}></img></Link>
                  <div>© Sebastian Hothaza</div>
            </div>
      );
};

export default Navbar;
