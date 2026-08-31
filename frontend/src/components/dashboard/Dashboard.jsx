// import React from 'react'
// import Sidebar from './Sidebar'
// import TopBar from './TopBar'
// import Styles from './Dashboard.module.css'
// import heroImg from '../../assets/dashboard-hero.png'
// import {
//   FaRoad, FaTint, FaBolt, FaTrashAlt, FaLeaf, FaEllipsisH,
//   FaFileAlt, FaClock, FaCheckCircle, FaThumbsUp, FaArrowRight,
//   FaMicrophone, FaLanguage
// } from 'react-icons/fa'

// const categories = [
//   { icon: <FaRoad />, label: 'Roads & Infrastructure' },
//   { icon: <FaTint />, label: 'Water Supply' },
//   { icon: <FaBolt />, label: 'Electricity' },
//   { icon: <FaTrashAlt />, label: 'Waste Management' },
//   { icon: <FaLeaf />, label: 'Environment' },
//   { icon: <FaEllipsisH />, label: 'Others' },
// ]

// const stats = [
//   { icon: <FaFileAlt />, value: 12, label: 'Total Submitted', title: 'My Complaints', color: '#2563EB' },
//   { icon: <FaClock />, value: 5, label: 'Under Review', title: 'In Progress', color: '#F59E0B' },
//   { icon: <FaCheckCircle />, value: 6, label: 'Completed', title: 'Resolved', color: '#10B981' },
//   { icon: <FaThumbsUp />, value: 23, label: 'Votes on Issues', title: 'Support Given', color: '#8B5CF6' },
// ]

// const recentComplaints = [
//   { title: 'Pothole on Main Road', location: 'MG Road, Kochi', status: 'In Progress', time: '2 days ago', img: null },
//   { title: 'Street Light Not Working', location: 'Panampilly Nagar, Kochi', status: 'Submitted', time: '3 days ago', img: null },
//   { title: 'Garbage Overflowing', location: 'Kadavanthra, Kochi', status: 'Resolved', time: '1 week ago', img: null },
// ]

// const topIssues = [
//   { title: 'Garbage Overflowing at Kadavanthra', votes: 98, img: null },
//   { title: 'Pothole on MG Road', votes: 74, img: null },
//   { title: 'Water Leakage in Pipeline', votes: 52, img: null },
//   { title: 'Street Light Not Working at Park Avenue', votes: 41, img: null },
// ]

// const quickActions = [
//   { icon: <FaFileAlt />, title: 'File a New Complaint', subtitle: 'Report a public issue' },
//   { icon: <FaClock />, title: 'Check Complaint Status', subtitle: 'Track your complaint' },
//   { icon: <FaThumbsUp />, title: 'Support Public Issues', subtitle: 'Vote and prioritize issues' },
// ]

// const statusClass = {
//   'In Progress': Styles.statusProgress,
//   'Submitted': Styles.statusSubmitted,
//   'Resolved': Styles.statusResolved,
// }

// function Dashboard() {
//   return (
//     <div className={Styles.layout}>
//       <Sidebar activeItem="Dashboard" />

//       <div className={Styles.main}>
//         <TopBar notificationCount={3} />

//         <div className={Styles.content}>
//           {/* Hero */}
//           <div className={Styles.hero}>
//             <div>
//               <h1 className={Styles.heroTitle}>
//                 Welcome to <span className={Styles.heroBrand}>CivicConnect</span>
//               </h1>
//               <p className={Styles.heroSubtitle}>
//                 Your voice, our responsibility. Together for a better tomorrow.
//               </p>
//             </div>
//             <img src={heroImg} alt="" className={Styles.heroImg} />
//           </div>

//           {/* Categories */}
//           <div className={Styles.categoryRow}>
//             {categories.map((c) => (
//               <div className={Styles.categoryCard} key={c.label}>
//                 <span className={Styles.categoryIcon}>{c.icon}</span>
//                 <span>{c.label}</span>
//               </div>
//             ))}
//           </div>

//           {/* Stats + Top issues */}
//           <div className={Styles.statsGrid}>
//             {stats.map((s) => (
//               <div className={Styles.statCard} key={s.title}>
//                 <span className={Styles.statIcon} style={{ background: `${s.color}1A`, color: s.color }}>
//                   {s.icon}
//                 </span>
//                 <div>
//                   <p className={Styles.statTitle}>{s.title}</p>
//                   <p className={Styles.statValue}>{s.value}</p>
//                   <p className={Styles.statLabel}>{s.label}</p>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className={Styles.bottomGrid}>
//             {/* Recent complaints */}
//             <div className={Styles.panel}>
//               <div className={Styles.panelHeader}>
//                 <h3>Recent Complaints</h3>
//                 <span className={Styles.viewAll}>View All</span>
//               </div>
//               <ul className={Styles.complaintList}>
//                 {recentComplaints.map((c) => (
//                   <li key={c.title} className={Styles.complaintItem}>
//                     <div className={Styles.complaintThumb} />
//                     <div className={Styles.complaintInfo}>
//                       <p className={Styles.complaintTitle}>{c.title}</p>
//                       <p className={Styles.complaintLocation}>{c.location}</p>
//                     </div>
//                     <div className={Styles.complaintMeta}>
//                       <span className={`${Styles.statusPill} ${statusClass[c.status]}`}>{c.status}</span>
//                       <span className={Styles.complaintTime}>{c.time}</span>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {/* Map placeholder */}
//             <div className={Styles.panel}>
//               <div className={Styles.panelHeader}>
//                 <h3>Map View</h3>
//                 <span className={Styles.viewAll}>View All</span>
//               </div>
//               <div className={Styles.mapPlaceholder}>
//                 Map integration goes here
//               </div>
//             </div>

//             {/* Sidebar column: top issues + quick actions + language */}
//             <div className={Styles.sideCol}>
//               <div className={Styles.panel}>
//                 <h3 className={Styles.panelTitleOnly}>Top Supported Issues</h3>
//                 <ul className={Styles.topIssueList}>
//                   {topIssues.map((t) => (
//                     <li key={t.title} className={Styles.topIssueItem}>
//                       <div className={Styles.topIssueThumb} />
//                       <span className={Styles.topIssueTitle}>{t.title}</span>
//                       <span className={Styles.topIssueVotes}><FaThumbsUp /> {t.votes}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               <div className={Styles.quickActionsPanel}>
//                 <h3 className={Styles.panelTitleOnly}>Quick Actions</h3>
//                 <ul>
//                   {quickActions.map((q) => (
//                     <li key={q.title} className={Styles.quickActionItem}>
//                       <span className={Styles.quickActionIcon}>{q.icon}</span>
//                       <div className={Styles.quickActionText}>
//                         <p>{q.title}</p>
//                         <span>{q.subtitle}</span>
//                       </div>
//                       <FaArrowRight className={Styles.quickActionArrow} />
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               <div className={Styles.voicePanel}>
//                 <h3 className={Styles.panelTitleOnly}>Language & Voice Support</h3>
//                 <p className={Styles.voiceSubtitle}>Speak or type in your language</p>
//                 <div className={Styles.voiceButtons}>
//                   <button type="button"><FaMicrophone /> Speak</button>
//                   <button type="button"><FaLanguage /> Translate</button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Dashboard