import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './AdminDashboard.module.css'
import { FaUsers,FaUserCheck,FaUserSlash,FaUserPlus,FaFilter,FaDownload,FaArrowUp,FaArrowDown } from 'react-icons/fa'
import { PieChart,Pie,Cell,ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip } from 'recharts'
import { getAdminUserDashboard } from '../../api/services/Admin/adminDashboardService'


function AdminDashboard() {

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    const loadDashboard = async () => {

      try {

        setLoading(true)
        setError('')

        const result = await getAdminUserDashboard()

        setData(result)

      } catch (err) {

        console.error('Dashboard error:', err)

        setError(
          err?.response?.data?.detail ||
          'Unable to load dashboard statistics.'
        )

      } finally {

        setLoading(false)

      }
    }

    loadDashboard()

  }, [])


  const actions = (
    <>
      <button className={Styles.ghostBtn}>
        <FaFilter />
        Filters
      </button>

      <button className={Styles.ghostBtn}>
        <FaDownload />
        Export
      </button>
    </>
  )


  if (loading) {

    return (
      <AdminLayout
        title="Organization overview"
        actions={actions}
      >
        <div className={Styles.loadingState}>
          Loading dashboard...
        </div>
      </AdminLayout>
    )

  }


  if (error) {

    return (
      <AdminLayout
        title="Organization overview"
        actions={actions}
      >
        <div className={Styles.errorState}>
          {error}
        </div>
      </AdminLayout>
    )

  }


  if (!data) {
    return null
  }


  const roleData = data.role_breakdown || []
  const growthData = data.monthly_growth || []
  const recentUsers = data.recent_users || []


  const roleColors = [
    '#7C5CFC',
    '#A78BFA',
    '#C4B5FD',
    '#6D4DEB',
    '#5B21B6'
  ]


  const activePercentage =
    data.total_users > 0
      ? Math.round(
          (data.active_users / data.total_users) * 100
        )
      : 0


  return (
    <AdminLayout
      title="Organization overview"
      actions={actions}
    >

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className={Styles.statsGrid}>

        <div className={Styles.statCard}>

          <div className={Styles.statTop}>
            <div className={`${Styles.statIcon} ${Styles.purple}`}>
              <FaUsers />
            </div>
          </div>

          <p className={Styles.statLabel}>
            Total users
          </p>

          <h2 className={Styles.statValue}>
            {data.total_users.toLocaleString()}
          </h2>

          <p className={Styles.statMeta}>
            Registered citizens
          </p>

        </div>


        <div className={Styles.statCard}>

          <div className={Styles.statTop}>
            <div className={`${Styles.statIcon} ${Styles.green}`}>
              <FaUserCheck />
            </div>

            <span className={Styles.successBadge}>
              {activePercentage}%
            </span>
          </div>

          <p className={Styles.statLabel}>
            Active users
          </p>

          <h2 className={Styles.statValue}>
            {data.active_users.toLocaleString()}
          </h2>

          <p className={Styles.statMeta}>
            Currently active
          </p>

        </div>


        <div className={Styles.statCard}>

          <div className={Styles.statTop}>
            <div className={`${Styles.statIcon} ${Styles.red}`}>
              <FaUserSlash />
            </div>
          </div>

          <p className={Styles.statLabel}>
            Inactive users
          </p>

          <h2 className={Styles.statValue}>
            {data.inactive_users.toLocaleString()}
          </h2>

          <p className={Styles.statMeta}>
            Disabled accounts
          </p>

        </div>


        <div className={Styles.statCard}>

          <div className={Styles.statTop}>
            <div className={`${Styles.statIcon} ${Styles.blue}`}>
              <FaUserPlus />
            </div>

            <span className={Styles.growthBadge}>
              This month
            </span>
          </div>

          <p className={Styles.statLabel}>
            New users
          </p>

          <h2 className={Styles.statValue}>
            {data.new_users_this_month.toLocaleString()}
          </h2>

          <p className={Styles.statMeta}>
            Newly registered users
          </p>

        </div>

      </div>


      {/* =====================================================
          CHARTS
      ===================================================== */}

      <div className={Styles.chartsRow}>

        {/* USER GROWTH */}

        <div className={Styles.card}>

          <div className={Styles.cardHeader}>

            <div>
              <h3>User growth</h3>

              <p>
                New user registrations over the last 6 months.
              </p>
            </div>

            <span className={Styles.chartBadge}>
              6 months
            </span>

          </div>


          <div className={Styles.chartContainer}>

            {growthData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <LineChart data={growthData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#7C5CFC"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: '#7C5CFC'
                    }}
                    activeDot={{
                      r: 6
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <div className={Styles.emptyChart}>
                No growth data available.
              </div>

            )}

          </div>

        </div>


        {/* ROLE BREAKDOWN */}

        <div className={Styles.card}>

          <div className={Styles.cardHeader}>

            <div>
              <h3>Users by role</h3>

              <p>
                Distribution of registered accounts.
              </p>
            </div>

          </div>


          <div className={Styles.roleChart}>

            {roleData.length > 0 ? (

              <>
                <ResponsiveContainer
                  width="55%"
                  height={220}
                >

                  <PieChart>

                    <Pie
                      data={roleData}
                      dataKey="count"
                      nameKey="role"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                    >

                      {roleData.map((entry, index) => (

                        <Cell
                          key={entry.role}
                          fill={
                            roleColors[
                              index % roleColors.length
                            ]
                          }
                          stroke="none"
                        />

                      ))}

                    </Pie>

                  </PieChart>

                </ResponsiveContainer>


                <div className={Styles.roleLegend}>

                  {roleData.map((role, index) => (

                    <div
                      className={Styles.roleItem}
                      key={role.role}
                    >

                      <span
                        className={Styles.roleDot}
                        style={{
                          background:
                            roleColors[
                              index % roleColors.length
                            ]
                        }}
                      />

                      <span className={Styles.roleName}>
                        {role.role}
                      </span>

                      <strong>
                        {role.count}
                      </strong>

                    </div>

                  ))}

                </div>
              </>

            ) : (

              <div className={Styles.emptyChart}>
                No role data available.
              </div>

            )}

          </div>

        </div>

      </div>


      {/* =====================================================
          RECENT USERS
      ===================================================== */}

      <div className={Styles.tableSection}>

        <div className={Styles.tableHeader}>

          <div>
            <h3>
              Recent users
            </h3>

            <p>
              Latest users registered on CivicConnect.
            </p>
          </div>

          <button className={Styles.viewAllBtn}>
            View all
          </button>

        </div>


        <div className={Styles.tableWrapper}>

          <table className={Styles.table}>

            <thead>

              <tr>

                <th>User</th>

                <th>Role</th>

                <th>Status</th>

                <th>Joined</th>

              </tr>

            </thead>


            <tbody>

              {recentUsers.map((user) => (

                <tr key={user.id}>

                  <td>

                    <div className={Styles.userCell}>

                      <div className={Styles.userAvatar}>
                        {(
                          user.name ||
                          'U'
                        ).charAt(0).toUpperCase()}
                      </div>

                      <div>

                        <p className={Styles.userName}>
                          {user.name || 'Unknown user'}
                        </p>

                        <p className={Styles.userEmail}>
                          {user.email || 'No email'}
                        </p>

                      </div>

                    </div>

                  </td>


                  <td>

                    <span className={Styles.roleBadge}>
                      {user.role}
                    </span>

                  </td>


                  <td>

                    {user.is_active ? (

                      <span className={Styles.activeBadge}>
                        <span />
                        Active
                      </span>

                    ) : (

                      <span className={Styles.inactiveBadge}>
                        <span />
                        Inactive
                      </span>
                    )}
                  </td>


                  <td className={Styles.dateCell}>
                    {new Date(
                      user.date_joined
                    ).toLocaleDateString(
                      'en-IN',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }
                    )}
                  </td>
                </tr>
              ))}


              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className={Styles.emptyTable}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard