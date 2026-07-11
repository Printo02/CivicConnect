import React from 'react'
import NavBar from '../components/NavBar'

const Login = () => {
  return (
    <div>
      <NavBar />
      <h1 style={{ marginTop: '120px' }}>Login / Registration</h1>
        <br/>
        <h3>Login</h3>
        username: <input type='text' name='username' placeholder='@username'/>
        <br/>
        password: <input type='password' name='password'  placeholder='@password'/>
        <br/>
        <input type='submit' />
        <p>You don't have an account? <span>  Forget Password ?  </span></p>
        <p>---------------------------------------------------------------</p>
        <h3>Registration</h3>
        name: <input type='text' name='name' placeholder='@username'/>
        <br/>
        email: <input type='email' name='email'  placeholder='@email'/>
        <br/>.<br/>.<br/>
        <input type='submit' />
        <p>Already Login?</p>
    </div>
  )
}

export default Login