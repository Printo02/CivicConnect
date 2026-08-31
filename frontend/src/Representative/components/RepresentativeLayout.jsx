import React from 'react' 
import { useTheme } from '../../context/ThemeContext'
import Styles from '../components/module.css/RepresentativeLayout.module.css'
import { FaSun, FaMoon } from 'react-icons/fa'
import RepresentativeSidebar from './RepresentativeSidebar';

function RepresentativeLayout({ title, actions, children }) {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <div className={Styles.layout}>
      <RepresentativeSidebar />
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

export default RepresentativeLayout

