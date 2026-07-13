import React, { useState } from 'react'
import Styles from '../components/ChangePassword.module.css';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import chgpwdimg from '../assets/changepassword.jpg'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

function ChangePassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <NavBar />
      <div className={Styles.page}>
        <div className={Styles.card}>
          <img src={chgpwdimg} className={Styles.image} alt="Change password illustration" />

          <h3 className={Styles.title}>Change Password</h3>
          <p className={Styles.subtitle}>
            Choose a new password for your account. Make sure it's something secure you haven't used before.
          </p>

          <form className={Styles.form}>
            <label className={Styles.field}>
              <span>New password</span>
              <div className={Styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className={Styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>

            <label className={Styles.field}>
              <span>Confirm password</span>
              <div className={Styles.passwordWrapper}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="cpassword"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className={Styles.eyeBtn}
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>

            <input type="submit" value="Confirm" className={Styles.submitBtn} />
            <Link to="/otp" className={Styles.backLink}>Go back</Link>
          </form>
        </div>
      </div>
    </>
  )
}

export default ChangePassword