import React, { useEffect, useState } from 'react'
import Styles from './AddConstitunency.module.css'
import AdminLayout from '../components/dashboard/AdminLayout'
import { FaPlus, FaEdit, FaTrash, FaUserPlus, FaSearch, FaArrowLeft } from 'react-icons/fa'
import {
  getConstituencies,
  getConstituencyTypes,
  createConstituency,
  updateConstituency,
  deleteConstituency,
  assignRepresentative,
} from '../../api/services/Admin/constituencyService.js'
import { getUsers } from '../../api/services/Admin/adminuserview.js'
import { getDistricts } from '../../api/services/Admin/districtService.js'

// Government body categories shown as cards on the landing view.
// Each maps to a Constituency "type" value once matched against the API's type list.
const GOV_BODY_CARDS = [
  { title: 'Add Grama Panchayat', desc: 'Add Grama Panchayat & Ward name.' },
  { title: 'Add Block Panchayat', desc: 'Add Block Panchayat & Ward name.' },
  { title: 'Add District Panchayat', desc: 'Add District Panchayat & Ward name.' },
  { title: 'Add Municipality', desc: 'Add Municipality & Ward name.' },
  { title: 'Add Corporation', desc: 'Add Corporation & Ward name.' },
  { title: 'Add Niyama Sabha', desc: 'Add Niyama Sabha & Ward name.' },
  { title: 'Add Lok Sabha', desc: 'Add Lok Sabha & Ward name.' },
]

// "Add Grama Panchayat" -> "Grama Panchayat"
const govNameFromTitle = (title) => title.replace(/^Add\s+/i, '')

