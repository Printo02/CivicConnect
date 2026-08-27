import React from 'react'
import Styles from '../components/module.css/Branches.module.css'
import { NavLink } from 'react-router-dom'
import DeptLayout from './../components/DeptLayout';

const pages = [
  { h3: 'Add Branches ' , p : 'Add and track branches', path: '/dept/branches/addbranch'},
  { h3: 'View Employee' , p : 'View employee & activate-deactivate employee', path: ''}
]

function  Branches() {
  return (
    <DeptLayout title="Branches">
      <div className={Styles.chartsRow}>
        { pages.map((b) => (
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>{b.h3}</h3>
            <p>{b.p}</p>
          </div>
          <NavLink to={b.path} >
            <button className={Styles.reportBtn}>View</button>
          </NavLink>
        </div>
        ))}
      </div>
    </DeptLayout>
  )
}

export default Branches






