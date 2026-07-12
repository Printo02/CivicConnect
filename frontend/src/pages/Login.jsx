import React, { useState } from 'react'
import NavBar from '../components/NavBar'
import Styles from '../components/Login.module.css'
import Loginimg from '../assets/login.png'
import Footer from './../components/Footer';

const Login = () => {
  const [mode, setMode] = useState('login')

  return (
    <div className={Styles.page}>
      <NavBar />
      <div className={Styles.wrapper}>
        <div className={Styles.illustration}>
          <img src={Loginimg} className={Styles.Loginimg} alt="Login illustration" />
        </div>
        <div className={Styles.card}>
          <div className={Styles.tabs}>
            <button
              className={`${Styles.tab} ${mode === 'login' ? Styles.activeTab : ''}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Login
            </button>
            <button
              className={`${Styles.tab} ${mode === 'register' ? Styles.activeTab : ''}`}
              onClick={() => setMode('register')}
              type="button"
            >
              Registration
            </button>
          </div>

          {mode === 'login' ? (
            <form className={Styles.form}>
              <h2 className={Styles.formTitle}>Welcome back</h2>
              <p className={Styles.formSubtitle}>Login to continue to CivicConnect</p>

              <label className={Styles.field}>
                <span>Username</span>
                <input type="text" name="username" placeholder="Enter email" />
              </label>

              <label className={Styles.field}>
                <span>Password</span>
                <input type="password" name="password" placeholder="Enter your password" />
              </label>

              <div className={Styles.forgotRow}>
                <span className={Styles.link}>Forgot password?</span>
              </div>

              <input type="submit" value="Login" className={Styles.submitBtn} />

              <p className={Styles.switchText}>
                Don't have an account?{' '}
                <span className={Styles.link} onClick={() => setMode('register')}>
                  Register
                </span>
              </p>
            </form>
          ) : (
            <form className={Styles.form}>
              <h2 className={Styles.formTitle}>Create an account</h2>
              <p className={Styles.formSubtitle}>Join CivicConnect to report and track civic issues</p>

              <label className={Styles.field}>
                <span>Name</span>
                <input type="text" name="name" placeholder="John Wick" />
              </label>

              <label className={Styles.field}>
                <span>Email</span>
                <input type="email" name="email" placeholder="abc@gmail.com" />
              </label>

              <div className={Styles.fieldRow}>
                <label className={Styles.field}>
                  <span>Password</span>
                  <input type="password" name="password" placeholder="Password" />
                </label>
              </div>

              <input type="submit" value="Create account" className={Styles.submitBtn} />

              <p className={Styles.switchText}>
                Already have an account?{' '}
                <span className={Styles.link} onClick={() => setMode('login')}>
                  Login
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
      {/* <Footer/> */}
    </div>
  )
}

export default Login