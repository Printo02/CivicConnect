import React, { useEffect,useRef,useState} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaUserTie,
  FaTimes
} from 'react-icons/fa'

import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './AddConstitunency.module.css'

import {
  getConstituencies,
  createConstituency,
  updateConstituency,
  deleteConstituency
} from '../../api/services/Admin/constituencyService.js'

import {
  assignRepresentative,
  getAvailableRepresentativeUsers
} from '../../api/services/Admin/representativeService.js'

import {
  getDistricts
} from '../../api/services/Admin/districtService.js'


// ============================================================
// GOVERNMENT CONFIGURATION
// ============================================================

const GOV_CONFIG = {

  'grama-panchayat': {
    type: 'GRAMA_PANCHAYAT',
    title: 'Grama Panchayat',
    local: true,
    showRepresentative: false,
    showWard: false,
  },

  'block-panchayat': {
    type: 'BLOCK_PANCHAYAT',
    title: 'Block Panchayat',
    local: true,
    showRepresentative: false,
    showWard: false,
  },

  'district-panchayat': {
    type: 'DISTRICT_PANCHAYAT',
    title: 'District Panchayat',
    local: true,
    showRepresentative: false,
    showWard: false,
  },

  'municipality': {
    type: 'MUNICIPALITY',
    title: 'Municipality',
    local: true,
    showRepresentative: false,
    showWard: false,
  },

  'corporation': {
    type: 'CORPORATION',
    title: 'Corporation',
    local: true,
    showRepresentative: false,
    showWard: false,
  },

  'niyama-sabha': {
    type: 'LEGISLATIVE_ASSEMBLY',
    title: 'Niyama Sabha',
    local: false,
    showRepresentative: true,
    showWard: false,
  },

  'lok-sabha': {
    type: 'LOK_SABHA',
    title: 'Lok Sabha',
    local: false,
    showRepresentative: true,
    showWard: false,
  },
}


// ============================================================
// PAGINATION
// ============================================================

const PAGE_SIZE = 20


// ============================================================
// COMPONENT
// ============================================================

export default function ConstituencyList() {

  const navigate = useNavigate()
  const { government } = useParams()

  const config = GOV_CONFIG[government]

  // ==========================================================
  // STATE
  // ==========================================================

  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  })

  const [constituencies, setConstituencies] = useState([])
  const [districts, setDistricts] = useState([])

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  // Used to debounce search
  const searchTimer = useRef(null)

  // ==========================================================
  // MODAL
  // ==========================================================

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    ward_name_no: '',
    type: '',
    district: '',
  })


  // ==========================================================
  // REPRESENTATIVE ASSIGNMENT
  // ==========================================================

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningConstituency, setAssigningConstituency] = useState(null)
  const [availableRepresentatives, setAvailableRepresentatives] = useState([])
  const [representativeSearch, setRepresentativeSearch] = useState('')
  const [selectedRepresentative, setSelectedRepresentative] = useState(null)
  const [loadingRepresentatives, setLoadingRepresentatives] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')


  // ==========================================================
  // LOAD DISTRICTS
  // ==========================================================

  const loadDistricts = async () => {

    try {

      const districtData = await getDistricts()

      setDistricts(
        Array.isArray(districtData)
          ? districtData
          : districtData?.results || []
      )

    } catch (err) {

      console.error(
        'Failed to load districts:',
        err
      )

    }
  }


  // ==========================================================
  // LOAD CONSTITUENCIES
  // ==========================================================

  const loadData = async () => {

    if (!config) {
      return
    }

    setLoading(true)

    try {
        const constituencyData = await getConstituencies({
          type: config.type,
          page,
          page_size: PAGE_SIZE,
          search: search.trim() || undefined,
          district: selectedDistrict || undefined,
        })

      setConstituencies(constituencyData?.results || [])


      setPagination({count: constituencyData?.count || 0,
        next: constituencyData?.next || null,
        previous: constituencyData?.previous || null})
    } catch (err) {

      console.error('Failed to load constituency data:',err)

      setConstituencies([])

      setPagination({
        count: 0,
        next: null,
        previous: null,
      })

    } finally {

      setLoading(false)

    }
  }


  // ==========================================================
  // LOAD DISTRICTS ONCE / GOVERNMENT CHANGE
  // ==========================================================

  useEffect(() => {

    if (!config) {
      return
    }

    loadDistricts()

  }, [government])


