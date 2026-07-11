import React, { useRef, useEffect } from 'react'
import NavBar from './NavBar'
import home from '../assets/home.png'
import styles from './Header.module.css'
import aboutimage from '../assets/aboutimage.png'
import waterdept from '../assets/water.jpg'
import wastedept from '../assets/waste.jpg'
import road1dept from '../assets/road1.jpg'
// import road2dept from '../assets/road2.jpg'
import env1dept from '../assets/env1.jpg'
import env3dept from '../assets/env3.jpg'
import electricity1dept from '../assets/electricity1.jpg'
// import electricity2dept from '../assets/electricity2.jpg'
import disastermgmtdept from '../assets/disastermanagement.jpg'
import contactimg from '../assets/contactimg.png'
import { FaEnvelope, FaPhoneAlt } from 'react-icons/fa'

const departments = [
  { img: waterdept, label: 'Water Supply' },
  { img: wastedept, label: 'Waste Management' },
  { img: road1dept, label: 'Roads' },
  // { img: road2dept, label: 'Public Infrastructure' },
  { img: env1dept, label: 'Environment' },
  { img: env3dept, label: 'Sanitation' },
  { img: electricity1dept, label: 'Electricity' },
  { img: disastermgmtdept, label: 'Disaster Management' },
]

function Header() {
  const trackRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const setLoopDistance = () => {
      const halfWidth = track.scrollWidth / 2
      track.style.setProperty('--loop-distance', `-${halfWidth}px`)
    }

    setLoopDistance()
    window.addEventListener('resize', setLoopDistance)
    return () => window.removeEventListener('resize', setLoopDistance)
  }, [])

  return (
    <header className={styles.header}>
      <NavBar />
      <img src={home} className={styles.headerImg}/>
      <h2 className={styles.headerText}>
        Transparent Governance Starts with Citizen Participation.
      </h2>
      <div id='about' className={styles.about}>
        <h1 className={styles.aboutText}>About</h1>
        <div className={styles.aboutcontainer}>
          <img src={aboutimage} className={styles.aboutImg} />
          <p className={styles.aboutTextP}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.  
          </p>
        </div>
      </div>
      <div id='Departments' className={styles.depts}>
        <h1 className={styles.deptstitle}>Departments</h1>
        <div className={styles.deptGrid}>
          <div className={styles.deptTrack} ref={trackRef}>
            {[...departments, ...departments].map((dept, i) => (
              <div className={styles.deptCard} key={i}>
                <img src={dept.img} className={styles.deptImg} alt={dept.label} />
                <span className={styles.deptLabel}>{dept.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div id='contact' className={styles.contact}>
        <div className={styles.contactheader}>
          <img src={contactimg} className={styles.contactimg}/>
          <h1>Hey there,we are here to help !</h1>
        </div>
        <div className={styles.contactinfo}>
          <p>
            At CivicConnect, our mission is to bridge the gap between citizens and local authorities. Whether you need help reporting an issue, tracking a complaint, or have suggestions to improve our platform, we're always ready to assist.
          </p>
          <p>
            For any questions or support, email us at{" "}
            <a href="mailto:info@civicconnect.com"> <FaEnvelope /> info@civicconnect.com</a>
          </p>
          <p>
            You can also reach us by phone at{" "}
            <a href="tel:+919876543210"> <FaPhoneAlt /> +91 98765 43210</a>
          </p>
          <p>
            Thank you for choosing CivicConnect. Together, we can build cleaner, safer, and smarter communities.
          </p>
        </div>
      </div>
    </header>
  )
}

export default Header