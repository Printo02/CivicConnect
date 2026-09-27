import { useEffect, useState } from 'react'
import Styles from '../components/module.css/RepresentativeSidebar.module.css'
import { FaHome, FaTachometerAlt, FaUsers, FaClipboardList, FaBuilding,FaCog, FaSignOutAlt, FaBullhorn, FaList, FaArrowAltCircleRight, FaUniversity } from 'react-icons/fa'
import { NavLink } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import { getProfile } from '../../api/services/Representative/Profile.js' 
import { FaTriangleExclamation } from 'react-icons/fa6';

const navItems = [
  // { icon: <FaHome />, label: 'Home', path: '/representative/representativedashboard' },
  { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/representative/representativedashboard' },
  { icon: <FaBullhorn />, label: 'Publish Update', path: '/representative/myward/create' },
  { icon: <FaList />, label: 'My post', path: '/representative/myward/alerts' },
  { icon: <FaArrowAltCircleRight />, label: 'Alerts', path: '/representative/view-alerts' },
  { icon: <FaTriangleExclamation />, label: 'Disaster Reports', path: '/representative/myward/disasters' },
  { icon: <FaClipboardList />, label: 'Complaints', path: '/representative/complaints/' },
  { icon: <FaUniversity />, label: 'Nearby Govt Auths.', path: '1' },

]

function RepresentativeSidebar() {
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
        <span>CivicConnect</span>
      </div>
      <div className={Styles.search}>
        {/* <input placeholder="Search" />
        <span className={Styles.kbd}>⌘K</span> */}
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
          <NavLink to='/representative/representativesettings'>
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
        <span onClick={handleLogout} className={Styles.usercardbtn}title='logout'><FaSignOutAlt/> Logout</span>

      </div>
    </aside>
  )
}

export default RepresentativeSidebar