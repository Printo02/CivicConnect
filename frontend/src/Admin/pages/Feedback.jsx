import React, { useState } from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './Feedback.module.css'

function Feedback() {

  const [search, setSearch] = useState('')

  const complaints = [
    {
      name: 'Jomy Joy',
      dept: 'jjj@gmail.com',
      rating: 60,
      trend: '+5%',
      up: true,
      date: 'Jan 22, 2026'
    },
    {
      name: 'Adwaith A',
      dept: 'Adwaith111@gmail.com',
      rating: 72,
      trend: '-4%',
      up: false,
      date: 'Jan 20, 2026'
    }
  ]

  const filteredFeedback = complaints.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dept.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout title="Feedback">

      <div className={Styles.tableSection}>

        {/* HEADER */}
        <div className={Styles.tableHeader}>

          <div>
            <h3 className={Styles.title}>
              Recent Feedback
            </h3>

            <p className={Styles.subtitle}>
              Keep track of feedback and their resolutions.
            </p>
          </div>

          {/* SEARCH */}
          <div className={Styles.tableSearch}>

            <input
              type="text"
              placeholder="Search feedback..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <span className={Styles.kbd}>
              ⌘K
            </span>

          </div>

        </div>


        {/* EMPTY STATE */}
        {filteredFeedback.length === 0 ? (

          <div className={Styles.Block}>
            <p>No feedback found.</p>
          </div>

        ) : (

          /* TABLE */
          <div className={Styles.tableWrapper}>

            <table className={Styles.table}>

              <thead>
                <tr>
                  <th>From</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredFeedback.map((c) => (

                  <tr key={c.name}>

                    {/* FROM */}
                    <td>

                      <div className={Styles.complaintCell}>

                        <div className={Styles.complaintAvatar}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>

                        <div>

                          <p className={Styles.complaintName}>
                            {c.name}
                          </p>

                          <p className={Styles.complaintDept}>
                            {c.dept}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* DATE */}
                    <td className={Styles.dateCell}>
                      {c.date}
                    </td>


                    {/* ACTION */}
                    <td>

                      <div className={Styles.tagRow}>

                        <button className={Styles.tag}>
                          View
                        </button>

                        <button className={Styles.tagDanger}>
                          Delete
                        </button>

                        <button className={Styles.tagSuccess}>
                          Mark as read
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </AdminLayout>
  )
}

export default Feedback