// ==========================================================
// LOAD DATA WHEN PAGE / FILTER CHANGES
// ==========================================================

  useEffect(() => {

    if (!config) {
      return
    }

    // Clear previous timer
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
    }

    // Debounce API request
    searchTimer.current = setTimeout(() => {
      loadData()}, 400)

    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current)
      }
    }

  }, [government,page,search,selectedDistrict])


  // ==========================================================
  // RESET FILTER
  // ==========================================================

  const resetFilters = () => {
    setSearch('')
    setSelectedDistrict('')
  }


  // ==========================================================
  // REPRESENTATIVE ASSIGNMENT
  // ==========================================================

  const loadAvailableRepresentatives = async () => {
    try {
      setLoadingRepresentatives(true)
      setAssignError('')

      const data = await getAvailableRepresentativeUsers()

      setAvailableRepresentatives(
        Array.isArray(data)
          ? data
          : data?.results || []
      )
    } catch (err) {
      console.error('Failed to load representatives:', err)
      setAvailableRepresentatives([])
      setAssignError(
        err.response?.data?.error ||
        'Could not load available representatives.'
      )
    } finally {
      setLoadingRepresentatives(false)
    }
  }

  const openAssignRepresentative = async (item) => {
    setAssigningConstituency(item)
    setSelectedRepresentative(null)
    setRepresentativeSearch('')
    setAssignError('')
    setShowAssignModal(true)
    await loadAvailableRepresentatives()
  }

  const filteredRepresentatives = availableRepresentatives.filter((representative) => {
    const query = representativeSearch.trim().toLowerCase()
    if (!query) return true

    return (
      representative.name?.toLowerCase().includes(query) ||
      representative.email?.toLowerCase().includes(query)
    )
  })

  const handleAssignRepresentative = async () => {
    if (!assigningConstituency || !selectedRepresentative) {
      setAssignError('Please select a representative.')
      return
    }

    const currentName = assigningConstituency.representative_name
    const message = currentName
      ? `This will replace ${currentName} as the representative for ${assigningConstituency.name}. The previous representative account will be deactivated. Continue?`
      : `Assign ${selectedRepresentative.name} to ${assigningConstituency.name}?`

    if (!window.confirm(message)) return

    try {
      setAssigning(true)
      setAssignError('')

      await assignRepresentative(
        assigningConstituency.id,
        {
          representative: selectedRepresentative.user_id
        }
      )

      setShowAssignModal(false)
      setAssigningConstituency(null)
      setSelectedRepresentative(null)
      setRepresentativeSearch('')
      await loadData()
    } catch (err) {
      console.error('Representative assignment failed:', err)
      setAssignError(
        err.response?.data?.error ||
        'Could not assign representative.'
      )
    } finally {
      setAssigning(false)
    }
  }


  // ==========================================================
  // OPEN ADD
  // ==========================================================

  const openAdd = () => {

    setEditing(null)

    setForm({
      name: '',
      ward_name_no: '',
      type: config.type,
      district: '',
    })

    setError('')
    setShowModal(true)
  }


  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name || '',
      ward_name_no: item.ward_name_no || '',
      type: item.type || config.type,
      district: item.district || '',
    })

    setError('')
    setShowModal(true)
  }


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const {
      name,
      value
    } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

  }


  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        type: config.type,
      }


      // Remove ward for Assembly / Lok Sabha
      if (!config.showWard) {
        delete payload.ward_name_no
      }


      if (editing) {
        await updateConstituency(
          editing.id,
          payload
        )
      } else {
        await createConstituency(
          payload
        )
      }


      setShowModal(false)
      setEditing(null)
      // Reload current page
      await loadData()
    } catch (err) {
      console.error('Failed to save:',err)

      setError(err.response?.data
          ? JSON.stringify(err.response.data): 'Could not save constituency.')
    } finally {
      setSaving(false)
    }

  }


  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (id) => {

    if (
      !window.confirm(
        `Delete this ${config.title}?`
      )
    ) {
      return
    }

    try {

      await deleteConstituency(id)

      /*
       * If deleting the last item on a page,
       * move to previous page.
       */
      if (
        constituencies.length === 1 &&
        page > 1
      ) {

        setPage(
          (previous) =>
            previous - 1
        )

      } else {

        await loadData()

      }

    } catch (err) {

      console.error(
        'Delete failed:',
        err
      )

      alert(
        err.response?.data?.error ||
        'Could not delete.'
      )

    }

  }


  // ==========================================================
  // STATUS
  // ==========================================================

  const toggleStatus = async (item) => {

    try {

      await updateConstituency(
        item.id,
        {
          is_active:
            !item.is_active,
        }
      )

      await loadData()

    } catch (err) {

      console.error(
        'Status update failed:',
        err
      )

      alert(
        err.response?.data?.error ||
        'Could not update status.'
      )

    }

  }


  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages =
    Math.ceil(
      pagination.count / PAGE_SIZE
    )


  const goToPreviousPage = () => {

    if (
      pagination.previous &&
      page > 1
    ) {

      setPage(
        (previous) =>
          previous - 1
      )

    }

  }


  const goToNextPage = () => {

    if (
      pagination.next &&
      page < totalPages
    ) {

      setPage(
        (previous) =>
          previous + 1
      )

    }

  }


  // ==========================================================
  // CURRENT TABLE ROWS
  // ==========================================================

  const rows = constituencies || []

  // ==========================================================
  // INVALID GOVERNMENT
  // ==========================================================

  if (!config) {
    return (
      <AdminLayout title="Constituency Management">
        <div className={Styles.emptyPage}>
          <h2>Government type not found</h2>
          <button type="button" onClick={() => navigate('/admin/constituencies')}>Back</button>
        </div>
      </AdminLayout>
    )
  }


  // ==========================================================
  // DISPLAY RANGE
  // ==========================================================

  const showingFrom =
    pagination.count === 0
      ? 0
      : ((page - 1) * PAGE_SIZE) + 1


  const showingTo =
    Math.min(
      page * PAGE_SIZE,
      pagination.count
    )


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <AdminLayout
      title={`${config.title} - Constituency Management`}
    >

      <div className={Styles.listPage}>

        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <div className={Styles.listTopBar}>

          <div>

            <button
              type="button"
              className={Styles.backBtn}
              onClick={() =>
                navigate(
                  '/admin/constituencies'
                )
              }
            >

              <FaArrowLeft />

              Constituency Management

            </button>


            <h1 className={Styles.listTitle}>
              {config.title}
            </h1>


            <p className={Styles.listSubtitle}>
              Manage {config.title.toLowerCase()}
              {config.local
                ? 's and wards'
                : ' constituencies'}
            </p>

          </div>


          {/* ==================================================
              ACTION AREA
          ================================================== */}

          <div className={Styles.listActions}>

            {/* SEARCH */}

            <div className={Styles.searchBox}>

              <FaSearch
                className={Styles.searchIcon}
              />

              <input
                type="text"
                placeholder={
                  config.local
                    ? `Search ${config.title.toLowerCase()}...`
                    : `Search constituency...`
                }
                value={search}
                onChange={(e) => {

                  setSearch(
                    e.target.value
                  )

                  setPage(1)

                }}
              />

            </div>


            {/* DISTRICT */}

            <select
              className={
                Styles.districtFilter
              }
              value={
                selectedDistrict
              }
              onChange={(e) => {

                setSelectedDistrict(
                  e.target.value
                )

                setPage(1)

              }}
            >

              <option value="">
                All Districts
              </option>


              {districts.map(
                (district) => (

                  <option
                    key={district.id}
                    value={district.id}
                  >
                    {district.dname}
                  </option>

                )
              )}

            </select>


            {/* RESET */}

            {(search || selectedDistrict) && (

              <button
                type="button"
                className={Styles.resetBtn}
                onClick={resetFilters}
              >
                Reset
              </button>

            )}


            {/* ADD */}

            <button type="button" className={Styles.addBtn}
              onClick={openAdd}
            >

              <FaPlus />

              Add

            </button>

          </div>

        </div>


        {/* ====================================================
            TABLE
        ==================================================== */}

        <div className={Styles.tableCard}>

          <div className={Styles.tableHeader}>

            <div>

              <h3>
                {config.title}
              </h3>

              <span>
                {pagination.count} records
              </span>

            </div>

          </div>


          <div className={Styles.tableWrap}>

            <table className={Styles.table}>

              <thead>

                <tr>

                  <th>
                    Sl. No.
                  </th>

                  <th>
                    Name
                  </th>

                  <th>
                    District
                  </th>


                  {config.showWard && (
                    <th>
                      Ward
                    </th>
                  )}


                  {config.showRepresentative && (
                    <th>
                      Representative
                    </th>
                  )}


                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={
                        5 +
                        (config.showWard
                          ? 1
                          : 0) +
                        (config.showRepresentative
                          ? 1
                          : 0)
                      }
                      className={
                        Styles.emptyRow
                      }
                    >
                      Loading...
                    </td>

                  </tr>

                ) : rows.length === 0 ? (

                  <tr>

                    <td
                      colSpan={
                        5 +
                        (config.showWard
                          ? 1
                          : 0) +
                        (config.showRepresentative
                          ? 1
                          : 0)
                      }
                      className={
                        Styles.emptyRow
                      }
                    >

                      {search ||
                      selectedDistrict
                        ? 'No matching records found.'
                        : `No ${config.title.toLowerCase()} records found.`}

                    </td>

                  </tr>

                ) : (

                  rows.map(
                    (item, index) => (

                      <tr key={item.id}>

                        {/* SL NO */}

                        <td
                          className={
                            Styles.serialNo
                          }
                        >
                          {
                            ((page - 1) *
                              PAGE_SIZE) +
                            index +
                            1
                          }
                        </td>


                        {/* NAME */}

                        <td>

                          <div
                            className={
                              Styles.nameCell
                            }
                          >

                            <strong>
                              {item.name}
                            </strong>

                          </div>

                        </td>


                        {/* DISTRICT */}

                        <td>
                          {item.district_name ||
                            '—'}
                        </td>


                        {/* WARD */}

                        {config.showWard && (

                          <td>
                            {item.ward_name_no ||
                              '—'}
                          </td>

                        )}


                        {/* REPRESENTATIVE */}

                        {config.showRepresentative && (

                          <td>
                            {item.representative_name ||
                              '— Unassigned —'}
                          </td>

                        )}


                        {/* STATUS */}

                        <td>

                          <button
                            type="button"
                            className={
                              item.is_active
                                ? Styles.statusActive
                                : Styles.statusInactive
                            }
                            onClick={() =>
                              toggleStatus(
                                item
                              )
                            }
                            title={
                              item.is_active
                                ? 'Click to deactivate'
                                : 'Click to activate'
                            }
                          >

                            <span
                              className={
                                Styles.statusDot
                              }
                            />

                            {item.is_active
                              ? 'Active'
                              : 'Inactive'}

                          </button>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div
                            className={
                              Styles.tableActions
                            }
                          >

                            <button
                              type="button"
                              className={
                                Styles.actionBtn
                              }
                              onClick={() =>
                                openEdit(
                                  item
                                )
                              }
                              title="Edit"
                            >
                              <FaEdit />
                            </button>


                            {config.showRepresentative && (
                              <button
                                type="button"
                                className={Styles.actionBtn}
                                onClick={() =>
                                  openAssignRepresentative(item)
                                }
                                title={
                                  item.representative_name
                                    ? 'Reassign Representative'
                                    : 'Assign Representative'
                                }
                              >
                                <FaUserTie />
                              </button>
                            )}

                            <button
                              type="button"
                              className={
                                Styles.actionBtnDanger
                              }
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              title="Delete"
                            >
                              <FaTrash />
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>


          {/* ==================================================
              PAGINATION
          ================================================== */}

          {pagination.count > 0 && (

            <div
              className={
                Styles.pagination
              }
            >

              <div
                className={
                  Styles.paginationInfo
                }
              >

                Showing{' '}

                <strong>
                  {showingFrom}
                </strong>

                {' – '}

                <strong>
                  {showingTo}
                </strong>

                {' of '}

                <strong>
                  {pagination.count}
                </strong>

                {' records'}

              </div>


              <div
                className={
                  Styles.paginationControls
                }
              >

                <button
                  type="button"
                  className={
                    Styles.paginationBtn
                  }
                  disabled={
                    !pagination.previous ||
                    loading
                  }
                  onClick={
                    goToPreviousPage
                  }
                >
                  Previous
                </button>


                <div
                  className={
                    Styles.pageNumber
                  }
                >

                  Page{' '}

                  <strong>
                    {page}
                  </strong>

                  {' of '}

                  <strong>
                    {totalPages}
                  </strong>

                </div>


                <button
                  type="button"
                  className={
                    Styles.paginationBtn
                  }
                  disabled={
                    !pagination.next ||
                    loading
                  }
                  onClick={
                    goToNextPage
                  }
                >
                  Next
                </button>

              </div>

            </div>

          )}

        </div>

      </div>


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
            className={Styles.modal}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div
              className={
                Styles.modalHeader
              }
            >

              <div>

                <h2>
                  {editing
                    ? `Edit ${config.title}`
                    : `Add ${config.title}`}
                </h2>

                <p>
                  Enter the required details below.
                </p>

              </div>

            </div>


            <form
              onSubmit={handleSubmit}
            >

              {/* NAME */}

              <div
                className={
                  Styles.inputGroup
                }
              >

                <label>
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={
                    `Enter ${config.title.toLowerCase()} name`
                  }
                  required
                />

              </div>


              {/* WARD */}
{/* 
              {config.showWard && (

                <div
                  className={
                    Styles.inputGroup
                  }
                >

                  <label>
                    Ward Name / Number
                  </label>

                  <input
                    type="text"
                    name="ward_name_no"
                    value={
                      form.ward_name_no
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter ward name or number"
                  />

                </div>

              )} */}


              {/* DISTRICT */}

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

                  {districts.map(
                    (district) => (

                      <option
                        key={district.id}
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


              {/* ERROR */}

              {error && (

                <div
                  className={
                    Styles.errorText
                  }
                >
                  {error}
                </div>

              )}


              {/* ACTIONS */}

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
                    : editing
                    ? 'Update'
                    : 'Save'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================================
          ASSIGN / REASSIGN REPRESENTATIVE MODAL
      ====================================================== */}

      {showAssignModal && assigningConstituency && (
        <div
          className={Styles.modalOverlay}
          onClick={() => {
            if (!assigning) setShowAssignModal(false)
          }}
        >
          <div
            className={Styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={Styles.modalHeader}>
              <div>
                <h2>
                  {assigningConstituency.representative_name
                    ? 'Reassign Representative'
                    : 'Assign Representative'}
                </h2>
                <p>{assigningConstituency.name}</p>
              </div>

              <button
                type="button"
                className={Styles.modalCloseBtn}
                onClick={() => {
                  if (!assigning) setShowAssignModal(false)
                }}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>

            {assigningConstituency.representative_name && (
              <div className={Styles.currentRepresentative}>
                <span className={Styles.currentRepresentativeLabel}>
                  Current Representative
                </span>
                <strong>
                  {assigningConstituency.representative_name}
                </strong>
                {assigningConstituency.representative_email && (
                  <span>
                    {assigningConstituency.representative_email}
                  </span>
                )}
              </div>
            )}

            <div className={Styles.inputGroup}>
              <label>Search Representative</label>
              <div className={Styles.searchBox}>
                <FaSearch className={Styles.searchIcon} />
                <input
                  type="text"
                  value={representativeSearch}
                  onChange={(e) =>
                    setRepresentativeSearch(e.target.value)
                  }
                  placeholder="Search by name or email..."
                  disabled={loadingRepresentatives || assigning}
                />
              </div>
            </div>

            <div className={Styles.representativeSelectList}>
              {loadingRepresentatives ? (
                <div className={Styles.emptyRow}>
                  Loading representatives...
                </div>
              ) : filteredRepresentatives.length === 0 ? (
                <div className={Styles.emptyRow}>
                  {representativeSearch
                    ? 'No representatives match your search.'
                    : 'No unassigned representatives available.'}
                </div>
              ) : (
                filteredRepresentatives.map((representative) => (
                  <button
                    type="button"
                    key={representative.representative_id || representative.user_id}
                    className={
                      selectedRepresentative?.user_id === representative.user_id
                        ? Styles.representativeOptionSelected
                        : Styles.representativeOption
                    }
                    onClick={() =>
                      setSelectedRepresentative(representative)
                    }
                    disabled={assigning}
                  >
                    <div className={Styles.representativeAvatar}>
                      <FaUserTie />
                    </div>

                    <div className={Styles.representativeInfo}>
                      <strong>
                        {representative.name || 'Unnamed Representative'}
                      </strong>
                      <span>{representative.email}</span>
                    </div>

                    {selectedRepresentative?.user_id === representative.user_id && (
                      <span className={Styles.selectedIndicator}>
                        Selected
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {assigningConstituency.representative_name && (
              <div className={Styles.assignmentWarning}>
                <strong>Reassignment notice</strong>
                <span>
                  Assigning a new representative will deactivate the
                  current representative's account.
                </span>
              </div>
            )}

            {assignError && (
              <div className={Styles.errorText}>
                {assignError}
              </div>
            )}

            <div className={Styles.modalActions}>
              <button
                type="button"
                className={Styles.cancelBtn}
                onClick={() => {
                  if (!assigning) setShowAssignModal(false)
                }}
                disabled={assigning}
              >
                Cancel
              </button>

              <button
                type="button"
                className={Styles.submitBtn}
                onClick={handleAssignRepresentative}
                disabled={assigning || !selectedRepresentative}
              >
                {assigning
                  ? 'Assigning...'
                  : assigningConstituency.representative_name
                    ? 'Reassign Representative'
                    : 'Assign Representative'}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>

  )
}