import React, { useEffect, useState } from 'react'
import Styles from './AddRepresntatives.module.css'
import AdminLayout from '../components/dashboard/AdminLayout'
import { FaSearch, FaUserTie, FaCheck, FaEdit, FaTrash, FaPowerOff } from 'react-icons/fa'
import { getUsers } from '../../api/services/Admin/adminuserview.js'
import {promoteUser,getRepresentatives,updateRepresentative,
  deleteRepresentative,toggleRepresentativeStatus,} from '../../api/services/Admin/representativeService.js'

const extractErrorMessage = (err, fallback) => {
  const data = err.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.error) return data.error
  if (data.detail) return data.detail

  const firstKey = Object.keys(data)[0]
  if (firstKey) {
    const value = data[firstKey]
    return Array.isArray(value) ? value[0] : String(value)
  }
  return fallback
}

export default function AddRepresntatives() {
  // ---------- promote-user state ----------
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [matchedUser, setMatchedUser] = useState(null)
  const [promoting, setPromoting] = useState(false)
  const [promoteError, setPromoteError] = useState('')

  // ---------- representatives list state ----------
  const [representatives, setRepresentatives] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [search, setSearch] = useState('')

  // ---------- edit modal state ----------
  const [editingRep, setEditingRep] = useState(null)
  const [editForm, setEditForm] = useState({ start_date: '', end_date: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // ---------- load users ----------
  const fetchUsers = async () => {
    try {
      const data = await getUsers()
      const userList = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
      setUsers(userList)
    } catch (err) {
      console.error('Failed to load users:', err)
      setPromoteError(extractErrorMessage(err, 'Could not load users.'))
    }
  }

  // ---------- load representatives ----------
  const fetchRepresentatives = async () => {
    setLoading(true)
    try {
      const data = await getRepresentatives()
      const representativeList = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
      setRepresentatives(representativeList)
    } catch (err) {
      console.error('Failed to load representatives:', err)
      setListError(extractErrorMessage(err, 'Could not load representatives.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRepresentatives()
  }, [])

  // ---------- search user by email (promote section) ----------
  const handleEmailChange = (value) => {
    setEmail(value)
    setPromoteError('')

    const searchEmail = value.trim().toLowerCase()
    if (!searchEmail) {
      setMatchedUser(null)
      return
    }

    const user = users.find((item) => String(item.email || '').trim().toLowerCase() === searchEmail)
    setMatchedUser(user || null)
  }

  // ---------- promote user ----------
  const handlePromote = async () => {
    if (!matchedUser) {
      setPromoteError('Enter the email address of a valid user.')
      return
    }

    if (String(matchedUser.role || '').trim().toLowerCase() === 'representative') {
      setPromoteError('This user is already a representative.')
      return
    }

    const userProfileId = matchedUser.user_profile_id || matchedUser.user_profile?.id || matchedUser.profile_id

    if (!userProfileId) {
      console.error('User profile ID missing:', matchedUser)
      setPromoteError('User profile ID is not available from the users API.')
      return
    }

    setPromoting(true)
    setPromoteError('')
    try {
      await promoteUser(Number(userProfileId))
      await fetchUsers()
      await fetchRepresentatives()
      setEmail('')
      setMatchedUser(null)
    } catch (err) {
      console.error('Promotion failed:', err)
      setPromoteError(extractErrorMessage(err, 'Could not promote user.'))
    } finally {
      setPromoting(false)
    }
  }

  // ---------- edit representative ----------
  const handleEdit = (representative) => {
    setEditingRep(representative)
    setEditForm({
      start_date: representative.start_date || '',
      end_date: representative.end_date || '',
    })
    setEditError('')
  }

  const handleSaveEdit = async () => {
    if (editForm.start_date && editForm.end_date && editForm.start_date > editForm.end_date) {
      setEditError('Start date cannot be after end date.')
      return
    }

    setSavingEdit(true)
    setEditError('')
    try {
      await updateRepresentative(editingRep.id, {
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
      })
      await fetchRepresentatives()
      setEditingRep(null)
    } catch (err) {
      console.error('Update representative failed:', err)
      setEditError(extractErrorMessage(err, 'Could not update representative.'))
    } finally {
      setSavingEdit(false)
    }
  }

  // ---------- delete representative ----------
  const handleDelete = async (representative) => {
    const name = representative.user_name || 'this representative'
    const confirmed = window.confirm(`Are you sure you want to delete ${name}?`)
    if (!confirmed) return

    setListError('')
    try {
      await deleteRepresentative(representative.id)
      await fetchRepresentatives()
      await fetchUsers()
    } catch (err) {
      console.error('Delete representative failed:', err)
      setListError(extractErrorMessage(err, 'Could not delete representative.'))
    }
  }

  // ---------- toggle active/inactive ----------
  const handleToggleStatus = async (representative) => {
    const currentStatus = Boolean(representative.user_is_active)
    const newStatus = !currentStatus
    try {
      setListError('')
      await toggleRepresentativeStatus(representative.id, newStatus)
      await fetchRepresentatives()
      await fetchUsers()
    } catch (err) {
      console.error('Status update failed:', err)
      setListError(extractErrorMessage(err, 'Could not change representative status.'))
    }
  }

  // ---------- search filter (representatives section) ----------
  const filteredRepresentatives = representatives.filter((rep) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    return (
      rep.user_name?.toLowerCase().includes(query) ||
      rep.user_email?.toLowerCase().includes(query) ||
      rep.constituency_name?.toLowerCase().includes(query) ||
      rep.district_name?.toLowerCase().includes(query)
    )
  })

  return (
    <AdminLayout title="Representatives">
      {/* ============================================================
          SECTION 1 — Promote a user to representative
      ============================================================ */}
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          <div>
            <h3>Promote User to Representative</h3>
            <p>Search a user by email and make them a representative.</p>
          </div>
        </div>

        <div className={Styles.promoteSearchBox}>
          <FaSearch className={Styles.searchIcon} />
          <input
            type="email"
            placeholder="Enter user's email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            autoComplete="email"
          />
        </div>

        {email && !matchedUser && <p className={Styles.assignHint}>No user found with this email.</p>}

        {matchedUser && (
          <div className={Styles.matchCard}>
            <FaUserTie className={Styles.matchIcon} />
            <div className={Styles.matchName}>
              <strong>{matchedUser.first_name || 'Unnamed User'}</strong>
              <span className={Styles.matchEmail}>{matchedUser.email}</span>
              <span className={Styles.matchRole}>Current role: {matchedUser.role || 'user'}</span>
            </div>

            <button
              type="button"
              className={Styles.verifyBtn}
              onClick={handlePromote}
              disabled={promoting || String(matchedUser.role || '').trim().toLowerCase() === 'representative'}
            >
              <FaCheck />
              {promoting
                ? 'Promoting...'
                : String(matchedUser.role || '').trim().toLowerCase() === 'representative'
                ? 'Already Representative'
                : 'Make Representative'}
            </button>
          </div>
        )}

        {promoteError && <p className={Styles.errorText}>{promoteError}</p>}
      </div>

      {/* ============================================================
          SECTION 2 — Manage existing representatives
      ============================================================ */}
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          <div>
            <h3>Representatives</h3>
            <p>Manage representatives, constituency assignments and terms.</p>
          </div>

          <div className={Styles.searchBox}>
            <FaSearch className={Styles.searchIcon} />
            <input
              type="text"
              placeholder="Search name, email, constituency, district"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {listError && <p className={Styles.errorText}>{listError}</p>}

        {loading ? (
          <p>Loading representatives...</p>
        ) : filteredRepresentatives.length === 0 ? (
          <p className={Styles.assignHint}>
            {search ? 'No representatives match your search.' : 'No representatives found.'}
          </p>
        ) : (
          <div className={Styles.tableWrap}>
            <table className={Styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Constituency</th>
                  <th>Ward</th>
                  <th>District</th>
                  <th>Term</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepresentatives.map((representative) => (
                  <tr key={`representative-${representative.id}`}>
                    <td>
                      <strong>{representative.user_name || 'Unnamed User'}</strong>
                    </td>
                    <td>{representative.user_email || '-'}</td>
                    <td>
                      {representative.constituency_name ? (
                        representative.constituency_name
                      ) : (
                        <span className={Styles.muted}>Not assigned</span>
                      )}
                    </td>
                    <td>{representative.constituency_ward || '-'}</td>
                    <td>{representative.district_name || '-'}</td>
                    <td>
                      <div className={Styles.termCell}>
                        <div>
                          <strong>From:</strong> {representative.start_date || '-'}
                        </div>
                        <div>
                          <strong>To:</strong> {representative.end_date || '-'}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={Styles.actionsRow}>
                        <button
                          type="button"
                          className={Styles.editBtn}
                          onClick={() => handleEdit(representative)}
                          title="Edit term"
                        >
                          <FaEdit />
                        </button>



                        <button
                          type="button"
                          className={Styles.deleteBtn}
                          onClick={() => handleDelete(representative)}
                          title="Delete representative"
                        >
                          <FaTrash />
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

      {/* ============================================================
          EDIT MODAL
      ============================================================ */}
      {editingRep && (
        <div className={Styles.modalOverlay} onClick={() => setEditingRep(null)}>
          <div className={Styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Representative</h3>
            <p>{editingRep.user_name || 'Representative'}</p>

            <div className={Styles.constituencyInfoBox}>
              <div>
                <strong>Constituency:</strong> {editingRep.constituency_name || 'Not assigned'}
              </div>
              <div>
                <strong>Ward:</strong> {editingRep.constituency_ward || '-'}
              </div>
              <div>
                <strong>District:</strong> {editingRep.district_name || '-'}
              </div>
            </div>

            <div className={Styles.modalFields}>
              <label>
                <span>Term Started On</span>
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                />
              </label>
              <label>
                <span>Term Ends On</span>
                <input
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                />
              </label>
            </div>

            {editError && <p className={Styles.errorText}>{editError}</p>}

            <div className={Styles.modalActions}>
              <button type="button" onClick={() => setEditingRep(null)} disabled={savingEdit}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}