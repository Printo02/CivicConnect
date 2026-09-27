import React, {
  useEffect,
  useRef,
  useState
} from 'react'

import Styles from '../components/Otp.module.css'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import otpimg from '../assets/OTP-cuate.png'
import api from '../api/apiClient.js'


function Otp() {

  const navigate = useNavigate()

  const [digits, setDigits] = useState([
    '',
    '',
    '',
    '',
    '',
    ''
  ])

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const inputsRef = useRef([])


  /*
   * Email was stored by ForgotPassword.jsx
   */
  const email = sessionStorage.getItem(
    'resetEmail'
  )


  /*
   * User should not directly access /otp
   * without first entering their email.
   */
  useEffect(() => {

    if (!email) {

      window.alert(
        'Please enter your email first.'
      )

      navigate('/forgotpassword', {
        replace: true
      })

    }

  }, [email, navigate])


  const getErrorMessage = (error) => {
    const data = error?.response?.data

    if (typeof data?.detail === 'string') {
      return data.detail
    }

    if (typeof data?.message === 'string') {
      return data.message
    }

    if (data?.otp) {
      return Array.isArray(data.otp)
        ? data.otp[0]
        : data.otp
    }

    return 'OTP verification failed. Please try again.'
  }


  const handleChange = (index, value) => {

    /*
     * Only one number per input
     */
    if (!/^[0-9]?$/.test(value)) {
      return
    }

    const updated = [...digits]

    updated[index] = value

    setDigits(updated)

    /*
     * Automatically move to next OTP box
     */
    if (
      value &&
      index < 5
    ) {

      inputsRef.current[
        index + 1
      ]?.focus()

    }
  }


  const handleKeyDown = (index, e) => {

    if (
      e.key === 'Backspace' &&
      !digits[index] &&
      index > 0
    ) {

      inputsRef.current[
        index - 1
      ]?.focus()

    }
  }


  const handlePaste = (e) => {

    const pasted = (
      e.clipboardData
        .getData('text')
        .trim()
    )

    if (/^\d{6}$/.test(pasted)) {

      setDigits(
        pasted.split('')
      )

      inputsRef.current[5]?.focus()

    }

    e.preventDefault()
  }


  /*
   * VERIFY OTP
   */
  const handleSubmit = async (e) => {

    e.preventDefault()

    const otp = digits.join('')

    if (otp.length !== 6) {

      window.alert(
        'Please enter the complete 6-digit OTP.'
      )

      return
    }

    if (!email) {
      return
    }

    setLoading(true)

    try {

      const response = await api.post(
        '/forgot-password/verify-otp/',
        {
          email,
          otp
        }
      )

      const resetToken =
        response.data?.reset_token

      if (!resetToken) {

        window.alert(
          'OTP verified, but reset token was not received.'
        )

        return
      }

      /*
       * Store token required for final password reset.
       */
      sessionStorage.setItem(
        'resetToken',
        resetToken
      )

      window.alert(
        response.data?.message ||
        'OTP verified successfully.'
      )

      navigate('/changepassword')

    } catch (error) {

      console.error(
        'OTP verification error:',
        error
      )

      window.alert(
        getErrorMessage(error)
      )

    } finally {

      setLoading(false)

    }
  }


  /*
   * RESEND OTP
   */
  const handleResendOTP = async () => {

    if (
      !email ||
      resending ||
      loading
    ) {
      return
    }

    setResending(true)

    try {

      const response = await api.post(
        '/forgot-password/request-otp/',
        {
          email
        }
      )

      /*
       * Old reset token should no longer be used.
       */
      sessionStorage.removeItem(
        'resetToken'
      )

      /*
       * Clear currently entered OTP.
       */
      setDigits([
        '',
        '',
        '',
        '',
        '',
        ''
      ])

      inputsRef.current[0]?.focus()

      window.alert(
        response.data?.message ||
        'A new OTP has been sent.'
      )

    } catch (error) {

      console.error(
        'OTP resend error:',
        error
      )

      window.alert(
        getErrorMessage(error)
      )

    } finally {

      setResending(false)

    }
  }


  return (
    <>
      <NavBar />

      <div className={Styles.page}>

        <div className={Styles.card}>

          <img
            src={otpimg}
            className={Styles.image}
            alt="OTP verification illustration"
          />

          <h3 className={Styles.title}>
            Enter OTP
          </h3>

          <p className={Styles.subtitle}>
            We've sent a 6-digit verification code to your email. Enter it below to continue.
          </p>

          <form
            className={Styles.form}
            onSubmit={handleSubmit}
          >

            <div
              className={Styles.otpRow}
              onPaste={handlePaste}
            >

              {digits.map((digit, i) => (

                <input
                  key={i}
                  ref={(el) =>
                    (
                      inputsRef.current[i] =
                        el
                    )
                  }
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleChange(
                      i,
                      e.target.value
                    )
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(i, e)
                  }
                  className={Styles.otpBox}
                  disabled={loading}
                />

              ))}

            </div>

            <p className={Styles.resendText}>

              Didn't receive the code?{' '}

              <span
                className={Styles.link}
                onClick={handleResendOTP}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {

                  if (
                    e.key === 'Enter' ||
                    e.key === ' '
                  ) {

                    handleResendOTP()

                  }

                }}
              >
                {
                  resending
                    ? 'Sending...'
                    : 'Resend OTP'
                }
              </span>

            </p>

            <input
              type="submit"
              value={
                loading
                  ? 'Verifying...'
                  : 'Verify OTP'
              }
              className={Styles.submitBtn}
              disabled={loading}
            />

            <Link
              to="/forgotpassword"
              className={Styles.backLink}
            >
              Go back
            </Link>

          </form>

        </div>

      </div>
    </>
  )
}

export default Otp