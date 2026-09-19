import React, { useEffect, useState } from 'react'
import Styles from '../components/module.css/BranchEmployeeSetting.module.css'
import { useTheme } from '../../context/ThemeContext.jsx'
import {FaUser,FaPalette,FaLock,FaSun,FaMoon,FaCheck,FaBuilding,FaMapMarkerAlt} from 'react-icons/fa'
import {
  getProfile,
  updateProfile,
  changePassword
} from '../../api/services/BranchEmployee/Profile.js'
import BranchEmployeeLayout from '../components/BranchEmployeeLayout'

const TABS = [
  { id: 'profile', label: 'Profile', icon: <FaUser /> },
  { id: 'theme', label: 'Theme', icon: <FaPalette /> },
  { id: 'password', label: 'Password', icon: <FaLock /> },
]

function BranchEmployeeSetting() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <BranchEmployeeLayout title="Settings">
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
    </BranchEmployeeLayout>
  )
}

/* =====================================================
   PROFILE
===================================================== */
function ProfileTab() {
  const [form, setForm] = useState({
    name: '',
    dob: '',
  })

  const [readOnly, setReadOnly] = useState({
    email: '',
    branch_name: '',
    department_name: '',
    branch_location: '',
  })

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
          dob: data.dob || '',
        })

        setReadOnly({
          email: data.email || '',
          branch_name: data.branch_name || '',
          department_name: data.department_name || '',
          branch_location: data.branch_location || '',
        })
      } catch (err) {
        console.error('Failed to load profile', err)

        setError(
          err.response?.data?.detail ||
          'Could not load profile.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setSaved(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const data = await updateProfile({
        name: form.name,
        dob: form.dob,
      })

      setForm({
        name: data.name || form.name,
        dob: data.dob || form.dob,
      })

      setSaved(true)
    } catch (err) {
      console.error('Failed to update profile', err)

      const apiErrors = err.response?.data || {}

      setError(
        apiErrors.detail ||
        apiErrors.name?.[0] ||
        apiErrors.dob?.[0] ||
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

      <p className={Styles.panelSubtitle}>
        Your branch details and account information.
      </p>

      <div className={Styles.avatarRow}>
        <div className={Styles.avatarLarge}>
          {form.name?.[0]?.toUpperCase() || 'E'}
        </div>

        <div>
          <p className={Styles.readOnlyName}>
            {form.name || 'Employee'}
          </p>
        </div>
      </div>

      <div className={Styles.fieldGrid}>

        {/* FULL NAME */}
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

        {/* EMAIL */}
        <label className={Styles.field}>
          <span>Email</span>

          <input
            type="email"
            value={readOnly.email}
            disabled
          />
        </label>

        {/* DOB */}
        <label className={Styles.field}>
          <span>DOB</span>

          <input
            type="date"
            name="dob"
            value={form.dob || ''}
            onChange={handleChange}
          />
        </label>

      </div>

      {/* BRANCH INFORMATION */}
      <div className={Styles.branchInfoBox}>
        <h4 className={Styles.branchInfoTitle}>
          Branch assignment
        </h4>

        <div className={Styles.branchInfoRow}>
          <FaMapMarkerAlt className={Styles.branchInfoIcon} />

          <div>
            <span>Branch</span>

            <strong>
              {readOnly.branch_location || '—'}
            </strong>
          </div>
        </div>

        <div className={Styles.branchInfoRow}>
          <FaBuilding className={Styles.branchInfoIcon} />

          <div>
            <span>Department</span>

            <strong>
              {readOnly.department_name || '—'}
            </strong>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <p className={Styles.errorText}>
          {error}
        </p>
      )}

      {/* FOOTER */}
      <div className={Styles.formFooter}>
        {saved && (
          <span className={Styles.savedNote}>
            <FaCheck /> Saved
          </span>
        )}

        <button
          type="submit"
          className={Styles.primaryBtn}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

