import React from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './Feedback.module.css'

function Feedback() {
  const complaints = [
  { name: 'Jomy Joy', dept: 'jjj@gmail.com', rating: 60, trend: '+5%', up: true, date: 'Jan 22, 2026', tags: ['Active', 'Roads', 'Admin'], extra: 4 },
  { name: 'Adwaith A', dept: 'Adwaith111@gmail.com', rating: 72, trend: '-4%', up: false, date: 'Jan 20, 2026', tags: ['Active', 'Waste', 'Admin'], extra: 4 }
]

  return (
    <AdminLayout title="Feedback">
            <div className={Styles.tableSection}>
                <div className={Styles.tableSection}>
                <div className={Styles.tableHeader}>
                  <div>
                    <h3>Recent Feedback</h3>
                    <p>Keep track of Feedback and their resolutions.</p>
                  </div>
                  <div className={Styles.tableSearch}>
                    <input placeholder="Search" />
                    <span className={Styles.kbd}>⌘K</span>
                  </div>
                </div>
      
                <table className={Styles.table}>
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.name}>
                        <td>
                          <div className={Styles.complaintCell}>
                            <div className={Styles.complaintAvatar} />
                            <div>
                              <p className={Styles.complaintName}>{c.name}</p>
                              <p className={Styles.complaintDept}>{c.dept}</p>
                            </div>
                          </div>
                        </td>
                        <td className={Styles.dateCell}>{c.date}</td>
                        <td>
                          <div className={Styles.tagRow}>
                              <span className={Styles.tag}>View</span> 
                              <span className={Styles.tag}>Delete</span>
                              <span className={Styles.tag}>Mark as readed</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
    </AdminLayout>
  )
}

export default Feedback