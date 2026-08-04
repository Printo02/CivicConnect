import Styles from './Sidebar.module.css'
import {
  FaHome, FaPlusCircle, FaListUl, FaUsers, FaMapMarkerAlt,
  FaThumbsUp, FaEnvelope, FaBell, FaQuestionCircle, FaCommentDots
} from 'react-icons/fa'
import cityIllustration from '../../assets/city-illustration.png'

const mainLinks = [
  { icon: <FaPlusCircle />, label: 'File Complaint' },
  { icon: <FaListUl />, label: 'My Complaints' },
  { icon: <FaUsers />, label: 'Public Issues' },
  { icon: <FaMapMarkerAlt />, label: 'Nearby Issues' },
  { icon: <FaThumbsUp />, label: 'Vote & Support' },
]

const communicationLinks = [
  { icon: <FaEnvelope />, label: 'Messages' },
  { icon: <FaBell />, label: 'Notifications', badge: 3 },
]

const supportLinks = [
  { icon: <FaQuestionCircle />, label: 'Help Center' },
  { icon: <FaCommentDots />, label: 'Feedback' },
]

function Sidebar({ activeItem = 'Dashboard', onNavigate }) {
  const renderLink = (item) => (
    <li
      key={item.label}
      className={`${Styles.navItem} ${activeItem === item.label ? Styles.activeItem : ''}`}
      onClick={() => onNavigate?.(item.label)}
    >
      <span className={Styles.navIcon}>{item.icon}</span>
      <span>{item.label}</span>
      {item.badge && <span className={Styles.badge}>{item.badge}</span>}
    </li>
  )

  return (
    <aside className={Styles.sidebar}>
      <div className={Styles.brand}>
        <div className={Styles.brandIcon}><FaUsers /></div>
        <div>
          <h2 className={Styles.brandName}>CivicConnect</h2>
          <p className={Styles.brandTagline}>Bridging Citizens & Government</p>
        </div>
      </div>

      <nav className={Styles.nav}>
        <ul>
          <li
            className={`${Styles.navItem} ${Styles.dashboardItem} ${activeItem === 'Dashboard' ? Styles.activeItem : ''}`}
            onClick={() => onNavigate?.('Dashboard')}
          >
            <span className={Styles.navIcon}><FaHome /></span>
            <span>Dashboard</span>
          </li>
        </ul>

        <p className={Styles.sectionLabel}>Main</p>
        <ul>{mainLinks.map(renderLink)}</ul>

        <p className={Styles.sectionLabel}>Communication</p>
        <ul>{communicationLinks.map(renderLink)}</ul>

        <p className={Styles.sectionLabel}>Support</p>
        <ul>{supportLinks.map(renderLink)}</ul>
      </nav>

      <div className={Styles.promoCard}>
        <img src={cityIllustration} alt="" className={Styles.promoImg} />
        <h4>Make your city better</h4>
        <p>Report issues, support others, and help us build a better community.</p>
      </div>
    </aside>
  )
}

export default Sidebar