export default function AddConstitunency() {
  // ---------- data ----------
  const [constituencies, setConstituencies] = useState([])
  const [types, setTypes] = useState([])
  const [districts, setDistricts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // ---------- navigation (which gov-body category is open) ----------
  const [openGov, setOpenGov] = useState(null)
  const [search, setSearch] = useState('')

  // ---------- add/edit constituency modal ----------
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', ward_name_no: '', type: '', district: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ---------- assign-representative row state ----------
  const [assigningId, setAssigningId] = useState(null)
  const [repSearch, setRepSearch] = useState('')
  const [matchedRep, setMatchedRep] = useState(null)

  // Only users who already hold the "representative" role are eligible to be assigned.
  const representativeUsers = users.filter(
    (user) => String(user.role || '').trim().toLowerCase() === 'representative'
  )

  // ============================================================
  // Load everything the page needs, once on mount
  // ============================================================
  const fetchAll = async () => {
    setLoading(true)
    try {
      const [constituencyList, typeList, districtList, userList] = await Promise.all([
        getConstituencies(),
        getConstituencyTypes(),
        getDistricts(),
        getUsers(),
      ])

      setConstituencies(constituencyList)
      setTypes(typeList)
      setDistricts(districtList)
      setUsers(Array.isArray(userList) ? userList : [])
    } catch (err) {
      console.error('Failed to load constituency page data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // ============================================================
  // Add / Edit constituency modal
  // ============================================================
  const openAddModal = (govName) => {
    setEditing(null)

    // Pre-select the "type" dropdown to match the category the admin came from
    const matchedType = types.find((t) => t.label?.toLowerCase() === govName?.toLowerCase())

    setForm({
      name: '',
      ward_name_no: '',
      type: matchedType ? matchedType.value : '',
      district: '',
    })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (constituency) => {
    setEditing(constituency)
    setForm({
      name: constituency.name,
      ward_name_no: constituency.ward_name_no || '',
      type: constituency.type,
      district: constituency.district,
    })
    setError('')
    setShowModal(true)
  }

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editing) {
        const updated = await updateConstituency(editing.id, form)
        setConstituencies((prev) => prev.map((c) => (c.id === editing.id ? updated : c)))
      } else {
        const created = await createConstituency(form)
        setConstituencies((prev) => [...prev, created])
      }
      setShowModal(false)
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Could not save constituency.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConstituency = async (id) => {
    if (!window.confirm('Delete this constituency?')) return

    try {
      await deleteConstituency(id)
      setConstituencies((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Failed to delete constituency:', err)
      alert('Could not delete constituency.')
    }
  }

  // ============================================================
  // Assign representative (inline row search, not a dropdown)
  // ============================================================
  const openAssignRow = (constituency) => {
    setAssigningId(constituency.id)
    setRepSearch('')
    setMatchedRep(null)
  }

  const closeAssignRow = () => {
    setAssigningId(null)
    setRepSearch('')
    setMatchedRep(null)
  }

  const handleRepSearchChange = (value) => {
    setRepSearch(value)

    const query = value.trim().toLowerCase()
    if (!query) {
      setMatchedRep(null)
      return
    }

    const match = representativeUsers.find(
      (u) => u.email?.toLowerCase().includes(query) || u.first_name?.toLowerCase().includes(query)
    )
    setMatchedRep(match || null)
  }

  const handleAssignRepresentative = async (constituencyId) => {
    if (!matchedRep) {
      alert('Please search and select a representative.')
      return
    }

    try {
      const updated = await assignRepresentative(constituencyId, matchedRep.id)
      setConstituencies((prev) => prev.map((c) => (c.id === constituencyId ? updated : c)))
      closeAssignRow()
    } catch (err) {
      console.error('Failed to assign representative:', err)
      alert(err.response?.data?.error || err.response?.data?.detail || 'Could not assign representative.')
    }
  }

  // ============================================================
  // Filtering — which constituencies belong to the open category + match the search box
  // ============================================================
  const constituenciesForGov = (govName) =>
    constituencies.filter((c) => {
      const matchesGov = c.type_display?.toLowerCase() === govName.toLowerCase()
      const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase())
      return matchesGov && matchesSearch
    })

  // ============================================================
  // Table for one government-body category
  // ============================================================
  const renderTable = (govName) => {
    const rows = constituenciesForGov(govName)

    return (
      <div className={Styles.tableWrap}>
        <table className={Styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Ward</th>
              <th>Type</th>
              <th>District</th>
              <th>Representative</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.ward_name_no || '—'}</td>
                <td>{c.type_display}</td>
                <td>{c.district_name}</td>

                {/* Representative cell: either the search/assign UI, or the current assignment */}
                <td>
                  {assigningId === c.id ? (
                    <div className={Styles.assignBox}>
                      <div className={Styles.searchBox}>
                        <FaSearch className={Styles.searchIcon} />
                        <input
                          type="text"
                          placeholder="Search by name or email"
                          value={repSearch}
                          onChange={(e) => handleRepSearchChange(e.target.value)}
                          autoFocus
                        />
                      </div>

                      {repSearch && !matchedRep && (
                        <p className={Styles.assignHint}>
                          {representativeUsers.length === 0
                            ? 'No representatives available.'
                            : 'No matching representative found.'}
                        </p>
                      )}

                      {matchedRep && (
                        <div className={Styles.matchCard}>
                          <span className={Styles.matchName}>
                            {matchedRep.first_name || 'Unnamed User'}{' '}
                            <span className={Styles.matchEmail}>({matchedRep.email})</span>
                          </span>
                        </div>
                      )}

                      <div className={Styles.actionsRow}>
                        <button
                          className={Styles.verifyBtn}
                          onClick={() => handleAssignRepresentative(c.id)}
                          disabled={!matchedRep}
                        >
                          Save
                        </button>
                        <button className={Styles.cancelBtn} onClick={closeAssignRow}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={Styles.actionsRow}>
                      {c.representative_name || '— Unassigned —'}
                      <button
                        className={Styles.deleteIconBtn}
                        onClick={() => openAssignRow(c)}
                        aria-label="Assign representative"
                      >
                        <FaUserPlus />
                      </button>
                    </div>
                  )}
                </td>

                <td>
                  <span className={c.is_active ? Styles.badgeActive : Styles.badgeInactive}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td>
                  <div className={Styles.actionsRow}>
                    <button className={Styles.deleteIconBtn} onClick={() => openEditModal(c)} aria-label="Edit">
                      <FaEdit />
                    </button>
                    <button
                      className={Styles.deleteIconBtn}
                      onClick={() => handleDeleteConstituency(c.id)}
                      aria-label="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className={Styles.emptyRow}>
                  {loading ? 'Loading...' : `No ${govName.toLowerCase()} constituencies found.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  // ============================================================
  // Page render
  // ============================================================
  return (
    <AdminLayout title="Add Constituency">
      {!openGov ? (
        // Landing view: one card per government-body category
        <div className={Styles.chartsRow}>
          {GOV_BODY_CARDS.map((card) => {
            const govName = govNameFromTitle(card.title)
            return (
              <div className={Styles.card} key={card.title}>
                <div className={Styles.cardHeader}>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
                <button
                  className={Styles.reportBtn}
                  onClick={() => {
                    setSearch('')
                    setOpenGov(govName)
                  }}
                >
                  View
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        // Detail view: table of constituencies for the selected category
        <div className={Styles.view}>
          <button className={Styles.backBtn} onClick={() => setOpenGov(null)}>
            <FaArrowLeft size={12} />
            Back to categories
          </button>

          <div className={Styles.panel}>
            <div className={Styles.header}>
              <div>
                <h3 className={Styles.heading}>{openGov}</h3>
                <p className={Styles.subheading}>
                  Manage {openGov.toLowerCase()} constituencies and assign representatives.
                </p>
              </div>

              <div className={Styles.actionsRight}>
                <div className={Styles.searchBox}>
                  <FaSearch className={Styles.searchIcon} />
                  <input
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <button className={Styles.addBtn} onClick={() => openAddModal(openGov)}>
                  <FaPlus />
                  Add {openGov}
                </button>
              </div>
            </div>

            {renderTable(openGov)}
          </div>
        </div>
      )}

      {/* Add / Edit constituency modal */}
      {showModal && (
        <div className={Styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={Styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={Styles.modalTitle}>{editing ? 'Edit constituency' : 'Add constituency'}</h3>

            <form onSubmit={handleFormSubmit}>
              <div className={Styles.formSection}>
                <h4 className={Styles.sectionTitle}>Basic details</h4>

                <div className={Styles.inputGroup}>
                  <label>Name</label>
                  <input name="name" value={form.name} onChange={handleFormChange} required />
                </div>

                <div className={Styles.inputGroup}>
                  <label>Ward name / number</label>
                  <input name="ward_name_no" value={form.ward_name_no} onChange={handleFormChange} />
                </div>

                <div className={Styles.inputGroup}>
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleFormChange} required>
                    <option value="">Select type</option>
                    {types.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={Styles.formSection}>
                <h4 className={Styles.sectionTitle}>Location</h4>

                <div className={Styles.inputGroup}>
                  <label>District</label>
                  <select name="district" value={form.district} onChange={handleFormChange} required>
                    <option value="">Select district</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.dname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className={Styles.errorText}>{error}</p>}

              <div className={Styles.modalActions}>
                <button type="button" className={Styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={Styles.submitBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}