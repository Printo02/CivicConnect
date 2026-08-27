import React from 'react'
import RepresentativeLayout from '../components/RepresentativeLayout'
import Styles from '../components/module.css/RepresentativeDashboard.module.css'
import { getProfile } from '../../api/services/Dept/ProfileService'

import { FaFilter, FaSlidersH, FaDownload } from 'react-icons/fa'
import { PieChart, Pie, Cell, ResponsiveContainer,LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const categoryData = [
  { name: '81-100', value: 30, color: '#3F3F46' },
  { name: '61-80', value: 22, color: '#C4B5FD' },
  { name: '41-60', value: 20, color: '#A78BFA' },
  { name: '21-40', value: 16, color: '#7C5CFC' },
  { name: '0-20', value: 12, color: '#5B21B6' },
]

const ratingTrend = [
  { month: 'Jan', yours: 58, industry: 50 },
  { month: 'Feb', yours: 62, industry: 52 },
  { month: 'Mar', yours: 66, industry: 54 },
  { month: 'Apr', yours: 68, industry: 55 },
  { month: 'May', yours: 70, industry: 57 },
  { month: 'Jun', yours: 74, industry: 58 },
  { month: 'Jul', yours: 76, industry: 60 },
  { month: 'Aug', yours: 78, industry: 61 },
  { month: 'Sep', yours: 80, industry: 62 },
  { month: 'Oct', yours: 83, industry: 63 },
  { month: 'Nov', yours: 86, industry: 64 },
  { month: 'Dec', yours: 88, industry: 65 },
]

const profile =  async () => getProfile() 

const complaints = [
  { name: 'Pothole on MG Road', dept: 'Roads', rating: 60, trend: '+5%', up: true, date: 'Jan 22, 2026', tags: ['Active', 'Roads', 'Admin'], extra: 4 },
  { name: 'Garbage Overflow', dept: 'Waste Mgmt', rating: 72, trend: '-4%', up: false, date: 'Jan 20, 2026', tags: ['Active', 'Waste', 'Admin'], extra: 4 },
  { name: 'Water Leakage', dept: 'Water Supply', rating: 78, trend: '+6%', up: true, date: 'Jan 24, 2026', tags: ['Active', 'Water', 'Urgent'], extra: 0 },
  { name: 'Streetlight Fault', dept: 'Electricity', rating: 38, trend: '+8%', up: true, date: 'Jan 26, 2026', tags: ['Active', 'Electricity'], extra: 0 },
  { name: 'Illegal Dumping', dept: 'Environment', rating: 42, trend: '-1%', up: false, date: 'Jan 18, 2026', tags: ['Active', 'Environment', 'Admin'], extra: 4 },
]


function RepresentativeDashboard() {
  const actions = (
    <>
      <button className={Styles.ghostBtn}><FaFilter /> Filters <span className={Styles.countPill}>3</span></button>
      <button className={Styles.ghostBtn}><FaSlidersH /> Customize</button>
      <button className={Styles.ghostBtn}><FaDownload /> Export</button>
    </>
  )

  return (
    <RepresentativeLayout title={profile.first_name} actions={actions}>
      <div className={Styles.chartsRow}>
        {/* donut card, line chart card — unchanged from before */}
	{/* Donut card */}
          <div className={Styles.card}>
            <div className={Styles.cardHeader}>
              <h3>Complaint rating breakdown</h3>
            </div>
            <div className={Styles.donutWrapper}>
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <ul className={Styles.legend}>
                {categoryData.map((c) => (
                  <li key={c.name}>
                    <span className={Styles.dot} style={{ background: c.color }} />
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
            <button className={Styles.reportBtn}>View full report</button>
          </div>

          {/* Line chart card */}
          <div className={Styles.card}>
            <div className={Styles.cardHeader}>
              <h3>Average resolution rating</h3>
              <p>Track how resolution speed compares to last year.</p>
            </div>
            <div className={Styles.lineLegend}>
              <span><span className={Styles.dotPurple} /> Your rating</span>
              <span><span className={Styles.dotGray} /> Industry average</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ratingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="yours" stroke="#7C5CFC" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="industry" stroke="var(--text-muted)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
      </div>

      <div className={Styles.tableSection}>
        {/* complaints table — unchanged from before */}
	        <div className={Styles.tableSection}>
          <div className={Styles.tableHeader}>
            <div>
              <h3>Recent complaints</h3>
              <p>Keep track of complaints and their resolution ratings.</p>
            </div>
            <div className={Styles.tableSearch}>
              <input placeholder="Search" />
              <span className={Styles.kbd}>⌘K</span>
            </div>
          </div>

          <table className={Styles.table}>
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Complaint</th>
                <th>Rating</th>
                <th>Last assessed</th>
                <th>Categories</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.name}>
                  <td><input type="checkbox" defaultChecked={c.rating > 50} /></td>
                  <td>
                    <div className={Styles.complaintCell}>
                      <div className={Styles.complaintAvatar} />
                      <div>
                        <p className={Styles.complaintName}>{c.name}</p>
                        <p className={Styles.complaintDept}>{c.dept}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={Styles.ratingCell}>
                      <div className={Styles.ratingBar}>
                        <div className={Styles.ratingFill} style={{ width: `${c.rating}%` }} />
                      </div>
                      <span>{c.rating}</span>
                      <span className={c.up ? Styles.trendUp : Styles.trendDown}>{c.trend}</span>
                    </div>
                  </td>
                  <td className={Styles.dateCell}>{c.date}</td>
                  <td>
                    <div className={Styles.tagRow}>
                      {c.tags.map((t) => (
                        <span key={t} className={Styles.tag}>{t}</span>
                      ))}
                      {c.extra > 0 && <span className={Styles.tagMore}>+{c.extra}</span>}
                    </div>
                  </td>
                  <td className={Styles.actionsCell}>⋮</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RepresentativeLayout>
  )
}

export default RepresentativeDashboard