import React from 'react'
import Styles from './AdminSidebar.module.css'
import {
  FaHome, FaTachometerAlt, FaUsers, FaClipboardList,
  FaBuilding, FaChartBar, FaCog, FaHeadset
} from 'react-icons/fa'
import { NavLink } from 'react-router-dom'
import ViewUsers from './../../pages/ViewUsers';

const navItems = [
  { icon: <FaHome />, label: 'Home', path: '/' },
  { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/admindashboard' },
  { icon: <FaUsers />, label: 'Representative', path: '/representative' },
  { icon: <FaBuilding />, label: 'Departments', path: '/department' },
  { icon: <FaUsers />, label: 'Users List', path: '/ViewUsers' },
  { icon: <FaClipboardList />, label: 'Feedback', path: '/feedback' },
]

function AdminSidebar() {
  return (
    <aside className={Styles.sidebar}>
      <div className={Styles.brand}>
        <div className={Styles.brandIcon}>CC</div>
        <span>CivicConnect Admin</span>
      </div>
      <div className={Styles.search}>
        <input placeholder="Search" />
        <span className={Styles.kbd}>⌘K</span>
      </div>
      <nav>
        <ul className={Styles.navList}>
          {navItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${Styles.navItem} ${isActive ? Styles.active : ''}`
                }>
                <span className={Styles.navIcon}>{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className={Styles.sectionLabel} />
        <ul className={Styles.navList}>
          <NavLink to='/adminsetting'>
            <li className={Styles.navItem}>
              <span className={Styles.navIcon}><FaCog /></span>
              Settings
            </li>
          </NavLink>
        </ul>
      </nav>

      <div className={Styles.userCard}>
        <div className={Styles.avatar}>A</div>
        <div>
          <p className={Styles.userName}>Admin User</p>
          <p className={Styles.userEmail}>admin@civicconnect.com</p>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar