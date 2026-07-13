import React, { useRef, useState } from 'react'
import Styles from '../components/Otp.module.css';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import otpimg from '../assets/OTP-cuate.png'

function Otp() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputsRef = useRef([])

  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return // only allow a single digit

    const updated = [...digits]
    updated[index] = value
    setDigits(updated)

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pasted)) {
      setDigits(pasted.split(''))
      inputsRef.current[5]?.focus()
    }
    e.preventDefault()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const otp = digits.join('')
    console.log('OTP submitted:', otp)
  }

  return (
    <>
      <NavBar />
      <div className={Styles.page}>
        <div className={Styles.card}>
          <img src={otpimg} className={Styles.image} alt="OTP verification illustration" />

          <h3 className={Styles.title}>Enter OTP</h3>
          <p className={Styles.subtitle}>
            We've sent a 6-digit verification code to your email. Enter it below to continue.
          </p>

          <form className={Styles.form} onSubmit={handleSubmit}>
            <div className={Styles.otpRow} onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={Styles.otpBox}
                />
              ))}
            </div>

            <p className={Styles.resendText}>
              Didn't receive the code? <span className={Styles.link}>Resend OTP</span>
            </p>

            <input type="submit" value="Verify OTP" className={Styles.submitBtn} />
            <Link to="/forgotpassword" className={Styles.backLink}>Go back</Link>
          </form>
        </div>
      </div>
    </>
  )
}

export default Otp