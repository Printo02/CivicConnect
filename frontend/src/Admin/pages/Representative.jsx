import React from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './Representative.module.css'
import { Link, NavLink } from 'react-router-dom';


function Representative(){
  const add = [
    { title : 'Add & Assign  Constituency', desc: 'Add local, state, Parliement Contitunecies', path: '/admin/addconstituencies'},
    { title : 'Add Representative', desc: 'Add and track Representative', path: '/admin/addrepresentatives'},
  ]
  return (
    <AdminLayout title="Representative">
      <div className={Styles.chartsRow}>
        {add.map((a) =>( 
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>{a.title}</h3>
            <p>{a.desc}</p>
          </div>
          <NavLink to={a.path}><button className={Styles.reportBtn}>View</button></NavLink>
        </div>
        ))}
      </div>
    </AdminLayout>
  )
}

export default Representative