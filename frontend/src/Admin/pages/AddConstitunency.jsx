import React, { useEffect, useState } from 'react'
import Styles from './AddConstitunency.module.css'
import AdminLayout from '../components/dashboard/AdminLayout'
import {FaPlus,FaEdit,FaTrash,FaUserPlus,FaSearch,FaArrowLeft, FaPowerOff,} from 'react-icons/fa'
import {getConstituencies,getConstituencyTypes,createConstituency,updateConstituency,deleteConstituency,
  assignRepresentative,} from '../../api/services/Admin/constituencyService.js'
import { getUsers } from '../../api/services/Admin/adminuserview.js'
import { getDistricts } from '../../api/services/Admin/districtService.js'


// GOVERNMENT BODY CATEGORIES
const GOV_BODY_CARDS = [
  {
    typeValue: 'GRAMA_PANCHAYAT',
    title: 'Add Grama Panchayat',
    desc: 'Add Grama Panchayat & Ward name.',
  },
  {
    typeValue: 'BLOCK_PANCHAYAT',
    title: 'Add Block Panchayat',
    desc: 'Add Block Panchayat & Ward name.',
  },
  {
    typeValue: 'DISTRICT_PANCHAYAT',
    title: 'Add District Panchayat',
    desc: 'Add District Panchayat & Ward name.',
  },
  {
    typeValue: 'MUNICIPALITY',
    title: 'Add Municipality',
    desc: 'Add Municipality & Ward name.',
  },
  {
    typeValue: 'CORPORATION',
    title: 'Add Corporation',
    desc: 'Add Corporation & Ward name.',
  },
  {
    typeValue: 'LEGISLATIVE_ASSEMBLY',
    title: 'Add Niyama Sabha',
    desc: 'Add Niyama Sabha & Ward name.',
  },
  {
    typeValue: 'LOK_SABHA',
    title: 'Add Lok Sabha',
    desc: 'Add Lok Sabha & Ward name.',
  },
]


// REMOVE "Add " FROM TITLE
const govNameFromTitle = (title) =>
  title.replace(/^Add\s+/i, '')


