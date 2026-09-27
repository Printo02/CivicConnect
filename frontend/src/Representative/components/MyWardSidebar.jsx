import { NavLink } from 'react-router-dom'
import { FaHouse, FaBullhorn, FaTriangleExclamation, FaList } from 'react-icons/fa6'
import Styles from './MyWardSidebar.module.css'

const items = [
  ['/representative/representativedashboard', 'Home', <FaHouse />],
  ['/representative/myward/create', 'Publish Update', <FaBullhorn />],
  ['/representative/myward/disasters', 'Disaster Reports', <FaTriangleExclamation />],
  ['/representative/myward/posts', 'My Posts', <FaList />],
  ['/representative/myward/posts', 'My Posts', <FaList />],
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
            end={to === '/representative/myward'}
            className={({isActive}) => `${Styles.link} ${isActive ? Styles.active : ''}`}
          >
            {icon}<span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
