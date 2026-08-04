import React from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './Departments.module.css'
import { NavLink } from 'react-router-dom'


function  Departments() {

  return (
    <AdminLayout title="Departments">
      <div className={Styles.chartsRow}>
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>Departments</h3>
            <p>Add and track departments</p>
          </div>
          <button className={Styles.reportBtn}>View</button>
        </div>
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>Employee</h3>
            <p>Add and track employee</p>
          </div>
          <button className={Styles.reportBtn}>View</button>
        </div>
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>District</h3>
            <p>View districts</p>
          </div>
          <NavLink to="/district">
            <button className={Styles.reportBtn}>View</button>
          </NavLink>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Departments










