import React, { useEffect, useState } from 'react'
import Styles from '../components/module.css/DeptSidebar.module.css'
import { FaHome, FaTachometerAlt, FaUsers, FaClipboardList, FaBuilding, FaChartBar, FaCog, FaHeadset } from 'react-icons/fa'
import { NavLink } from 'react-router-dom'
import ViewUsers from './../../pages/ViewUsers';
import { useNavigate } from "react-router-dom";
import { getProfile } from '../../../api/services/Admin/profileService.js'

const navItems = [
  { icon: <FaHome />, label: 'Home', path: '/' },
  { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/admin/admindashboard' },
  { icon: <FaUsers />, label: 'Representative', path: '/admin/representative' },
  { icon: <FaBuilding />, label: 'Departments', path: '/admin/department' },
  { icon: <FaUsers />, label: 'Users List', path: '/admin/viewusers' },
  { icon: <FaClipboardList />, label: 'Feedback', path: '/admin/feedback' },
  { icon: <FaClipboardList />, label: 'demo', path: '/admin/demo' },
]


function DeptSidebar() {
  const [ Pro, setPro] = useState() 

  useEffect(()=>{
    const fetchProfile = async () =>{
      try {
        const data = await getProfile()
        setPro(data)
      }
      catch (err) {
        console.error('Failed to load profile', err)
      }
    } 
    fetchProfile()}, [])

  const navigate = useNavigate();
  const handleLogout = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRole");
      navigate("/login");
  };

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
          <NavLink to='/admin/adminsetting'>
            <li className={Styles.navItem}>
              <span className={Styles.navIcon}><FaCog /></span>
              Settings
            </li>
          </NavLink>
        </ul>
      </nav>

      <div className={Styles.userCard}>
        {Pro &&
          <div>
              <p className={Styles.userName}>{Pro.name}</p>
              <p className={Styles.userEmail}>{Pro.email}</p>
          </div>
          }
        <span onClick={handleLogout} className={Styles.usercardbtn}>Logout</span>
      </div>
    </aside>
  )
}

export default DeptSidebar