export default function AddConstitunency() {
  // DATA
  const [constituencies, setConstituencies] = useState([])
  const [types, setTypes] = useState([])
  const [districts, setDistricts] = useState([])
  const [users, setUsers] = useState([])

  const [loading, setLoading] = useState(true)

  // NAVIGATION
  const [openGov, setOpenGov] = useState(null)
  const [search, setSearch] = useState('')

  // ADD / EDIT MODAL
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const [form, setForm] = useState({
    name: '',
    ward_name_no: '',
    type: '',
    district: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')


  // REPRESENTATIVE ASSIGNMENT
  const [assigningId, setAssigningId] = useState(null)
  const [repSearch, setRepSearch] = useState('')
  const [matchedRep, setMatchedRep] = useState(null)


  // REPRESENTATIVE USERS
  const representativeUsers = users.filter(
    (user) =>
      String(user.role || '')
        .trim()
        .toLowerCase() === 'representative'
  )

  

  // LOAD PAGE DATA
  const fetchAll = async () => {
    setLoading(true)
    const results = await Promise.allSettled([
      getConstituencies(),
      getConstituencyTypes(),
      getDistricts(),
      getUsers(),
    ])

    // CONSTITUENCIES
    if (results[0].status === 'fulfilled') {
      const data = results[0].value
      setConstituencies(
        Array.isArray(data)
          ? data
          : []
      )

    } else {

      console.error(
        'Constituency API failed:',
        results[0].reason
      )

    }


    // ----------------------------------------------------------
    // TYPES
    // ----------------------------------------------------------

    if (results[1].status === 'fulfilled') {

      const data = results[1].value

      setTypes(
        Array.isArray(data)
          ? data
          : []
      )

    } else {

      console.error(
        'Constituency types API failed:',
        results[1].reason
      )

    }


    // ----------------------------------------------------------
    // DISTRICTS
    // ----------------------------------------------------------

    if (results[2].status === 'fulfilled') {

      const data = results[2].value

      setDistricts(
        Array.isArray(data)
          ? data
          : []
      )

    } else {

      console.error(
        'District API failed:',
        results[2].reason
      )

    }


    // ----------------------------------------------------------
    // USERS
    // ----------------------------------------------------------

    if (results[3].status === 'fulfilled') {

      const data = results[3].value

      setUsers(
        Array.isArray(data)
          ? data
          : []
      )

    } else {

      console.error(
        'Users API failed:',
        results[3].reason
      )

    }


    setLoading(false)
  }


  useEffect(() => {
    fetchAll()
  }, [])


  // ============================================================
  // OPEN ADD MODAL
  // ============================================================

  const openAddModal = (govCard) => {

    setEditing(null)

    setForm({
      name: '',
      ward_name_no: '',

      // Directly use the backend enum value
      type: govCard.typeValue,

      district: '',
    })

    setError('')
    setShowModal(true)
  }


  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  const openEditModal = (constituency) => {

    setEditing(constituency)

    setForm({
      name: constituency.name || '',
      ward_name_no: constituency.ward_name_no || '',
      type: constituency.type || '',
      district: constituency.district || '',
    })

    setError('')
    setShowModal(true)
  }


  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleFormChange = (e) => {

    const {
      name,
      value,
    } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }


  // ============================================================
  // SAVE CONSTITUENCY
  // ============================================================

  const handleFormSubmit = async (e) => {

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
          created,
        ])
      }

      setShowModal(false)

    } catch (err) {

      console.error(
        'Failed to save constituency:',
        err
      )

      setError(
        err.response?.data
          ? JSON.stringify(
              err.response.data
            )
          : 'Could not save constituency.'
      )

    } finally {

      setSaving(false)
    }
  }


  // ============================================================
  // DELETE CONSTITUENCY
  // ============================================================

  const handleDeleteConstituency = async (id) => {

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

      console.error(
        'Failed to delete constituency:',
        err
      )

      alert(
        err.response?.data?.error ||
        'Could not delete constituency.'
      )
    }
  }


  // ============================================================
  // OPEN ASSIGN REPRESENTATIVE
  // ============================================================

  const openAssignRow = (constituency) => {

    setAssigningId(
      constituency.id
    )

    setRepSearch('')
    setMatchedRep(null)
  }


  // ============================================================
  // CLOSE ASSIGN ROW
  // ============================================================

  const closeAssignRow = () => {

    setAssigningId(null)
    setRepSearch('')
    setMatchedRep(null)
  }


  // ============================================================
  // SEARCH REPRESENTATIVE
  // ============================================================

  const handleRepSearchChange = (value) => {

    setRepSearch(value)

    const query =
      value
        .trim()
        .toLowerCase()

    if (!query) {

      setMatchedRep(null)
      return
    }


    const match =
      representativeUsers.find(
        (user) => {

          const firstName =
            String(
              user.first_name || ''
            ).toLowerCase()

          const lastName =
            String(
              user.last_name || ''
            ).toLowerCase()

          const email =
            String(
              user.email || ''
            ).toLowerCase()

          return (
            firstName.includes(query) ||
            lastName.includes(query) ||
            email.includes(query)
          )
        }
      )

    setMatchedRep(
      match || null
    )
  }


  // ============================================================
  // ASSIGN REPRESENTATIVE
  // ============================================================

  const handleAssignRepresentative =
    async (constituencyId) => {

      if (!matchedRep) {

        alert(
          'Please search and select a representative.'
        )

        return
      }


      try {

        const updated =
          await assignRepresentative(
            constituencyId,
            matchedRep.id
          )


        setConstituencies((prev) =>
          prev.map((c) =>
            c.id === constituencyId
              ? updated
              : c
          )
        )


        // Refresh users because the selected
        // user's role becomes representative.
        const userList =
          await getUsers()

        setUsers(
          Array.isArray(userList)
            ? userList
            : []
        )


        closeAssignRow()

      } catch (err) {

        console.error(
          'Failed to assign representative:',
          err
        )

        alert(
          err.response?.data?.error ||
          err.response?.data?.detail ||
          'Could not assign representative.'
        )
      }
    }


  // ACTIVATE / DEACTIVATE 
  const handleToggleConstituencyActive = async (constituency) => {
    try {
      const updated = await updateConstituency(constituency.id, { is_active: !constituency.is_active })
      setConstituencies((prev) => prev.map((c) => (c.id === constituency.id ? updated : c)))
    } catch (err) {
      console.error('Failed to toggle constituency status:', err)
      alert(err.response?.data?.error || 'Could not update status.')
    }
  }

  // FILTER CONSTITUENCIES

  const constituenciesForGov =
    (govCard) => {

      if (!govCard) {
        return []
      }

      return constituencies.filter(
        (c) => {

          const matchesGov =
            c.type ===
            govCard.typeValue

          const matchesSearch =
            String(
              c.name || ''
            )
              .toLowerCase()
              .includes(
                search.toLowerCase()
              )

          return (
            matchesGov &&
            matchesSearch
          )
        }
      )
    }


  // RENDER TABLE
  const renderTable = (govCard) => {

    const rows =
      constituenciesForGov(
        govCard
      )

    const govLabel =
      govNameFromTitle(
        govCard.title
      )


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
                <td>{c.type_display ||c.type ||'—'}</td>
                <td>{c.district_name ||'—'}</td>


                {/* =========================================
                    REPRESENTATIVE
                ========================================= */}

                <td>

                  {assigningId === c.id ? (

                    <div
                      className={
                        Styles.assignBox
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
                          type="text"
                          placeholder="Search by name or email"
                          value={repSearch}
                          onChange={(e) =>
                            handleRepSearchChange(
                              e.target.value
                            )
                          }
                          autoFocus
                        />

                      </div>


                      {/* No result */}

                      {repSearch &&
                        !matchedRep && (

                          <p
                            className={
                              Styles.assignHint
                            }
                          >
                            {representativeUsers.length ===
                            0
                              ? 'No users available for assignment.'
                              : 'No matching user found.'}
                          </p>

                        )}


                      {/* Match */}

                      {matchedRep && (

                        <div
                          className={
                            Styles.matchCard
                          }
                        >

                          <span
                            className={
                              Styles.matchName
                            }
                          >

                            {matchedRep.first_name ||
                              'Unnamed User'}

                            {matchedRep.last_name
                              ? ` ${matchedRep.last_name}`
                              : ''}

                            <span
                              className={
                                Styles.matchEmail
                              }
                            >
                              {' '}
                              ({matchedRep.email})
                            </span>

                          </span>

                        </div>

                      )}


                      {/* Actions */}

                      <div
                        className={
                          Styles.actionsRow
                        }
                      >

                        <button
                          type="button"
                          className={
                            Styles.verifyBtn
                          }
                          onClick={() =>
                            handleAssignRepresentative(
                              c.id
                            )
                          }
                          disabled={!matchedRep}
                        >
                          Save
                        </button>


                        <button
                          type="button"
                          className={
                            Styles.cancelBtn
                          }
                          onClick={
                            closeAssignRow
                          }
                        >
                          Cancel
                        </button>

                      </div>

                    </div>

                  ) : (

                    <div
                      className={
                        Styles.actionsRow
                      }
                    >

                      <span>
                        {c.representative_name ||
                          '— Unassigned —'}
                      </span>


                      <button
                        type="button"
                        className={
                          Styles.deleteIconBtn
                        }
                        onClick={() =>
                          openAssignRow(c)
                        }
                        aria-label="Assign representative"
                      >
                        <FaUserPlus />
                      </button>

                    </div>

                  )}

                </td>


                {/* STATUS */}

                  <td>
                    <span className={c.is_active ? Styles.badgeActive : Styles.badgeInactive}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      className={Styles.deleteIconBtn}
                      onClick={() => handleToggleConstituencyActive(c)}
                      aria-label={c.is_active ? 'Deactivate' : 'Activate'}
                      title={c.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <FaPowerOff />
                    </button>
                  </td>


                {/* ACTIONS */}

                <td>

                  <div
                    className={
                      Styles.actionsRow
                    }
                  >

                    <button
                      type="button"
                      className={
                        Styles.deleteIconBtn
                      }
                      onClick={() =>
                        openEditModal(c)
                      }
                      aria-label="Edit"
                    >
                      <FaEdit />
                    </button>


                    <button
                      type="button"
                      className={
                        Styles.deleteIconBtn
                      }
                      onClick={() =>
                        handleDeleteConstituency(
                          c.id
                        )
                      }
                      aria-label="Delete"
                    >
                      <FaTrash />
                    </button>

                  </div>

                </td>

              </tr>

            ))}


            {/* EMPTY */}

            {rows.length === 0 && (

              <tr>

                <td
                  colSpan={7}
                  className={
                    Styles.emptyRow
                  }
                >
                  {loading
                    ? 'Loading...'
                    : `No ${govLabel.toLowerCase()} constituencies found.`}
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    )
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <AdminLayout title="Add Constituency">

      {/* ======================================================
          CATEGORY CARDS
      ====================================================== */}

      {!openGov ? (

        <div
          className={
            Styles.chartsRow
          }
        >

          {GOV_BODY_CARDS.map(
            (card) => (

              <div
                className={
                  Styles.card
                }
                key={
                  card.typeValue
                }
              >

                <div
                  className={
                    Styles.cardHeader
                  }
                >

                  <h3>
                    {card.title}
                  </h3>

                  <p>
                    {card.desc}
                  </p>

                </div>


                <button
                  type="button"
                  className={
                    Styles.reportBtn
                  }
                  onClick={() => {

                    setSearch('')

                    setOpenGov(
                      card
                    )

                  }}
                >
                  View
                </button>

              </div>

            )
          )}

        </div>

      ) : (

        /* ====================================================
           DETAIL VIEW
        ==================================================== */

        <div
          className={
            Styles.view
          }
        >

          <button
            type="button"
            className={
              Styles.backBtn
            }
            onClick={() => {

              setOpenGov(null)
              setSearch('')

            }}
          >

            <FaArrowLeft size={12} />

            Back to categories

          </button>


          <div
            className={
              Styles.panel
            }
          >

            <div
              className={
                Styles.header
              }
            >

              <div>

                <h3
                  className={
                    Styles.heading
                  }
                >
                  {govNameFromTitle(
                    openGov.title
                  )}
                </h3>


                <p
                  className={
                    Styles.subheading
                  }
                >
                  Manage{' '}

                  {govNameFromTitle(
                    openGov.title
                  ).toLowerCase()}

                  {' '}constituencies and
                  assign representatives.

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
                    type="text"
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
                  type="button"
                  className={
                    Styles.addBtn
                  }
                  onClick={() =>
                    openAddModal(
                      openGov
                    )
                  }
                >

                  <FaPlus />

                  Add{' '}

                  {govNameFromTitle(
                    openGov.title
                  )}

                </button>

              </div>

            </div>


            {renderTable(
              openGov
            )}

          </div>

        </div>

      )}


      {/* ======================================================
          ADD / EDIT MODAL
      ====================================================== */}

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
            className={
              Styles.modal
            }
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
                handleFormSubmit
              }
            >

              {/* BASIC DETAILS */}

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
                      handleFormChange
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
                      handleFormChange
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
                      handleFormChange
                    }
                    required
                  >

                    <option value="">
                      Select type
                    </option>


                    {types.map(
                      (type) => (

                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {type.label}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* LOCATION */}

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
                      handleFormChange
                    }
                    required
                  >

                    <option value="">
                      Select district
                    </option>


                    {districts.map(
                      (district) => (

                        <option
                          key={
                            district.id
                          }
                          value={
                            district.id
                          }
                        >
                          {district.dname}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* ERROR */}

              {error && (

                <p
                  className={
                    Styles.errorText
                  }
                >
                  {error}
                </p>

              )}


              {/* MODAL ACTIONS */}

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