/* =====================================================
   THEME
===================================================== */
function ThemeTab() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={Styles.form}>
      <h3 className={Styles.panelTitle}>Theme</h3>

      <p className={Styles.panelSubtitle}>
        Choose how CivicConnect looks on your device.
      </p>

      <div className={Styles.themeOptions}>

        <button
          type="button"
          className={`${Styles.themeCard} ${
            theme === 'light'
              ? Styles.themeCardActive
              : ''
          }`}
          onClick={() =>
            theme !== 'light' && toggleTheme()
          }
        >
          <div className={Styles.themePreviewLight}>
            <FaSun />
          </div>

          <span>Light</span>
        </button>

        <button
          type="button"
          className={`${Styles.themeCard} ${
            theme === 'dark'
              ? Styles.themeCardActive
              : ''
          }`}
          onClick={() =>
            theme !== 'dark' && toggleTheme()
          }
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

/* =====================================================
   PASSWORD
===================================================== */
function PasswordTab() {
  const [form, setForm] = useState({
    current: '',
    next: '',
    confirm: ''
  })

  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

    setSuccess(false)
    setErrors({})
  }

  const validate = () => {
    const errs = {}

    if (!form.current) {
      errs.current = 'Enter your current password'
    }

    if (!form.next) {
      errs.next = 'Enter a new password'
    } else if (form.next.length < 6) {
      errs.next = 'Password must be at least 6 characters'
    }

    if (!form.confirm) {
      errs.confirm = 'Confirm your new password'
    } else if (form.confirm !== form.next) {
      errs.confirm = 'Passwords do not match'
    }

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errs = validate()

    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      await changePassword(
        form.current,
        form.next,
        form.confirm
      )

      setSuccess(true)

      setForm({
        current: '',
        next: '',
        confirm: ''
      })

      setErrors({})
    } catch (err) {
      console.error('Password change failed', err)

      const apiErrors = err.response?.data || {}

      setErrors({
        current: apiErrors.current_password?.[0],
        next: apiErrors.new_password?.[0],
        confirm: apiErrors.confirm_password?.[0],
        general: apiErrors.detail,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      className={Styles.form}
      onSubmit={handleSubmit}
      noValidate
    >
      <h3 className={Styles.panelTitle}>
        Change password
      </h3>

      <p className={Styles.panelSubtitle}>
        Choose a strong password you haven't used elsewhere.
      </p>

      <div className={Styles.fieldGridSingle}>

        {/* CURRENT PASSWORD */}
        <label className={Styles.field}>
          <span>Current password</span>

          <input
            type="password"
            name="current"
            value={form.current}
            onChange={handleChange}
            className={
              errors.current
                ? Styles.inputError
                : ''
            }
          />

          {errors.current && (
            <span className={Styles.errorText}>
              {errors.current}
            </span>
          )}
        </label>

        {/* NEW PASSWORD */}
        <label className={Styles.field}>
          <span>New password</span>

          <input
            type="password"
            name="next"
            value={form.next}
            onChange={handleChange}
            className={
              errors.next
                ? Styles.inputError
                : ''
            }
          />

          {errors.next && (
            <span className={Styles.errorText}>
              {errors.next}
            </span>
          )}
        </label>

        {/* CONFIRM PASSWORD */}
        <label className={Styles.field}>
          <span>Confirm new password</span>

          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            className={
              errors.confirm
                ? Styles.inputError
                : ''
            }
          />

          {errors.confirm && (
            <span className={Styles.errorText}>
              {errors.confirm}
            </span>
          )}
        </label>

      </div>

      {errors.general && (
        <p className={Styles.errorText}>
          {errors.general}
        </p>
      )}

      <div className={Styles.formFooter}>

        {success && (
          <span className={Styles.savedNote}>
            <FaCheck /> Password updated
          </span>
        )}

        <button
          type="submit"
          className={Styles.primaryBtn}
          disabled={submitting}
        >
          {submitting
            ? 'Updating...'
            : 'Update password'}
        </button>

      </div>
    </form>
  )
}

export default BranchEmployeeSetting