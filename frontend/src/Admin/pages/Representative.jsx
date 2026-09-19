import React from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './Representative.module.css'

import {
  FaMapMarkedAlt,
  FaUsers,
  FaExchangeAlt,
  FaArrowRight,
  FaLandmark
} from 'react-icons/fa'

function Representative() {

  const actions = [
    {
      title: 'Add & Assign Constituency',
      desc: 'Add local, state and Parliament constituencies and assign representatives.',
      path: '/admin/constituencies',
      icon: <FaMapMarkedAlt />,
      tag: 'Constituency Management'
    },
    {
      title: 'View Representatives',
      desc: 'View representatives assigned to Local, State and Parliament constituencies.',
      path: '/admin/addrepresentatives',
      icon: <FaUsers />,
      tag: 'Representative Management'
    },
    {
      title: 'Bulk Representative Assignment',
      desc: 'Assign representatives in bulk when an election term has ended.',
      path: '/admin/rep-bulk-assignment',
      icon: <FaExchangeAlt />,
      tag: 'Election Transition'
    }
  ]

  return (
    <AdminLayout title="Representative">

      <div className={Styles.page}>

        {/* Header */}
        <div className={Styles.pageHeader}>
          <div className={Styles.headingArea}>
            <div className={Styles.headingIcon}>
              <FaLandmark />
            </div>

            <div>
              <h1>Representative Management</h1>
              <p>
                Manage constituencies, representatives and election assignments
                from one place.
              </p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className={Styles.cardsGrid}>
          {actions.map((action) => (
            <div className={Styles.card} key={action.path}>

              <div className={Styles.cardTop}>
                <div className={Styles.iconBox}>
                  {action.icon}
                </div>

                <span className={Styles.tag}>
                  {action.tag}
                </span>
              </div>

              <div className={Styles.cardContent}>
                <h3>{action.title}</h3>
                <p>{action.desc}</p>
              </div>

              <div className={Styles.cardFooter}>
                <a href={action.path} className={Styles.viewButton}>
                  <span>Open</span>
                  {/* <FaArrowRight /> */}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

export default Representative