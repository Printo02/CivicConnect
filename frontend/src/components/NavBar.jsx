import React from 'react'
import { Link } from 'react-router-dom'
import styles from './NavBar.module.css';
import logo from '../assets/logo.png'

function NavBar(){
  return (
      <nav className={styles.navbar}> 
        <div className={styles.navbarHeader}>
          <img src={logo} alt="logo" height="52px" width="50px" className={styles.logo}/>
          <h3 className={styles.logotext}>CivicConnect</h3>
        </div>
        <div className={styles.navbarLinks}>
          <ul>
            <li> <Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>
      </nav>
  )
}

export default NavBar