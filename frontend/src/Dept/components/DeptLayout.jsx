import React from 'react'
import DeptSidebar from './DeptSidebar'
import { useTheme } from '../../context/ThemeContext'
import Styles from '../components/module.css/DeptLayout.module.css'

import { FaSun, FaMoon } from 'react-icons/fa'

function DeptLayout({ title, children }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={Styles.layout}>
      <DeptSidebar />
      <div className={Styles.main}>
        <div className={Styles.topRow}>
          <h1 className={Styles.pageTitle}>{title}</h1>
          <button className={Styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default DeptLayout