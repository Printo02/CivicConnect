import React from 'react'
import Styles from '../components/ForgotPassword.module.css';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Fpimg from '../assets/Forgotpassword-amico.png'

function ForgotPassword() {
  return (
    <>
      <NavBar />
      <div className={Styles.page}>
        <div className={Styles.card}>
          <img src={Fpimg} className={Styles.image} alt="Forgot password illustration" />

          <h3 className={Styles.title}>Forgot Password</h3>
          <p className={Styles.subtitle}>
            Enter the email linked to your account and we'll send you a one-time code to reset your password.
          </p>

          <form className={Styles.form}>
            <label className={Styles.field}>
              <span>Email</span>
              <input type="email" name="email" placeholder="Enter your email" />
            </label>

            <input type="submit" value="Send OTP" className={Styles.submitBtn} />
            <Link to="/login" className={Styles.backLink}>Back to login</Link>
          </form>
        </div>
      </div>
    </>
  )
}

export default ForgotPassword