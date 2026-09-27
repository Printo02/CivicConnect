import React from 'react'
import {
  FaPlusCircle,
  FaHistory,
  FaArrowRight,
  FaClipboardList,
} from 'react-icons/fa'
import { NavLink } from 'react-router-dom'

import Styles from '../../User/components/module.css/Complaints.module.css'
import UserLayout from '../components/UserLayout'

const navItems = [
  {
    title: 'File Complaint',
    desc: 'Report public issues directly to the appropriate authority and attach supporting evidence.',
    path: '/user/file-complaint',
    icon: <FaPlusCircle />,
    label: 'Create Complaint',
    className: 'fileCard',
  },
  {
    title: 'Complaint History',
    desc: 'Track complaints you have submitted, check their progress, and view authority responses.',
    path: '/user/complaint-history',
    icon: <FaHistory />,
    label: 'View Complaints',
    className: 'historyCard',
  },
]

export function Complaints() {
  return (
    <UserLayout title="Complaint Section">
      <div className={Styles.page}>

        {/* HEADER */}
        <div className={Styles.header}>
          <div className={Styles.headerIcon}>
            <FaClipboardList />
          </div>

          <div>
            <span className={Styles.eyebrow}>
              CivicConnect Complaints
            </span>

            <h1>
              Complaint Management
            </h1>

            <p>
              Report public issues and keep track of complaints
              you have already submitted.
            </p>
          </div>
        </div>


        {/* CARDS */}
        <div className={Styles.chartsRow}>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`${Styles.card} ${Styles[item.className]}`}
            >
              <div className={Styles.cardTop}>
                <div className={Styles.iconBox}>
                  {item.icon}
                </div>

                <span className={Styles.cardNumber}>
                  {item.title === 'File Complaint'
                    ? 'New'
                    : 'History'}
                </span>
              </div>


              <div className={Styles.cardHeader}>
                <h3>
                  {item.title}
                </h3>

                <p>
                  {item.desc}
                </p>
              </div>


              <NavLink
                to={item.path}
                className={Styles.reportBtn}
              >
                <span>
                  {item.label}
                </span>

                <FaArrowRight />
              </NavLink>
            </div>
          ))}
        </div>
      </div>
    </UserLayout>
  )
}