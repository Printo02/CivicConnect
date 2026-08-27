import React from 'react' 
import { useTheme } from '../../context/ThemeContext'
import Styles from '../components/module.css/UserLayout.module.css'
import { FaSun, FaMoon } from 'react-icons/fa'
import UserSidebar from './UserSidebar';

function UserLayout({ title, actions, children }) {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <div className={Styles.layout}>
      <UserSidebar />

      <div className={Styles.main}>
        <div className={Styles.topRow}>
          <h1 className={Styles.pageTitle}>{title}</h1>
          <div className={Styles.topActions}>
            {actions}
            <button className={Styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

export default UserLayout

