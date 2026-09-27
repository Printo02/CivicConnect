import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Styles from '../components/module.css/UserDashboard.module.css'
import { getProfile } from '../../api/services/User/Profile'

import {
  FaFilter,
  FaSlidersH,
  FaDownload,
  FaPlus,
  FaClipboardList,
  FaMapMarkerAlt,
  FaUser,
  FaArrowRight,
  FaClock,
  FaShieldAlt,
  FaBell,
  FaCheckCircle,
  FaRegLightbulb,
} from 'react-icons/fa'

import UserLayout from './../components/UserLayout'


const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}


function UserDashboard() {

  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [now, setNow] = useState(new Date())


  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {

    const fetchProfile = async () => {

      try {

        const data = await getProfile()
        setProfile(data)

      } catch (err) {

        console.error('Failed to load profile:', err)

      } finally {

        setLoadingProfile(false)
      }
    }

    fetchProfile()

  }, [])


  // ============================================================
  // CLOCK
  // ============================================================

  useEffect(() => {

    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(interval)

  }, [])


  // ============================================================
  // DISPLAY VALUES
  // ============================================================

  const greeting = getGreeting(now.getHours())

  const displayName =
    profile?.name ||
    profile?.first_name ||
    (loadingProfile ? '' : 'there')


  const firstLetter =
    displayName && displayName !== 'there'
      ? displayName.charAt(0).toUpperCase()
      : 'U'


  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })


  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })


  // ============================================================
  // HEADER ACTIONS
  // ============================================================

  const actions = (

    <>

      <button
        type="button"
        className={Styles.ghostBtn}
      >
        <FaFilter />

        <span>Filters</span>

        <span className={Styles.countPill}>
          3
        </span>

      </button>


      <button
        type="button"
        className={Styles.ghostBtn}
      >
        <FaSlidersH />
        <span>Customize</span>
      </button>


      <button
        type="button"
        className={Styles.ghostBtn}
      >
        <FaDownload />
        <span>Export</span>
      </button>

    </>

  )


  // ============================================================
  // QUICK ACTIONS
  // Change routes below if your router paths are different
  // ============================================================

  const quickActions = [

    {
      icon: <FaPlus />,
      title: 'File a Complaint',
      description:
        'Report a public issue and send it directly to the responsible authority.',
      button: 'Create complaint',
      primary: true,
      onClick: () => navigate('/user/file-complaint'),
    },

    {
      icon: <FaClipboardList />,
      title: 'My Complaints',
      description:
        'Track complaint progress, authority responses and resolution status.',
      button: 'View complaints',
      onClick: () => navigate('/user/complaint-history'),
    },

    {
      icon: <FaMapMarkerAlt />,
      title: 'Nearby Issues',
      description:
        'Explore public complaints and civic issues reported around your area.',
      button: 'Explore nearby',
      onClick: () => navigate('/user/nearby-complaints'),
    },

  ]


  return (

    <UserLayout
      title="Dashboard"
      actions={actions}
    >

      <div className={Styles.dashboard}>


        {/* ======================================================
            WELCOME SECTION
        ====================================================== */}

        <section className={Styles.welcomeBanner}>

          <div className={Styles.welcomeAccent} />


          <div className={Styles.welcomeContent}>

            <div className={Styles.profileAvatar}>

              {profile?.image ? (

                <img
                  src={profile.image}
                  alt={displayName}
                />

              ) : (

                <span>
                  {firstLetter}
                </span>

              )}

            </div>


            <div className={Styles.welcomeText}>

              <span className={Styles.welcomeEyebrow}>
                CITIZEN DASHBOARD
              </span>

              <h1 className={Styles.welcomeTitle}>
                {greeting}
                {displayName
                  ? `, ${displayName}`
                  : ''}
              </h1>

              <p className={Styles.welcomeSubtitle}>
                Stay connected with your local authorities and
                keep track of the issues that matter to you.
              </p>


              <div className={Styles.dateRow}>

                <span>
                  <FaClock />
                  {formattedDate}
                </span>

                <span className={Styles.statusDot}>
                  <span />
                  Account active
                </span>

              </div>

            </div>

          </div>


          <div className={Styles.clockCard}>

            <span className={Styles.clockLabel}>
              LOCAL TIME
            </span>

            <strong>
              {formattedTime}
            </strong>

            <span className={Styles.clockDate}>
              {now.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>

          </div>

        </section>



        {/* ======================================================
            QUICK ACTION HEADING
        ====================================================== */}

        <section className={Styles.section}>

          <div className={Styles.sectionHeader}>

            <div>

              <span className={Styles.sectionEyebrow}>
                GET STARTED
              </span>

              <h2>
                What would you like to do?
              </h2>

              <p>
                Quickly access the most commonly used CivicConnect
                features.
              </p>

            </div>

          </div>



          {/* ====================================================
              QUICK ACTION CARDS
          ==================================================== */}

          <div className={Styles.actionGrid}>

            {quickActions.map((action) => (

              <article
                className={`${Styles.actionCard} ${
                  action.primary
                    ? Styles.primaryActionCard
                    : ''
                }`}
                key={action.title}
              >

                <div className={Styles.actionIcon}>
                  {action.icon}
                </div>


                <div className={Styles.actionContent}>

                  <h3>
                    {action.title}
                  </h3>

                  <p>
                    {action.description}
                  </p>

                </div>


                <button
                  type="button"
                  className={
                    action.primary
                      ? Styles.primaryBtn
                      : Styles.cardActionBtn
                  }
                  onClick={action.onClick}
                >

                  {action.button}

                  <FaArrowRight />

                </button>

              </article>

            ))}

          </div>

        </section>



        {/* ======================================================
            SECONDARY INFORMATION GRID
        ====================================================== */}

        <section className={Styles.bottomGrid}>


          {/* ACCOUNT CARD */}

          <article className={Styles.infoCard}>

            <div className={Styles.cardHeader}>

              <div className={Styles.headerIcon}>
                <FaUser />
              </div>

              <div>

                <h3>
                  Your account
                </h3>

                <p>
                  Citizen profile information
                </p>

              </div>

            </div>


            <div className={Styles.profileDetails}>

              <div className={Styles.detailRow}>

                <span>
                  Name
                </span>

                <strong>
                  {loadingProfile
                    ? 'Loading...'
                    : displayName}
                </strong>

              </div>


              <div className={Styles.detailRow}>

                <span>
                  Email
                </span>

                <strong>
                  {loadingProfile
                    ? 'Loading...'
                    : profile?.email || 'Not available'}
                </strong>
              </div>


              <div className={Styles.detailRow}>
                <span>Role</span>
                <span className={Styles.roleBadge}>Citizen</span>
              </div>
            </div>
            <button
              type="button"
              className={Styles.textButton}
              onClick={() => navigate('/user/usersetting')}
            >
              Manage profile
              <FaArrowRight />
            </button>

          </article>
        </section>

      </div>

    </UserLayout>

  )
}


export default UserDashboard