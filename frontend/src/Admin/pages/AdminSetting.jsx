import React, { useState } from 'react'
import AdminLayout from '../../Admin/components/dashboard/AdminLayout'
import Styles from './AdminSetting.module.css'
import { useTheme } from '../context/ThemeContext'
import { FaUser, FaPalette, FaLock, FaCamera, FaSun, FaMoon, FaCheck } from 'react-icons/fa'

const TABS = [
  { id: 'profile', label: 'Profile', icon: <FaUser /> },
  { id: 'theme', label: 'Theme', icon: <FaPalette /> },
  { id: 'password', label: 'Password', icon: <FaLock /> },
]

function AdminSetting() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <AdminLayout title="Settings">
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
    </AdminLayout>
  )
}

function ProfileTab() {
  const [form, setForm] = useState({
    name: 'Admin User',
    email: 'admin@civicconnect.com',
    phone: '',
    address: '',
  })
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // hook this up to your PATCH /api/profile/ endpoint
    console.log('Profile update:', form)
    setSaved(true)
  }

  return (
    <form className={Styles.form} onSubmit={handleSubmit}>
      <h3 className={Styles.panelTitle}>Profile</h3>
      <p className={Styles.panelSubtitle}>Update your personal details and photo.</p>

      <div className={Styles.avatarRow}>
        <div className={Styles.avatarLarge}>A</div>
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

      <div className={Styles.formFooter}>
        {saved && <span className={Styles.savedNote}><FaCheck /> Saved</span>}
        <button type="submit" className={Styles.primaryBtn}>Save changes</button>
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      // hook this up to your change-password endpoint
      console.log('Password change submitted')
      setSuccess(true)
      setForm({ current: '', next: '', confirm: '' })
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
        <button type="submit" className={Styles.primaryBtn}>Update password</button>
      </div>
    </form>
  )
}

export default AdminSetting