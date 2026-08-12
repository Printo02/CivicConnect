import React from 'react'
import { NavLink } from 'react-router-dom'
import Styles from '../components/module.css/DeptLayout.module.css'
import { FaBuilding, FaClipboardList, FaUsers, FaUser, FaLock, FaHome } from 'react-icons/fa'

const navItems = [
  { icon: <FaHome />, label: 'Home', path: '/dept/deptdashboard' },
  { icon: <FaBuilding />, label: 'Branches', path: '/dept/DeptBranches' },
  { icon: <FaClipboardList />, label: 'Complaints', path: '/dept/complaints' },
  { icon: <FaUsers />, label: 'Employees', path: '/dept/DeptEmployees' },
  { icon: <FaUser />, label: 'Profile', path: '/dept/DeptProfile' }
]

function DeptSidebar() {
  return (
    <aside className={Styles.sidebar}>
      <div className={Styles.brand}>
        <div className={Styles.brandIcon}>CC</div>
        <span>Branch Panel</span>
      </div>

      <nav>
        <ul className={Styles.navList}>
          {navItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `${Styles.navItem} ${isActive ? Styles.active : ''}`}
              >
                <span className={Styles.navIcon}>{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default DeptSidebar