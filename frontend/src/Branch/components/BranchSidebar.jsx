import React, { useEffect, useState } from 'react'
import Styles from '../components/module.css/BranchSidebar.module.css'

import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaBullhorn,
  FaChevronDown,
  FaChevronRight,
  FaListAlt,
  FaSpeakap,
  FaArrowAltCircleRight,
} from 'react-icons/fa'

import { FaPersonMilitaryPointing, FaSpeakerDeck, FaTriangleExclamation } from 'react-icons/fa6'

import {
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  getProfile,
} from '../../api/services/Branch/Profile.js'


const navItems = [
  {
    icon: <FaHome />,
    label: 'Home',
    path: '2',
  },

  {
    icon: <FaTachometerAlt />,
    label: 'Dashboard',
    path: '/branch/branchdashboard',
  },

  {
    icon: <FaUsers />,
    label: 'Employees',
    path: '/branch/addemployee',
  },

  {
    icon: <FaClipboardList />,
    label: 'Complaints',
    path: '/branch/complaints',
  },

  {
    icon: <FaTriangleExclamation />,
    label: 'Disaster Reports',
    path: '/branch/disaster-reports/',
  },
  {
    icon: <FaArrowAltCircleRight />,
    label: 'Alerts',
    path: '/branch/alerts/',
  },
]


function BranchSidebar() {

  const [profile, setProfile] =
    useState(null)

  const [publishOpen, setPublishOpen] =
    useState(false)

  const navigate = useNavigate()
  const location = useLocation()


  /* ============================================================
     AUTO OPEN PUBLISH DROPDOWN
  ============================================================ */

  const isPublishSection =
    location.pathname.startsWith('/branch/update') ||
    location.pathname.startsWith('/branchemployee/employee-Ward-post') ||
    location.pathname.startsWith('/branch/mypost-updates') 


  useEffect(() => {

    if (isPublishSection) {
      setPublishOpen(true)
    }

  }, [isPublishSection])


  /* ============================================================
     PROFILE
  ============================================================ */

  useEffect(() => {
    const fetchProfile =
      async () => {
        try {
          const data =
            await getProfile()
          setProfile(data)
        } catch (err) {
          console.error('Failed to load profile',err)
        }
      }
    fetchProfile()
  }, [])


  /* LOGOUT */

  const handleLogout = () => {

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userRole')
    navigate('/login')

  }


  return (

    <aside className={Styles.sidebar}>

      {/* ======================================================
          BRAND
      ====================================================== */}

      <div className={Styles.brand}>

        <div className={Styles.brandIcon}>
          CC
        </div>

        <span>
          CivicConnect
        </span>

      </div>


      <div className={Styles.search} />


      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <nav>

        <ul className={Styles.navList}>

          {navItems.map((item) => (

            <li key={item.label}>

              <NavLink
                to={item.path}
                className={({
                  isActive,
                }) =>
                  `${Styles.navItem} ${
                    isActive
                      ? Styles.active
                      : ''
                  }`
                }
              >

                <span
                  className={
                    Styles.navIcon
                  }
                >
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>

              </NavLink>

            </li>

          ))}


          {/* ==================================================
              PUBLISH UPDATE DROPDOWN
          ================================================== */}

          <li
            className={
              Styles.dropdownContainer
            }
          >

            <div
              className={`${Styles.navItem} ${
                isPublishSection
                  ? Styles.active
                  : ''
              }`}
            >

              {/* Publish page */}

              <NavLink
                to="/branch/update/"
                className={
                  Styles.dropdownMainLink
                }
              >

                <span
                  className={
                    Styles.navIcon
                  }
                >
                  <FaBullhorn />
                </span>

                <span>
                  Publish Update
                </span>

              </NavLink>


              {/* Toggle */}

              <button
                type="button"
                className={
                  Styles.dropdownToggle
                }
                onClick={() =>
                  setPublishOpen(
                    (current) =>
                      !current
                  )
                }
                aria-label="Toggle publish update menu"
                aria-expanded={
                  publishOpen
                }
              >

                {publishOpen
                  ? <FaChevronDown />
                  : <FaChevronRight />
                }

              </button>

            </div>


            {/* ================================================
                DROPDOWN ITEMS
            ================================================ */}

            {publishOpen && (

              <ul
                className={
                  Styles.dropdownMenu
                }
              >

                <li>

                  <NavLink
                    to="/branch/employee-post-approve/"
                    className={({
                      isActive,
                    }) =>
                      `${Styles.dropdownItem} ${
                        isActive
                          ? Styles.dropdownActive
                          : ''
                      }`
                    }
                  >

                    <span
                      className={
                        Styles.dropdownIcon
                      }
                    >
                      <FaPersonMilitaryPointing />
                    </span>

                    <span>
                      Employee post request
                    </span>

                  </NavLink>

                </li>
                <li>

                  <NavLink
                    to="/branch/mypost-updates/"
                    className={({
                      isActive,
                    }) =>
                      `${Styles.dropdownItem} ${
                        isActive
                          ? Styles.dropdownActive
                          : ''
                      }`
                    }
                  >

                    <span
                      className={
                        Styles.dropdownIcon
                      }
                    >
                      <FaListAlt />
                    </span>

                    <span>
                      My Post
                    </span>

                  </NavLink>

                </li>

              </ul>

            )}

          </li>

        </ul>


        <p
          className={
            Styles.sectionLabel
          }
        />


        {/* ==================================================
            SETTINGS
        ================================================== */}

        <ul className={Styles.navList}>

          <li>

            <NavLink
              to="/branch/branchsettings"
              className={({
                isActive,
              }) =>
                `${Styles.navItem} ${
                  isActive
                    ? Styles.active
                    : ''
                }`
              }
            >

              <span
                className={
                  Styles.navIcon
                }
              >
                <FaCog />
              </span>

              Settings

            </NavLink>

          </li>

        </ul>

      </nav>


      {/* ======================================================
          USER
      ====================================================== */}

      <div className={Styles.userCard}>

        {profile && (

          <div>

            <p
              className={
                Styles.userName
              }
            >
              {profile.name}
            </p>

            <p
              className={
                Styles.userEmail
              }
            >
              {profile.email}
            </p>

          </div>

        )}


        <span
          onClick={handleLogout}
          className={
            Styles.usercardbtn
          }
          title="Logout"
        >
          <FaSignOutAlt />

          Logout
        </span>

      </div>

    </aside>

  )
}


export default BranchSidebar