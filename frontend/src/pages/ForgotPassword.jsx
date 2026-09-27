import React, { useState } from 'react'
import Styles from '../components/ForgotPassword.module.css'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Fpimg from '../assets/Forgotpassword-amico.png'
import api from '../api/apiClient.js'


function ForgotPassword() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)


  const getErrorMessage = (error) => {
    const data = error?.response?.data

    if (typeof data?.detail === 'string') {
      return data.detail
    }

    if (typeof data?.message === 'string') {
      return data.message
    }

    if (data?.email) {
      return Array.isArray(data.email)
        ? data.email[0]
        : data.email
    }

    return 'Unable to send OTP. Please try again.'
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      window.alert('Please enter your email.')
      return
    }

    setLoading(true)

    try {

      const response = await api.post(
        '/forgot-password/request-otp/',
        {
          email: normalizedEmail
        }
      )

      /*
        Save email temporarily for OTP verification.
        Also remove any previous reset token.
      */
      sessionStorage.setItem(
        'resetEmail',
        normalizedEmail
      )

      sessionStorage.removeItem('resetToken')

      window.alert(
        response.data?.message ||
        'OTP sent successfully.'
      )

      navigate('/otp')

    } catch (error) {

      console.error(
        'Forgot password OTP error:',
        error
      )

      window.alert(
        getErrorMessage(error)
      )

    } finally {

      setLoading(false)

    }
  }


  return (
    <>
      <NavBar />

      <div className={Styles.page}>
        <div className={Styles.card}>

          <img
            src={Fpimg}
            className={Styles.image}
            alt="Forgot password illustration"
          />

          <h3 className={Styles.title}>
            Forgot Password
          </h3>

          <p className={Styles.subtitle}>
            Enter the email linked to your account and we'll send you a one-time code to reset your password.
          </p>

          <form
            className={Styles.form}
            onSubmit={handleSubmit}
          >

            <label className={Styles.field}>
              <span>Email</span>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                required
              />
            </label>

            <input
              type="submit"
              value={
                loading
                  ? 'Sending...'
                  : 'Send OTP'
              }
              className={Styles.submitBtn}
              disabled={loading}
            />

            <Link
              to="/login"
              className={Styles.backLink}
            >
              Back to login
            </Link>

          </form>

        </div>
      </div>
    </>
  )
}

export default ForgotPassword