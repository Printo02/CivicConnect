import React from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './Representative.module.css'


function Representative(){
  return (
    <AdminLayout title="Representative">
      <div className={Styles.chartsRow}>
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>Representative</h3>
            <p>Add and track Representative</p>
          </div>
          <button className={Styles.reportBtn}>View</button>
        </div>
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>Representative</h3>
            <p>Add and track Representative</p>
          </div>
          <button className={Styles.reportBtn}>View</button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Representative