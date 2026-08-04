import React from 'react'
import Styles from './TopBar.module.css'
import { FaSearch, FaGlobe, FaBell } from 'react-icons/fa'

function TopBar({ user = { name: 'Anjali P.', role: 'Citizen', avatar: null }, notificationCount = 0 }) {
  return (
    <header className={Styles.topbar}>
      <div className={Styles.searchWrapper}>
        <FaSearch className={Styles.searchIcon} />
        <input
          type="text"
          placeholder="Search complaints, issues, departments..."
          className={Styles.searchInput}
        />
      </div>

      <div className={Styles.actions}>
        <button className={Styles.langBtn} type="button">
          <FaGlobe /> English
        </button>

        <button className={Styles.iconBtn} type="button" aria-label="Notifications">
          <FaBell />
          {notificationCount > 0 && <span className={Styles.notifDot}>{notificationCount}</span>}
        </button>

        <div className={Styles.userBlock}>
          <div className={Styles.userText}>
            <span className={Styles.userName}>{user.name}</span>
            <span className={Styles.userRole}>{user.role}</span>
          </div>
          <div className={Styles.avatar}>
            {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name?.[0]}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar