import React, { useEffect, useState } from 'react'
import Styles from '../components/module.css/UserSetting.module.css'
import { useTheme } from '../../context/ThemeContext.jsx'
import { 
  FaUser,
  FaPalette,
  FaLock,
  FaCamera,
  FaSun,
  FaMoon,
  FaCheck
} from 'react-icons/fa'

import {
  getProfile,
  updateProfile,
  changePassword
} from '../../api/services/User/Profile.js'

import UserLayout from './../components/UserLayout'


const TABS = [
  { id: 'profile', label: 'Profile', icon: <FaUser /> },
  { id: 'theme', label: 'Theme', icon: <FaPalette /> },
  { id: 'password', label: 'Password', icon: <FaLock /> },
]


function UserSetting() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <UserLayout title="Settings">

      <div className={Styles.wrapper}>

        <div className={Styles.tabRail}>

          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${Styles.tabBtn} ${
                activeTab === tab.id ? Styles.tabActive : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={Styles.tabIcon}>
                {tab.icon}
              </span>

              {tab.label}
            </button>
          ))}

        </div>


        <div className={Styles.panel}>
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'theme' && <ThemeTab />}
          {activeTab === 'password' && <PasswordTab />}
        </div>
      </div>
    </UserLayout>
  )
}


/* =====================================================
   PROFILE
===================================================== */
function ProfileTab() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    image: null,
  })

  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  /* ---------------- GET PROFILE ---------------- */

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile()

        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          dob: data.dob || '',
          address: data.address || '',
          image: null,
        })

        if (data.image) {
          setPreview(
            data.image.startsWith('http')
              ? data.image
              : `http://localhost:8000${data.image}`
          )
        }
      } catch (err) {
        console.error('Failed to load profile', err)
        setError(err.response?.data?.detail || 'Could not load profile.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  /* ---------------- TEXT INPUT ---------------- */

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  /* ---------------- IMAGE ---------------- */

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate image type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG images are allowed.')
      e.target.value = '' // FIX: allow re-selecting the same rejected file
      return
    }

    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.')
      e.target.value = '' // FIX: same as above
      return
    }

    setForm((prev) => ({ ...prev, image: file }))

    // FIX: release the previous preview URL before creating a new one, to avoid leaking memory
    setPreview((prevUrl) => {
      if (prevUrl && prevUrl.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrl)
      }
      return URL.createObjectURL(file)
    })

    setSaved(false)
    setError('')
  }

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const formData = new FormData()

      formData.append('name', form.name)
      formData.append('address', form.address)

      if (form.phone) {
        formData.append('phone', form.phone)
      }
      if (form.dob) {
        formData.append('dob', form.dob)
      }

      if (form.image) {
        formData.append('image', form.image)
      }

      const data = await updateProfile(formData)

      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || '',
        dob: data.dob || '',
        address: data.address || '',
        image: null,
      }))

      if (data.image) {
        setPreview(
          data.image.startsWith('http')
            ? data.image
            : `http://localhost:8000${data.image}`
        )
      }

      setSaved(true)
    } catch (err) {
      console.error('Failed to update profile', err)

      const apiErrors = err.response?.data || {}

      setError(
        apiErrors.detail ||
        apiErrors.name?.[0] ||
        apiErrors.phone?.[0] ||
        apiErrors.dob?.[0] ||
        apiErrors.address?.[0] ||
        apiErrors.image?.[0] ||
        'Could not save changes. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Loading profile...</p>
  }

  return (
    <form className={Styles.form} onSubmit={handleSubmit}>
      <h3 className={Styles.panelTitle}>Profile</h3>
      <p className={Styles.panelSubtitle}>Update your personal details and profile photo.</p>

      {/* ================= AVATAR ================= */}
      <div className={Styles.avatarRow}>
        <div className={Styles.avatarLarge}>
          {preview ? (
            <img src={preview} alt="Profile" className={Styles.avatarImage} />
          ) : (
            form.name?.[0]?.toUpperCase() || 'A'
          )}
        </div>

        <div>
          <label htmlFor="profileImage" className={Styles.uploadBtn}>
            <FaCamera />
            Change photo
          </label>

          <input
            id="profileImage"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageChange}
            hidden
          />

          <p className={Styles.avatarHint}>JPG or PNG, maximum 5MB.</p>
        </div>
      </div>

      {/* ================= FORM FIELDS ================= */}
      <div className={Styles.fieldGrid}>
        <label className={Styles.field}>
          <span>Full name</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
        </label>

        <label className={Styles.field}>
          <span>Email</span>
          <input type="email" name="email" value={form.email} disabled />
        </label>

        <label className={Styles.field}>
          <span>Phone</span>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            maxLength="10"
          />
        </label>

        <label className={Styles.field}>
          <span>Date of birth</span>
          <input type="date" name="dob" value={form.dob} onChange={handleChange} />
        </label>

        <label className={Styles.field}>
          <span>Address</span>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Enter your address"
            rows="3"
          />
        </label>
      </div>

      {/* ================= ERROR ================= */}
      {error && <p className={Styles.errorText}>{error}</p>}

      {/* ================= FOOTER ================= */}
      <div className={Styles.formFooter}>
        {saved && (
          <span className={Styles.savedNote}>
            <FaCheck />
            Saved
          </span>
        )}

        <button type="submit" className={Styles.primaryBtn} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}


export default UserSetting