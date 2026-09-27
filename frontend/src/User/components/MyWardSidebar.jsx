import { NavLink } from 'react-router-dom'
import { FaHouse, FaBell, FaBullhorn, FaClipboardList, FaTriangleExclamation, FaBuilding } from 'react-icons/fa6'
import Styles from '../components/module.css/MyWardSidebar.module.css'
import { FaArrowAltCircleRight } from 'react-icons/fa'

const items = [
  ['/user/userdashboard', 'Home', <FaHouse />],
  ['/user/myward', 'My Ward', <FaBuilding />],
  ['/user/myward/alerts', 'Alerts', <FaBell />],
  ['/user/myward/updates', 'Updates', <FaBullhorn />],
  ['/user/myward/report-disaster', 'Report Disaster', <FaTriangleExclamation />],

]

export default function MyWardSidebar() {
  return (
    <aside className={Styles.sidebar}>
      <div className={Styles.title}>My Ward</div>
      <nav className={Styles.nav}>
        {items.map(([to, label, icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/user/myward'}
            className={({isActive}) => `${Styles.link} ${isActive ? Styles.active : ''}`}
          >
            {icon}<span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
