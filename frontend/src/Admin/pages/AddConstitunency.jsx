import React, { useEffect, useState } from 'react'
import Styles from './AddConstitunency.module.css'
import AdminLayout from '../components/dashboard/AdminLayout'
import { FaPlus, FaEdit, FaTrash, FaUserPlus,  FaSearch, FaArrowLeft } from 'react-icons/fa'
import { getConstituencies, getConstituencyTypes,  createConstituency, updateConstituency, deleteConstituency, assignRepresentative, } from '../../api/services/Admin/constituencyService.js'
import { getUsers } from '../../api/services/Admin/adminuserview.js'
import { getDistricts } from '../../api/services/Admin/districtService.js'


export default function AddConstitunency() {

  const [constituencies, setConstituencies] = useState([])
  const [types, setTypes] = useState([])
  const [districts, setDistricts] = useState([])
  const [users, setUsers] = useState([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    name: '',
    ward_name_no: '',
    type: '',
    district: ''
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [assigningId, setAssigningId] = useState(null)
  const [repSearch, setRepSearch] = useState('')
  const [matchedRep, setMatchedRep] = useState(null)

  const [openGov, setOpenGov] = useState(null)



  // LOAD DATA
  const fetchAll = async () => {
    setLoading(true)
    try {
      const [c, t, d, u] = await Promise.all([
        getConstituencies(),
        getConstituencyTypes(),
        getDistricts(),
        getUsers(),
      ])

      setConstituencies(c)
      setTypes(t)
      setDistricts(d)
      setUsers(Array.isArray(u) ? u : [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // ONLY REPRESENTATIVES
  const representativeUsers = users.filter(
    (user) =>
      String(user.role || '')
        .trim()
        .toLowerCase() === 'representative'
  )

  // ADD CONSTITUENCY

  const openAdd = (govName) => {
    setEditing(null)
    const matchedType = types.find(
      (t) =>
        t.label?.toLowerCase() ===
        govName?.toLowerCase()
    )

    setForm({
      name: '',
      ward_name_no: '',
      type: matchedType
        ? matchedType.value
        : '',
      district: ''
    })

    setError('')
    setShowModal(true)
  }


  // EDIT CONSTITUENCY
  const openEdit = (c) => {
    setEditing(c)
    setForm({
      name: c.name,
      ward_name_no: c.ward_name_no || '',
      type: c.type,
      district: c.district
    })

    setError('')
    setShowModal(true)
  }

  // FORM CHANGE
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

  }


  // SAVE CONSTITUENCY
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const updated =
          await updateConstituency(
            editing.id,
            form
          )
        setConstituencies((prev) =>
          prev.map((c) =>
            c.id === editing.id
              ? updated
              : c
          )
        )
      } else {
        const created =
          await createConstituency(form)
        setConstituencies((prev) => [
          ...prev,
          created
        ])
      }
      setShowModal(false)
    } catch (err) {
      setError(
        JSON.stringify(
          err.response?.data
        ) ||
        'Could not save constituency.'
      )
    } finally {
      setSaving(false)
    }
  }

  // DELETE CONSTITUENCY

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Delete this constituency?'
      )
    ) {
      return
    }
    try {
      await deleteConstituency(id)
      setConstituencies((prev) =>
        prev.filter(
          (c) => c.id !== id
        )
      )
    } catch (err) {
      console.error(err)
      alert(
        'Could not delete constituency.'
      )
    }
  }

  // OPEN ASSIGN REPRESENTATIVE
  const openAssign = (c) => {
    setAssigningId(c.id)
    setRepSearch('')
    setMatchedRep(null)
  }

  const handleRepSearch = (value) => {
    setRepSearch(value)

    const trimmed = value.trim().toLowerCase()
    if (!trimmed) {
      setMatchedRep(null)
      return
    }

    const match = representativeUsers.find(
      (u) => u.email?.toLowerCase().includes(trimmed) || u.first_name?.toLowerCase().includes(trimmed)
    )
    setMatchedRep(match || null)
  }


  // ASSIGN REPRESENTATIVE

  const handleAssign = async (id) => {
    if (!matchedRep) {
      alert('Please search and select a representative.')
      return
    }

    try {
      const updated = await assignRepresentative(id, matchedRep.id)

      setConstituencies((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      )

      setAssigningId(null)
      setRepSearch('')
      setMatchedRep(null)
    } catch (err) {
      console.error(err)
      alert(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Could not assign representative.'
      )
    }
  }


  // FILTER CONSTITUENCIES

  const add = [ { title: 'Add Grama Panchayat', desc: 'Add Grama Panchayat & Ward name.'},
    { title: 'Add Block Panchayat', desc: 'Add Block Panchayat & Ward name.'},
    { title: 'Add District Panchayat', desc: 'Add District Panchayat & Ward name.'},
    { title: 'Add Municipality', desc: 'Add Municipality & Ward name.'},
    { title: 'Add Corporation', desc: 'Add Corporation & Ward name.' },
    { title: 'Add Niyama Sabha', desc: 'Add Niyama Sabha & Ward name.'},
    { title: 'Add Lok Sabha', desc: 'Add Lok Sabha & Ward name.'},
  ]

  const govNameOf = (title) =>
    title.replace(/^Add\s+/i, '')

  const constituenciesForGov = (govName) =>
    constituencies.filter((c) => {

      const matchesGov =
        c.type_display?.toLowerCase() ===
        govName.toLowerCase()

        const matchesSearch =
        c.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
      return ( matchesGov && matchesSearch)
    })
  // TABLE
  const renderTable = (govName) => {
    const rows =
      constituenciesForGov(govName)

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
                {/* REPRESENTATIVE */}
                <td>
                {assigningId === c.id ? (
                    <div className={Styles.assignBox}>
                      <div className={Styles.searchBox}>
                        <FaSearch className={Styles.searchIcon} />
                        <input
                          type="text"
                          placeholder="Search by name or email"
                          value={repSearch}
                          onChange={(e) => handleRepSearch(e.target.value)}
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
                          onClick={() => handleAssign(c.id)}
                          disabled={!matchedRep}
                        >
                          Save
                        </button>
                        <button
                          className={Styles.cancelBtn}
                          onClick={() => {
                            setAssigningId(null)
                            setRepSearch('')
                            setMatchedRep(null)
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={Styles.actionsRow}>
                      {c.representative_name || '— Unassigned —'}
                      <button
                        className={Styles.deleteIconBtn}
                        onClick={() => openAssign(c)}
                        aria-label="Assign representative"
                      >
                        <FaUserPlus />
                      </button>
                    </div>
                  )}
                </td>
                {/* STATUS */}
                <td>
                  <span className={ c.is_active ? Styles.badgeActive : Styles.badgeInactive }>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {/* ACTIONS */}
                <td>
                  <div className={Styles.actionsRow} >
                    <button className={Styles.deleteIconBtn}
                      onClick={() => openEdit(c)} aria-label="Edit">
                      <FaEdit />
                    </button>
                    <button className={Styles.deleteIconBtn} onClick={() => handleDelete(c.id)} aria-label="Delete">
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

  // RENDER
  return (
    <AdminLayout title="Add Constituency">
      {!openGov ? (
        <div className={Styles.chartsRow}>
          {add.map((a) => {const govName = govNameOf(a.title)
            return (
              <div className={Styles.card} key={a.title}>
                <div className={Styles.cardHeader}>
                  <h3>{a.title}</h3>
                  <p>{a.desc}</p>
                </div>
                <button className={Styles.reportBtn}
                  onClick={() => { setSearch('')
                    setOpenGov(govName)
                  }}>View</button>
              </div>
            )})}
        </div>
      ) : (
        <div className={Styles.view}>
          <button className={Styles.backBtn} onClick={() =>setOpenGov(null)}>
            <FaArrowLeft size={12} />
            Back to categories
          </button>


          <div
            className={Styles.panel}
          >

            <div
              className={Styles.header}
            >

              <div>

                <h3
                  className={
                    Styles.heading
                  }
                >
                  {openGov}
                </h3>

                <p
                  className={
                    Styles.subheading
                  }
                >
                  Manage{' '}
                  {openGov.toLowerCase()}{' '}
                  constituencies and assign
                  representatives.
                </p>

              </div>


              <div
                className={
                  Styles.actionsRight
                }
              >

                <div
                  className={
                    Styles.searchBox
                  }
                >

                  <FaSearch
                    className={
                      Styles.searchIcon
                    }
                  />

                  <input
                    placeholder="Search"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />

                </div>


                <button
                  className={
                    Styles.addBtn
                  }
                  onClick={() =>
                    openAdd(openGov)
                  }
                >

                  <FaPlus />

                  Add {openGov}

                </button>

              </div>

            </div>


            {renderTable(openGov)}

          </div>

        </div>

      )}


      {/* ================================================
          ADD / EDIT MODAL
      ================================================ */}

      {showModal && (

        <div
          className={
            Styles.modalOverlay
          }
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className={Styles.modal}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3
              className={
                Styles.modalTitle
              }
            >
              {editing
                ? 'Edit constituency'
                : 'Add constituency'}
            </h3>


            <form
              onSubmit={
                handleSubmit
              }
            >

              <div
                className={
                  Styles.formSection
                }
              >

                <h4
                  className={
                    Styles.sectionTitle
                  }
                >
                  Basic details
                </h4>


                <div
                  className={
                    Styles.inputGroup
                  }
                >

                  <label>
                    Name
                  </label>

                  <input
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                <div
                  className={
                    Styles.inputGroup
                  }
                >

                  <label>
                    Ward name / number
                  </label>

                  <input
                    name="ward_name_no"
                    value={
                      form.ward_name_no
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div
                  className={
                    Styles.inputGroup
                  }
                >

                  <label>
                    Type
                  </label>

                  <select
                    name="type"
                    value={
                      form.type
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select type
                    </option>

                    {types.map((t) => (

                      <option
                        key={t.value}
                        value={t.value}
                      >
                        {t.label}
                      </option>

                    ))}

                  </select>

                </div>

              </div>


              <div
                className={
                  Styles.formSection
                }
              >

                <h4
                  className={
                    Styles.sectionTitle
                  }
                >
                  Location
                </h4>


                <div
                  className={
                    Styles.inputGroup
                  }
                >

                  <label>
                    District
                  </label>

                  <select
                    name="district"
                    value={
                      form.district
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select district
                    </option>

                    {districts.map((d) => (

                      <option
                        key={d.id}
                        value={d.id}
                      >
                        {d.dname}
                      </option>

                    ))}

                  </select>

                </div>

              </div>


              {error && (

                <p
                  className={
                    Styles.errorText
                  }
                >
                  {error}
                </p>

              )}


              <div
                className={
                  Styles.modalActions
                }
              >

                <button
                  type="button"
                  className={
                    Styles.cancelBtn
                  }
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className={
                    Styles.submitBtn
                  }
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Save'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </AdminLayout>
  )
}