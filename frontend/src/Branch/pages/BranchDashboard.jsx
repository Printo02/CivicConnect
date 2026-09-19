import React, { useState, useEffect } from 'react';
import BranchLayout from '../components/BranchLayout';
import { getProfile,getBranchComplaints,getBranchComplaint,getAssignableEmployees } from '../../api/services/Branch/DashboardServices.js'
import { PieChart, Pie, Cell, ResponsiveContainer,LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend} from 'recharts'
import { FaFilter, FaSlidersH, FaDownload, FaCheckCircle, FaClock, FaExclamationCircle, FaTimesCircle, FaChartBar, FaStar, FaEye, FaThumbsUp } from 'react-icons/fa'

import Styles from '../components/module.css/BranchDashboard.module.css'




const BranchDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);
        
        const complaintsList = await getBranchComplaints();
        setComplaints(complaintsList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate statistics
  const calculateStats = () => {
    if (!complaints || complaints.length === 0) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0,
        averageRating: 0,
        totalLikes: 0,
        totalViews: 0,
        priorityCounts: { low: 0, medium: 0, high: 0, critical: 0 }
      };
    }

    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      inProgress: complaints.filter(c => c.status === 'in_progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      rejected: complaints.filter(c => c.status === 'rejected').length,
      closed: complaints.filter(c => c.status === 'closed').length,
      averageRating: calculateAverageRating(),
      totalLikes: complaints.reduce((sum, c) => sum + (c.like_count || 0), 0),
      totalViews: complaints.reduce((sum, c) => sum + (c.view_count || 0), 0),
      priorityCounts: {
        low: complaints.filter(c => c.priority === 'low').length,
        medium: complaints.filter(c => c.priority === 'medium').length,
        high: complaints.filter(c => c.priority === 'high').length,
        critical: complaints.filter(c => c.priority === 'critical').length,
      },
      resolutionRate: complaints.length > 0 
        ? Math.round(((complaints.filter(c => c.status === 'resolved').length + complaints.filter(c => c.status === 'closed').length) / complaints.length) * 100)
        : 0
    };

    return stats;
  };

  const calculateAverageRating = () => {
    const resolved = complaints.filter(c => c.status === 'resolved');
    if (resolved.length === 0) return 0;
    
    const totalRating = resolved.reduce((sum, c) => {
      return sum + (c.feedback?.rating || 3);
    }, 0);
    
    return (totalRating / resolved.length).toFixed(1);
  };

  const stats = calculateStats();

  // Prepare data for charts
  const statusDistribution = [
    { name: 'Pending', value: stats.pending, color: '#F59E0B' },
    { name: 'In Progress', value: stats.inProgress, color: '#CA8A04' },
    { name: 'Resolved', value: stats.resolved, color: '#22C55E' },
    { name: 'Rejected', value: stats.rejected, color: '#EF4444' },
    { name: 'Closed', value: stats.closed, color: '#3B82F6' },
  ];

  const priorityDistribution = [
    { name: 'Low', value: stats.priorityCounts.low, fill: '#3B82F6' },
    { name: 'Medium', value: stats.priorityCounts.medium, fill: '#F59E0B' },
    { name: 'High', value: stats.priorityCounts.high, fill: '#EF4444' },
    { name: 'Critical', value: stats.priorityCounts.critical, fill: '#7C5CFC' },
  ];

  // Build the monthly trend only from complaints returned for this branch.
  // Shows the latest 6 calendar months, including months with zero complaints.
  const getMonthlyTrend = () => {
    const now = new Date();

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleString('en-US', { month: 'short' }),
        filed: 0,
        resolved: 0,
        pending: 0,
      };
    });

    const monthMap = new Map(months.map((month) => [month.key, month]));

    complaints.forEach((complaint) => {
      if (!complaint.created_at) return;

      const createdAt = new Date(complaint.created_at);
      if (Number.isNaN(createdAt.getTime())) return;

      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      const month = monthMap.get(key);

      // Ignore complaints outside the latest 6-month chart window.
      if (!month) return;

      month.filed += 1;

      if (complaint.status === 'resolved' || complaint.status === 'closed') {
        month.resolved += 1;
      }

      if (complaint.status === 'pending' || complaint.status === 'in_progress') {
        month.pending += 1;
      }
    });

    return months.map(({ key, ...month }) => month);
  };

  const monthlyTrend = getMonthlyTrend();

  // Recent Complaints: newest complaint first.
  // Clone the array before sorting so React state is never mutated.
  const recentComplaints = [...complaints].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const filteredComplaints = filterStatus === 'all'
    ? recentComplaints
    : recentComplaints.filter(c => c.status === filterStatus);

  const StatCard = ({ icon: Icon, label, value, unit, color, trend }) => (
    <div className={Styles.statCard}>
      <div className={Styles.statIconContainer} style={{ borderColor: color }}>
        <Icon style={{ color }} />
      </div>
      <div className={Styles.statContent}>
        <p className={Styles.statLabel}>{label}</p>
        <div className={Styles.statValue}>
          <span className={Styles.statNumber}>{value}</span>
          {unit && <span className={Styles.statUnit}>{unit}</span>}
        </div>
        {trend && (
          <p className={Styles.statTrend} style={{ color: trend.positive ? '#22C55E' : '#EF4444' }}>
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </p>
        )}
      </div>
    </div>
  );

  const actions = (
    <>
      <button className={Styles.ghostBtn}><FaFilter /> Filters</button>
      <button className={Styles.ghostBtn}><FaSlidersH /> Customize</button>
      <button className={Styles.ghostBtn}><FaDownload /> Export</button>
    </>
  );

  if (loading) {
    return (
      <BranchLayout title="Branch Dashboard" actions={actions}>
        <div className={Styles.loadingContainer}>
          <div className={Styles.spinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </BranchLayout>
    );
  }

  return (
    <BranchLayout title={profile?.name || 'Branch Dashboard'} actions={actions}>
      {/* Stats Overview Row */}
      <div className={Styles.statsGrid}>
        <StatCard 
          icon={FaClock} 
          label="Pending" 
          value={stats.pending} 
          color="#F59E0B"
          trend={{ value: 12, positive: false }}
        />
        <StatCard 
          icon={FaExclamationCircle} 
          label="In Progress" 
          value={stats.inProgress} 
          color="#CA8A04"
          trend={{ value: 8, positive: true }}
        />
        <StatCard 
          icon={FaCheckCircle} 
          label="Resolved" 
          value={stats.resolved} 
          color="#22C55E"
          trend={{ value: 15, positive: true }}
        />
        <StatCard 
          icon={FaTimesCircle} 
          label="Rejected" 
          value={stats.rejected} 
          color="#EF4444"
          trend={{ value: 3, positive: false }}
        />
        <StatCard 
          icon={FaChartBar} 
          label="Resolution Rate" 
          value={stats.resolutionRate} 
          unit="%"
          color="#7C5CFC"
          trend={{ value: 5, positive: true }}
        />
        <StatCard 
          icon={FaStar} 
          label="Avg Rating" 
          value={stats.averageRating} 
          unit="/5"
          color="#3B82F6"
        />
      </div>

      {/* Charts Row */}
      <div className={Styles.chartsRow}>
        {/* Status Distribution */}
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>Complaint Status Distribution</h3>
            <p>Current status breakdown across all complaints</p>
          </div>
          <div className={Styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={statusDistribution} 
                  dataKey="value" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusDistribution.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value} complaints`}
                  contentStyle={{ 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className={Styles.legendList}>
              {statusDistribution.map((item) => (
                <li key={item.name}>
                  <span className={Styles.dot} style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <span className={Styles.count}>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h3>Priority Breakdown</h3>
            <p>Complaints by urgency level</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#7C5CFC" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          <h3>Monthly Complaint Trend</h3>
          <p>Track filed vs resolved complaints over time</p>
        </div>
        <div className={Styles.trendLegend}>
          <span><span className={Styles.dotFiled} /> Filed</span>
          <span><span className={Styles.dotResolved} /> Resolved</span>
          <span><span className={Styles.dotPending} /> Pending</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--surface)', 
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}
            />
            <Legend 
              wrapperStyle={{ color: 'var(--text-secondary)' }}
            />
            <Line type="monotone" dataKey="filed" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 5 }} />
            <Line type="monotone" dataKey="resolved" stroke="#22C55E" strokeWidth={2.5} dot={{ fill: '#22C55E', r: 5 }} />
            <Line type="monotone" dataKey="pending" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Complaints Table */}
      <div className={Styles.card}>
        <div className={Styles.tableHeader}>
          <div>
            <h3>Recent Complaints</h3>
            <p>Monitor and manage current issues</p>
          </div>
          <div className={Styles.filterButtons}>
            {['all', 'pending', 'in_progress', 'resolved', 'rejected'].map(status => (
              <button
                key={status}
                className={`${Styles.filterBtn} ${filterStatus === status ? Styles.active : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                <span className={Styles.badge}>{
                  status === 'all' ? stats.total :
                  status === 'pending' ? stats.pending :
                  status === 'in_progress' ? stats.inProgress :
                  status === 'resolved' ? stats.resolved :
                  stats.rejected
                }</span>
              </button>
            ))}
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className={Styles.emptyState}>
            <p>No complaints found</p>
          </div>
        ) : (
          <div className={Styles.tableWrapper}>
            <table className={Styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date Filed</th>
                  <th>Engagement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.slice(0, 10).map((complaint) => (
                  <tr key={complaint.id} className={Styles.complaintRow}>
                    <td>
                      <div className={Styles.complaintTitle}>
                        <p className={Styles.title}>{complaint.title}</p>
                        {complaint.assigned_employee_name && (
                          <p className={Styles.assignee}>→ {complaint.assigned_employee_name}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={Styles.categoryTag}>{complaint.category_name || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`${Styles.statusBadge} ${Styles[complaint.status]}`}>
                        {complaint.status_display}
                      </span>
                    </td>
                    <td>
                      <span className={`${Styles.priorityBadge} ${Styles['priority-' + complaint.priority]}`}>
                        {complaint.priority_display}
                      </span>
                    </td>
                    <td className={Styles.dateCell}>
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={Styles.engagement}>
                        <span title="Views"><FaEye /> {complaint.view_count}</span>
                        <span title="Support"><FaThumbsUp /> {complaint.like_count}</span>
                      </div>
                    </td>
                    <td>
                      <button className={Styles.moreBtn} title="More options">⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BranchLayout>
  );
};

export default BranchDashboard;