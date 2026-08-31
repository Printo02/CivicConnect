import React, { useEffect, useState } from 'react'
import Styles from '../components/module.css/UserDashboard.module.css'
import { getProfile } from '../../api/services/User/Profile'
import { FaFilter, FaSlidersH, FaDownload } from 'react-icons/fa'
import UserLayout from './../components/UserLayout'

const getGreeting = (hour) => {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function UserDashboard() {
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [now, setNow] = useState(new Date())

  // Fetch the logged-in user's profile once on mount
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

  // Live clock — updates once a minute, no need for per-second re-renders on a dashboard
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const greeting = getGreeting(now.getHours())
  const displayName = profile?.name || profile?.first_name || (loadingProfile ? '' : 'there')

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

  const actions = (
    <>
      <button className={Styles.ghostBtn}><FaFilter /> Filters <span className={Styles.countPill}>3</span></button>
      <button className={Styles.ghostBtn}><FaSlidersH /> Customize</button>
      <button className={Styles.ghostBtn}><FaDownload /> Export</button>
    </>
  )

  return (
    <UserLayout title="Dashboard" actions={actions}>
      {/* Welcome banner */}
      <div className={Styles.welcomeBanner}>
        <div>
          <h2 className={Styles.welcomeTitle}>
            {greeting}{displayName ? `, ${displayName}` : ''}
          </h2>
          <p className={Styles.welcomeSubtitle}>{formattedDate}</p>
        </div>
        <div className={Styles.welcomeClock}>{formattedTime}</div>
      </div>


    </UserLayout>
  )
}

export default UserDashboard