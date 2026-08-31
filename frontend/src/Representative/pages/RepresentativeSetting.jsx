import React, { useState, useEffect } from 'react'
import Styles from '../components/module.css/RepresentativeSetting.module.css'
import { useTheme } from '../../context/ThemeContext.jsx'
import { FaUser, FaPalette, FaLock, FaCamera,FaSun,FaMoon,FaCheck, FaNetworkWired} from 'react-icons/fa'
import { getProfile, updateProfile, getConstituency, changePassword } from '../../api/services/Representative/Profile.js'
import RepresentativeLayout from './../components/RepresentativeLayout'


const TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <FaUser />
  },
  {
    id: 'constituency',
    label: 'Constituency',
    icon: <FaNetworkWired />
  },
  {
    id: 'theme',
    label: 'Theme',
    icon: <FaPalette />
  },
  {
    id: 'password',
    label: 'Password',
    icon: <FaLock />
  }
]


function RepresentativeSetting() {

  const [activeTab, setActiveTab] = useState('profile')

  return (
    <RepresentativeLayout title="Settings">

      <div className={Styles.wrapper}>

        {/* =========================
            TAB MENU
        ========================== */}

        <div className={Styles.tabRail}>

          {TABS.map((tab) => (

            <button
              key={tab.id}
              type="button"
              className={`${Styles.tabBtn} ${
                activeTab === tab.id
                  ? Styles.tabActive
                  : ''
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


        {/* =========================
            TAB CONTENT
        ========================== */}

        <div className={Styles.panel}>

          {activeTab === 'profile' && (
            <ProfileTab />
          )}

          {activeTab === 'constituency' && (
            <ConstituencyTab />
          )}

          {activeTab === 'theme' && (
            <ThemeTab />
          )}

          {activeTab === 'password' && (
            <PasswordTab />
          )}

        </div>

      </div>

    </RepresentativeLayout>
  )
}


/* =====================================================
   PROFILE TAB
===================================================== */

function ProfileTab() {

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    image: null
  })

  const [preview, setPreview] = useState(null)

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [saved, setSaved] = useState(false)

  const [error, setError] = useState('')


  // ============================
  // GET PROFILE
  // ============================

  useEffect(() => {

    const fetchProfile = async () => {

      try {

        const data = await getProfile()

        console.log('Representative profile:', data)

        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          dob: data.dob || '',
          address: data.address || '',
          image: null
        })


        // Existing profile image

        if (data.image) {

          setPreview(
            data.image.startsWith('http')
              ? data.image
              : `http://localhost:8000${data.image}`
          )

        }

      } catch (err) {

        console.error(
          'Failed to load representative profile:',
          err
        )

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


  // ============================
  // INPUT CHANGE
  // ============================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value
    }))

    setSaved(false)
    setError('')

  }


  // ============================
  // IMAGE CHANGE
  // ============================

  const handleImageChange = (e) => {

    const file = e.target.files?.[0]

    if (!file) return


    // Validate image

    if (!file.type.startsWith('image/')) {

      setError('Please select a valid image.')

      return

    }


    // Optional size validation: 5MB

    if (file.size > 5 * 1024 * 1024) {

      setError('Image size must be less than 5MB.')

      return

    }


    setForm((prev) => ({
      ...prev,
      image: file
    }))


    setPreview(
      URL.createObjectURL(file)
    )

    setSaved(false)
    setError('')

  }


  // ============================
  // SUBMIT PROFILE
  // ============================

  const handleSubmit = async (e) => {

    e.preventDefault()

    setSaving(true)
    setSaved(false)
    setError('')


    try {

      const formData = new FormData()

      formData.append(
        'name',
        form.name
      )

      formData.append(
        'phone',
        form.phone
      )

      formData.append(
        'dob',
        form.dob
      )

      formData.append(
        'address',
        form.address
      )


      // Only send image if a new image was selected

      if (form.image instanceof File) {

        formData.append(
          'image',
          form.image
        )

      }


      console.log(
        'Updating representative profile...'
      )


      const data = await updateProfile(formData)

      console.log(
        'Updated profile:',
        data
      )


      // Update local state with response

      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        phone: data.phone || '',
        dob: data.dob || '',
        address: data.address || '',
        image: null
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

      console.error(
        'Failed to update profile:',
        err
      )

      console.error(
        'Backend response:',
        err.response?.data
      )


      const apiErrors =
        err.response?.data || {}


      if (apiErrors.image) {

        setError(
          apiErrors.image[0]
        )

      } else if (apiErrors.name) {

        setError(
          apiErrors.name[0]
        )

      } else if (apiErrors.phone) {

        setError(
          apiErrors.phone[0]
        )

      } else if (apiErrors.dob) {

        setError(
          apiErrors.dob[0]
        )

      } else if (apiErrors.address) {

        setError(
          apiErrors.address[0]
        )

      } else {

        setError(
          apiErrors.detail ||
          'Could not save changes. Please try again.'
        )

      }

    } finally {

      setSaving(false)

    }

  }

  if (loading) {

    return (
      <div className={Styles.form}>
        <p>Loading profile...</p>
      </div>
    )

  }


  return (

    <form
      className={Styles.form}
      onSubmit={handleSubmit}
    >

      <h3 className={Styles.panelTitle}>
        Profile
      </h3>


      <p className={Styles.panelSubtitle}>
        Update your personal details and profile photo.
      </p>


      {/* =========================
          PROFILE IMAGE
      ========================== */}

      <div className={Styles.avatarRow}>

        <div className={Styles.avatarLarge}>

          {preview ? (

            <img
              src={preview}
              alt="Profile"
              className={Styles.avatarImage}
            />

          ) : (

            form.name?.[0]?.toUpperCase() || 'R'

          )}

        </div>


        <div>

          <label
            htmlFor="profileImage"
            className={Styles.uploadBtn}
          >

            <FaCamera />

            Change photo

          </label>


          <input
            id="profileImage"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />


          <p className={Styles.avatarHint}>
            JPG or PNG, maximum 5MB.
          </p>

        </div>

      </div>


      {/* =========================
          FORM FIELDS
      ========================== */}

      <div className={Styles.fieldGrid}>

        {/* Name */}

        <label className={Styles.field}>

          <span>
            Full name
          </span>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
          />

        </label>


        {/* Email - READ ONLY */}

        <label className={Styles.field}>

          <span>
            Email
          </span>

          <input
            type="email"
            name="email"
            value={form.email}
            readOnly
            disabled
          />

        </label>


        {/* Phone */}

        <label className={Styles.field}>

          <span>
            Phone
          </span>

          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            maxLength="10"
          />

        </label>


        {/* Date of Birth */}

        <label className={Styles.field}>

          <span>
            Date of Birth
          </span>

          <input
            type="date"
            name="dob"
            value={form.dob || ''}
            onChange={handleChange}
          />

        </label>


        {/* Address */}

        <label
          className={`${Styles.field} ${Styles.fullWidth}`}
        >

          <span>
            Address
          </span>

          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Enter your address"
            rows="4"
          />

        </label>

      </div>


      {/* =========================
          ERROR
      ========================== */}

      {error && (

        <p className={Styles.errorText}>
          {error}
        </p>

      )}


      {/* =========================
          FOOTER
      ========================== */}

      <div className={Styles.formFooter}>

        {saved && (

          <span className={Styles.savedNote}>

            <FaCheck />

            Saved

          </span>

        )}


        <button
          type="submit"
          className={Styles.primaryBtn}
          disabled={saving}
        >

          {saving
            ? 'Saving...'
            : 'Save changes'
          }

        </button>

      </div>

    </form>

  )
}

