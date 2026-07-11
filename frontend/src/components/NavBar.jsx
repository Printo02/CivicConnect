import React from 'react'
import { Link } from 'react-router-dom'
import styles from './NavBar.module.css';
import logo from '../assets/logo.png'

function NavBar(){
  return (
      <nav className={styles.navbar}>
        <div className={styles.navbarHeader}>
          <Link to="/">
            <img src={logo} alt="logo" className={styles.logo}/>
            <h3 className={styles.logotext}>CivicConnect</h3>
          </Link>
        </div>
        <div className={styles.navbarLinks}>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>
      </nav>
  )
}

export default NavBar