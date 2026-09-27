import React, {
  useEffect,
  useState
} from 'react'

import Styles from '../components/ChangePassword.module.css'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import chgpwdimg from '../assets/changepassword.jpg'
import {
  FaEye,
  FaEyeSlash
} from 'react-icons/fa'

import api from '../api/apiClient.js'


function ChangePassword() {

  const navigate = useNavigate()

  const [
    showPassword,
    setShowPassword
  ] = useState(false)

  const [
    showConfirm,
    setShowConfirm
  ] = useState(false)

  const [
    password,
    setPassword
  ] = useState('')

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState('')

  const [
    loading,
    setLoading
  ] = useState(false)


  const email = sessionStorage.getItem(
    'resetEmail'
  )

  const resetToken =
    sessionStorage.getItem(
      'resetToken'
    )


  /*
   * Prevent directly opening this page without
   * successful OTP verification.
   */
  useEffect(() => {

    if (
      !email ||
      !resetToken
    ) {

      window.alert(
        'Please verify your OTP first.'
      )

      navigate(
        '/forgotpassword',
        {
          replace: true
        }
      )

    }

  }, [
    email,
    resetToken,
    navigate
  ])


  const getErrorMessage = (error) => {

    const data = error?.response?.data

    if (typeof data?.detail === 'string') {
      return data.detail
    }

    if (typeof data?.message === 'string') {
      return data.message
    }

    if (data?.new_password) {

      return Array.isArray(
        data.new_password
      )
        ? data.new_password.join('\n')
        : data.new_password

    }

    if (data?.confirm_password) {

      return Array.isArray(
        data.confirm_password
      )
        ? data.confirm_password[0]
        : data.confirm_password

    }

    if (data?.reset_token) {

      return Array.isArray(
        data.reset_token
      )
        ? data.reset_token[0]
        : data.reset_token

    }

    return 'Unable to reset password. Please try again.'
  }


  const handleSubmit = async (e) => {

    e.preventDefault()

    if (!password) {

      window.alert(
        'Please enter a new password.'
      )

      return
    }

    if (!confirmPassword) {

      window.alert(
        'Please confirm your new password.'
      )

      return
    }

    if (
      password !== confirmPassword
    ) {

      window.alert(
        'Passwords do not match.'
      )

      return
    }

    if (
      !email ||
      !resetToken
    ) {

      window.alert(
        'Password reset session has expired. Please request a new OTP.'
      )

      navigate('/forgotpassword')

      return
    }


    setLoading(true)

    try {

      const response = await api.post(
        '/forgot-password/reset/',
        {
          email: email,
          reset_token: resetToken,
          new_password: password,
          confirm_password: confirmPassword
        }
      )

      /*
       * Password reset is complete.
       * Remove temporary reset information.
       */
      sessionStorage.removeItem(
        'resetEmail'
      )

      sessionStorage.removeItem(
        'resetToken'
      )

      window.alert(
        response.data?.message ||
        'Password reset successfully.'
      )

      navigate(
        '/login',
        {
          replace: true
        }
      )

    } catch (error) {

      console.error(
        'Password reset error:',
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
            src={chgpwdimg}
            className={Styles.image}
            alt="Change password illustration"
          />

          <h3 className={Styles.title}>
            Change Password
          </h3>

          <p className={Styles.subtitle}>
            Choose a new password for your account. Make sure it's something secure you haven't used before.
          </p>

          <form
            className={Styles.form}
            onSubmit={handleSubmit}
          >

            <label className={Styles.field}>

              <span>
                New password
              </span>

              <div
                className={
                  Styles.passwordWrapper
                }
              >

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  name="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className={Styles.eyeBtn}
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {
                    showPassword
                      ? <FaEyeSlash />
                      : <FaEye />
                  }

                </button>

              </div>

            </label>


            <label className={Styles.field}>

              <span>
                Confirm password
              </span>

              <div
                className={
                  Styles.passwordWrapper
                }
              >

                <input
                  type={
                    showConfirm
                      ? 'text'
                      : 'password'
                  }
                  name="cpassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className={Styles.eyeBtn}
                  onClick={() =>
                    setShowConfirm(
                      !showConfirm
                    )
                  }
                  aria-label={
                    showConfirm
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {
                    showConfirm
                      ? <FaEyeSlash />
                      : <FaEye />
                  }

                </button>

              </div>

            </label>


            <input
              type="submit"
              value={
                loading
                  ? 'Changing...'
                  : 'Confirm'
              }
              className={
                Styles.submitBtn
              }
              disabled={loading}
            />

            <Link
              to="/login"
              className={
                Styles.backLink
              }
            >
              Go back
            </Link>

          </form>

        </div>

      </div>
    </>
  )
}

export default ChangePassword