/* =====================================================
   CONSTITUENCY TAB
===================================================== */
function ConstituencyTab() {

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    const fetchConstituency = async () => {

      try {

        const response = await getConstituency()

        setData(response)

      } catch (err) {

        console.error(err)

        setError(
          err.response?.data?.detail ||
          'Failed to load constituency details.'
        )

      } finally {

        setLoading(false)

      }

    }

    fetchConstituency()

  }, [])


  if (loading) {
    return (
      <div className={Styles.form}>
        <p>Loading constituency details...</p>
      </div>
    )
  }


  if (error) {
    return (
      <div className={Styles.form}>
        <p className={Styles.errorText}>
          {error}
        </p>
      </div>
    )
  }


  return (
    <div className={Styles.form}>

      <h3 className={Styles.panelTitle}>
        Your Constituency Details
      </h3>

      <p className={Styles.panelSubtitle}>
        You can only view the details.
      </p>


      <div className={Styles.fieldGrid}>

        <label className={Styles.field}>
          <span>Constituency Name</span>

          <input
            type="text"
            value={data?.constituency_name || ''}
            readOnly
            disabled
          />
        </label>


        <label className={Styles.field}>
          <span>Ward No / Name</span>

          <input
            type="text"
            value={data?.ward_name_no || ''}
            readOnly
            disabled
          />
        </label>


        <label className={Styles.field}>
          <span>Govt Type</span>

          <input
            type="text"
            value={data?.constituency_type || ''}
            readOnly
            disabled
          />
        </label>


        <label className={Styles.field}>
          <span>District Name</span>

          <input
            type="text"
            value={data?.district_name || ''}
            readOnly
            disabled
          />
        </label>


        <h4>Your Term</h4>


        <label className={Styles.field}>
          <span>Term Started On</span>

          <input
            type="date"
            value={data?.start_date || ''}
            readOnly
            disabled
          />
        </label>


        <label className={Styles.field}>
          <span>Term Ends On</span>
          <input
            type="date"
            value={data?.end_date || ''}
            readOnly
            disabled
          />
        </label>

      </div>

    </div>
  )
}

