import { Link, NavLink } from "react-router-dom";
import { useState } from 'react'

import r42_small from '../assets/r42_small.png'
import fb from '../assets/fb.webp'
import insta from '../assets/insta.webp'

import styles from './stylesheets/Footer.module.css'

const Navbar = () => {

      return (
            <div className={styles.footer}>
                  <div className={styles.leftItems}>
                        <div id={styles.desktopContact}>Contact Us:<br></br> <a href="mailto:info@ride42.ca">info@ride42.ca</a></div>
                        <div id={styles.mobileContact}><a href="mailto:info@ride42.ca"><span className={`${styles.mobileToolbarIcons} material-symbols-outlined`}>email</span></a></div>
                        <a href="https://www.facebook.com/groups/ride42"><img src={fb} className={styles.footerIcon}></img></a>
                        <a href="https://www.instagram.com/ride42_official"><img src={insta} className={styles.footerIcon}></img></a>
                  </div>




                  <Link to="/" id={styles.footerLogo}><img src={r42_small} id={styles.headerImg}></img></Link>


                  <div id={styles.copyright}>© Sebastian<br></br>Hothaza</div>
            </div>
      );
};

export default Navbar;


//className={`${styles.mobileToolbarIcons} material-symbols-outlined ${activeTab == 'profile' ? styles.selected : undefined}`}> person </span>
