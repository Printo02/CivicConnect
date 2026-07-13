import NavBar from '../components/NavBar'
import React from 'react'
import Errorimg from '../assets/ERROR404.jpg'
import Styles from '../components/ErrorPage.module.css'
import { Link } from 'react-router-dom'
function ErrorPage(){
  return (
    <div className={Styles.ErrorCard}>
      <div className={Styles.wrapper}>
        <img src={Errorimg} width='50%' className={Styles.Errorimg}/>
      </div>
      <div className={Styles.LinkBack}>
        <Link to='/'>
          <h3>Go to Home Page</h3>
        </Link>
      </div>
    </div>
  )
}

export default ErrorPage