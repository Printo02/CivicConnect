import React, { useEffect, useState } from 'react'
import Styles from '../components/module.css/RepresentativeDashboard.module.css'
import { getProfile } from '../../api/services/Representative/Profile'
import { FaFilter, FaSlidersH, FaDownload, FaMapMarkerAlt, FaUserTie } from 'react-icons/fa'
import RepresentativeLayout from '../components/RepresentativeLayout'

const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function RepresentativeDashboard() {
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [now, setNow] = useState(new Date())

  // Fetch the logged-in representative's profile once on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile()
        setProfile(data)
      } catch (err) {
        console.error('Failed to load profile:', err)
        setProfileError('Could not load your profile. Please refresh the page.')
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  // Live clock — updates once a minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const greeting = getGreeting(now.getHours())
  const displayName = profile?.name || (loadingProfile ? '' : 'there')
  const constituency = profile?.constituency_name || 'Constituency not assigned'

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

  const profileImage = profile?.image
    ? profile.image.startsWith('http')
      ? profile.image
      : `http://localhost:8000${profile.image}`
    : null

  const actions = (
    <>
      <button type="button" className={Styles.ghostBtn}>
        <FaFilter /> Filters <span className={Styles.countPill}>3</span>
      </button>
      <button type="button" className={Styles.ghostBtn}>
        <FaSlidersH /> Customize
      </button>
      <button type="button" className={Styles.ghostBtn}>
        <FaDownload /> Export
      </button>
    </>
  )

  return (
    <RepresentativeLayout title="Dashboard" actions={actions}>
      {/* Welcome banner */}
      <div className={Styles.welcomeBanner}>
        <div>
          <h2 className={Styles.welcomeTitle}>
            {greeting}
            {displayName && `, ${displayName}`}
          </h2>
          <p className={Styles.welcomeSubtitle}>{formattedDate}</p>
          <div className={Styles.constituency}>
            <FaMapMarkerAlt />
            <span>{constituency}</span>
          </div>
        </div>
        <div className={Styles.welcomeClock}>{formattedTime}</div>
      </div>

      {profileError && <p className={Styles.errorText}>{profileError}</p>}

      {loadingProfile ? (
        <div className={Styles.loadingBlock}>
          <p>Loading your dashboard...</p>
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div className={Styles.profileCard}>
            <div className={Styles.profileAvatar}>
              {profileImage ? <img src={profileImage} alt={displayName} /> : <FaUserTie />}
            </div>

            <div className={Styles.profileInfo}>
              <h3>{displayName || 'Representative'}</h3>
              <p>{profile?.email || 'No email available'}</p>
              <span className={Styles.profileRole}>Representative</span>
            </div>
          </div>

          {/* Information cards */}
          <div className={Styles.statsGrid}>
            <div className={Styles.statCard}>
              <span className={Styles.statLabel}>Constituency</span>
              <strong className={Styles.statValue}>{constituency}</strong>
            </div>

            <div className={Styles.statCard}>
              <span className={Styles.statLabel}>Status</span>
              <strong className={Styles.statValue}>
                {profile?.is_current ? 'Active' : 'Inactive'}
              </strong>
            </div>

            <div className={Styles.statCard}>
              <span className={Styles.statLabel}>Start Date</span>
              <strong className={Styles.statValue}>
                {profile?.start_date ? new Date(profile.start_date).toLocaleDateString() : 'Not available'}
              </strong>
            </div>

            <div className={Styles.statCard}>
              <span className={Styles.statLabel}>End Date</span>
              <strong className={Styles.statValue}>
                {profile?.end_date ? new Date(profile.end_date).toLocaleDateString() : 'Not available'}
              </strong>
            </div>
          </div>
        </>
      )}
    </RepresentativeLayout>
  )
}

export default RepresentativeDashboard