/* =====================================================
   THEME TAB
===================================================== */

function ThemeTab() {

  const {
    theme,
    toggleTheme
  } = useTheme()


  return (

    <div className={Styles.form}>

      <h3 className={Styles.panelTitle}>
        Theme
      </h3>

      <p className={Styles.panelSubtitle}>
        Choose how CivicConnect looks on your device.
      </p>


      <div className={Styles.themeOptions}>

        {/* LIGHT */}

        <button
          type="button"
          className={`${Styles.themeCard} ${
            theme === 'light'
              ? Styles.themeCardActive
              : ''
          }`}
          onClick={() => {

            if (theme !== 'light') {
              toggleTheme()
            }

          }}
        >

          <div className={Styles.themePreviewLight}>
            <FaSun />
          </div>

          <span>
            Light
          </span>

        </button>


        {/* DARK */}

        <button
          type="button"
          className={`${Styles.themeCard} ${
            theme === 'dark'
              ? Styles.themeCardActive
              : ''
          }`}
          onClick={() => {

            if (theme !== 'dark') {
              toggleTheme()
            }

          }}
        >

          <div className={Styles.themePreviewDark}>
            <FaMoon />
          </div>

          <span>
            Dark
          </span>

        </button>

      </div>

    </div>

  )
}


/* =====================================================
   PASSWORD TAB
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


  // ============================
  // INPUT CHANGE
  // ============================

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

    setErrors({})
    setSuccess(false)

  }


  // ============================
  // VALIDATION
  // ============================

  const validate = () => {

    const errs = {}


    if (!form.current) {

      errs.current =
        'Enter your current password'

    }


    if (!form.next) {

      errs.next =
        'Enter a new password'

    } else if (form.next.length < 6) {

      errs.next =
        'Password must be at least 6 characters'

    }


    if (!form.confirm) {

      errs.confirm =
        'Confirm your new password'

    } else if (form.confirm !== form.next) {

      errs.confirm =
        'Passwords do not match'

    }


    return errs

  }


  // ============================
  // CHANGE PASSWORD
  // ============================

  const handleSubmit = async (e) => {

    e.preventDefault()


    const errs = validate()

    setErrors(errs)


    if (Object.keys(errs).length > 0) {
      return
    }


    setSubmitting(true)
    setSuccess(false)


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


    } catch (err) {

      console.error(
        'Password update failed:',
        err
      )


      const apiErrors =
        err.response?.data || {}


      setErrors({

        current:
          apiErrors.current_password?.[0] ||
          apiErrors.detail,

        next:
          apiErrors.new_password?.[0],

        confirm:
          apiErrors.confirm_password?.[0]

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

        {/* Current password */}

        <label className={Styles.field}>

          <span>
            Current password
          </span>

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


        {/* New password */}

        <label className={Styles.field}>

          <span>
            New password
          </span>

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


        {/* Confirm password */}

        <label className={Styles.field}>

          <span>
            Confirm new password
          </span>

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


      <div className={Styles.formFooter}>

        {success && (

          <span className={Styles.savedNote}>

            <FaCheck />

            Password updated

          </span>

        )}


        <button
          type="submit"
          className={Styles.primaryBtn}
          disabled={submitting}
        >

          {submitting
            ? 'Updating...'
            : 'Update password'
          }

        </button>

      </div>

    </form>

  )
}


export default RepresentativeSetting

