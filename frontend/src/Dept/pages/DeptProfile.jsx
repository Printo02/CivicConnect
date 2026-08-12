import React, { useState , useEffect} from 'react'
import Styles from '../components/module.css/DeptProfile.module.css'
import { useTheme } from '../../context/ThemeContext.jsx'
import { FaUser, FaPalette, FaLock, FaCamera, FaSun, FaMoon, FaCheck } from 'react-icons/fa'
import { getProfile, updateProfile, changePassword } from '../../api/services/Admin/profileService.js'
import DeptLayout from './../components/DeptLayout';

const TABS = [
  { id: 'profile', label: 'Profile', icon: <FaUser /> },
  { id: 'theme', label: 'Theme', icon: <FaPalette /> },
  { id: 'password', label: 'Password', icon: <FaLock /> },
]

function AdminSetting() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <DeptLayout title="Settings">
      <div className={Styles.wrapper}>
        <div className={Styles.tabRail}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${Styles.tabBtn} ${activeTab === tab.id ? Styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span className={Styles.tabIcon}>{tab.icon}</span>
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
    </DeptLayout>
  )
}

function ProfileTab() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile()
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
        })
      } catch (err) {
        console.error('Failed to load profile', err)
        setError('Could not load profile.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateProfile(form)
      setSaved(true)
    } catch (err) {
      console.error('Failed to update profile', err)
      setError('Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading profile...</p>

  return (
    <form className={Styles.form} onSubmit={handleSubmit}>
      <h3 className={Styles.panelTitle}>Profile</h3>
      <p className={Styles.panelSubtitle}>Update your personal details and photo.</p>

      <div className={Styles.avatarRow}>
        <div className={Styles.avatarLarge}>{form.name?.[0]?.toUpperCase() || 'A'}</div>
        <div>
          <button type="button" className={Styles.uploadBtn}>
            <FaCamera /> Change photo
          </button>
          <p className={Styles.avatarHint}>JPG or PNG, at least 200x200px.</p>
        </div>
      </div>

      <div className={Styles.fieldGrid}>
        <label className={Styles.field}>
          <span>Full name</span>
          <input type="text" name="name" value={form.name} onChange={handleChange} />
        </label>

        <label className={Styles.field}>
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} />
        </label>

        <label className={Styles.field}>
          <span>Phone</span>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Add a phone number" />
        </label>

        <label className={Styles.field}>
          <span>Address</span>
          <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Add an address" />
        </label>
      </div>

      {error && <p className={Styles.errorText}>{error}</p>}

      <div className={Styles.formFooter}>
        {saved && <span className={Styles.savedNote}><FaCheck /> Saved</span>}
        <button type="submit" className={Styles.primaryBtn} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function ThemeTab() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={Styles.form}>
      <h3 className={Styles.panelTitle}>Theme</h3>
      <p className={Styles.panelSubtitle}>Choose how CivicConnect Admin looks on your device.</p>

      <div className={Styles.themeOptions}>
        <button
          type="button"
          className={`${Styles.themeCard} ${theme === 'light' ? Styles.themeCardActive : ''}`}
          onClick={() => theme !== 'light' && toggleTheme()}
        >
          <div className={Styles.themePreviewLight}>
            <FaSun />
          </div>
          <span>Light</span>
        </button>

        <button
          type="button"
          className={`${Styles.themeCard} ${theme === 'dark' ? Styles.themeCardActive : ''}`}
          onClick={() => theme !== 'dark' && toggleTheme()}
        >
          <div className={Styles.themePreviewDark}>
            <FaMoon />
          </div>
          <span>Dark</span>
        </button>
      </div>
    </div>
  )
}

function PasswordTab() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  const validate = () => {
    const errs = {}
    if (!form.current) errs.current = 'Enter your current password'
    if (!form.next) {
      errs.next = 'Enter a new password'
    } else if (form.next.length < 6) {
      errs.next = 'Password must be at least 6 characters'
    }
    if (form.confirm !== form.next) errs.confirm = 'Passwords do not match'
    return errs
  }

const [submitting, setSubmitting] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  const errs = validate()
  setErrors(errs)
  if (Object.keys(errs).length > 0) return

  setSubmitting(true)
  try {
    await changePassword(form.current, form.next, form.confirm)
    setSuccess(true)
    setForm({ current: '', next: '', confirm: '' })
  } catch (err) {
    const apiErrors = err.response?.data || {}
    setErrors({
      current: apiErrors.current_password?.[0],
      next: apiErrors.new_password?.[0],
      confirm: apiErrors.confirm_password?.[0],
    })
  } finally {
    setSubmitting(false)
  }
}
  return (
    <form className={Styles.form} onSubmit={handleSubmit} noValidate>
      <h3 className={Styles.panelTitle}>Change password</h3>
      <p className={Styles.panelSubtitle}>Choose a strong password you haven't used elsewhere.</p>

      <div className={Styles.fieldGridSingle}>
        <label className={Styles.field}>
          <span>Current password</span>
          <input
            type="password"
            name="current"
            value={form.current}
            onChange={handleChange}
            className={errors.current ? Styles.inputError : ''}
          />
          {errors.current && <span className={Styles.errorText}>{errors.current}</span>}
        </label>

        <label className={Styles.field}>
          <span>New password</span>
          <input
            type="password"
            name="next"
            value={form.next}
            onChange={handleChange}
            className={errors.next ? Styles.inputError : ''}
          />
          {errors.next && <span className={Styles.errorText}>{errors.next}</span>}
        </label>

        <label className={Styles.field}>
          <span>Confirm new password</span>
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            className={errors.confirm ? Styles.inputError : ''}
          />
          {errors.confirm && <span className={Styles.errorText}>{errors.confirm}</span>}
        </label>
      </div>

      <div className={Styles.formFooter}>
        {success && <span className={Styles.savedNote}><FaCheck /> Password updated</span>}
        <button type="submit" className={Styles.primaryBtn} disabled={submitting}>
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </div>
    </form>
  )
}

export default AdminSetting