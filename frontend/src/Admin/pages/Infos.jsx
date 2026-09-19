import React from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './Departments.module.css'
import { NavLink } from 'react-router-dom'


const navItems = [
  { title: 'District', desc: 'View districts', path: '/admin/district' },
]

export function  Infos() {
  return (
    <AdminLayout title="Departments">
      <div className={Styles.chartsRow}>
      { navItems.map((e) => (
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>{e.title}</h3>
            <p>Add and track departments</p>
          </div>
          <NavLink to={e.path} >
            <button className={Styles.reportBtn}>View</button>
          </NavLink>
        </div>
          ))}       
      </div>
    </AdminLayout>
  )
}