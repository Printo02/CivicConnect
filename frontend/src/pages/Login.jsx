import React, { useState } from 'react'
import NavBar from '../components/NavBar'
import Styles from '../components/Login.module.css'
import Loginimg from '../assets/login.png'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../services/authService'

const Login = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const data = await loginUser(email, password)
      localStorage.setItem('accessToken', data.access)
      localStorage.setItem('userRole', data.role)

        //       // Save tokens
        // localStorage.setItem("access", response.data.access);
        // localStorage.setItem("refresh", response.data.refresh);

        // // Save other user data if needed
        // localStorage.setItem("role", response.data.role);
        // localStorage.setItem("name", response.data.name)
      if (data.role === 'admin') {
        navigate('/admin/admindashboard')
      } 
      else if (data.role === 'dept'){
        navigate('/dept/deptdashboard')
      }
      else if (data.role === 'Deptemployee'){
        navigate('/deptemployee/deptemployeedashboard')
      }
      else if (data.role === 'representative'){
        navigate('/representative/representativedashboard')
      }
      else if (data.role === 'branch'){
        navigate('/branch/branchdashboard')
      }
      else {
        navigate('/user/userdashboard')
      }
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message)
      setError('Invalid email or password. Please try again.')
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.target)
    const name = formData.get('name')
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const data = await registerUser(name, email, password)
      alert('Registration successful! Please log in.')
      setMode('login')
    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message)
      setError('Could not create account. Please check your details and try again.')
    }
  }

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
              onClick={() => { setMode('login'); setError('') }}
              type="button"
            >
              Login
            </button>
            <button
              className={`${Styles.tab} ${mode === 'register' ? Styles.activeTab : ''}`}
              onClick={() => { setMode('register'); setError('') }}
              type="button"
            >
              Registration
            </button>
          </div>

          {error && <p className={Styles.errorText}>{error}</p>}

          {mode === 'login' ? (
            <form className={Styles.form} onSubmit={handleLoginSubmit}>
              <h2 className={Styles.formTitle}>Welcome back</h2>
              <p className={Styles.formSubtitle}>Login to continue to CivicConnect</p>

              <label className={Styles.field}>
                <span>Email</span>
                <input type="email" name="email" placeholder="abc@gmail.com" required />
              </label>

              <label className={Styles.field}>
                <span>Password</span>
                <input type="password" name="password" placeholder="Enter your password" required />
              </label>

              <div className={Styles.forgotRow}>
                <Link to='/forgotpassword'>
                  <span className={Styles.link}>Forgot password?</span>
                </Link>
              </div>

              <input type="submit" value="Login" className={Styles.submitBtn} />

              <p className={Styles.switchText}>
                Don't have an account?{' '}
                <span className={Styles.link} onClick={() => { setMode('register'); setError('') }}>
                  Register
                </span>
              </p>
            </form>
          ) : (
            <form className={Styles.form} onSubmit={handleRegisterSubmit}>
              <h2 className={Styles.formTitle}>Create an account</h2>
              <p className={Styles.formSubtitle}>Join CivicConnect to report and track civic issues</p>

              <label className={Styles.field}>
                <span>Name</span>
                <input type="text" name="name" placeholder="John Wick" required />
              </label>

              <label className={Styles.field}>
                <span>Email</span>
                <input type="email" name="email" placeholder="abc@gmail.com" required />
              </label>

              <div className={Styles.fieldRow}>
                <label className={Styles.field}>
                  <span>Password</span>
                  <input type="password" name="password" placeholder="Password" required />
                </label>
              </div>

              <input type="submit" value="Create account" className={Styles.submitBtn} />

              <p className={Styles.switchText}>
                Already have an account?{' '}
                <span className={Styles.link} onClick={() => { setMode('login'); setError('') }}>
                  Login
                </span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login