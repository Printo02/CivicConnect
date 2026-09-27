import React from 'react' 
import { useTheme } from '../../context/ThemeContext'
import Styles from '../components/module.css/MywardLayout.module.css'
import { FaSun, FaMoon } from 'react-icons/fa'
import MyWardSidebar from '../components/MyWardSidebar';

function MywardLayout({ title, actions, children }) {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <div className={Styles.layout}>
      <MyWardSidebar/>
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

export default MywardLayout

