import React from 'react'
import Styles from '../../User/components/module.css/Complaints.module.css'
import { NavLink } from 'react-router-dom'
import UserLayout from '../components/UserLayout'

const navItems = [
  { title: 'File Complaint', desc: 'Report your problems to authorities', path: '/user/file-complaint' },
  { title: 'Complaint History', desc: 'Track your Complaint History', path: '/user/complaint-history' },
  { title: 'Complaint History', desc: 'Track your Complaint History', path: '/user/1' },
  { title: 'Complaint History', desc: 'Track your Complaint History', path: '/user/2' },
]

export function  Complaints() {
  return (
    <UserLayout title="Complaint Section">
      <div className={Styles.chartsRow}>
      { navItems.map((e) => (
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>{e.title}</h3>
            <p>{e.desc}</p>
          </div>
          <NavLink to={e.path} >
            <button className={Styles.reportBtn}>View</button>
          </NavLink>
        </div>
          ))}       
      </div>
    </UserLayout>
  )
}