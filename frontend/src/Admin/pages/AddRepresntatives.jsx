import React, { useEffect, useMemo, useState } from 'react'
import Styles from './AddRepresntatives.module.css'
import AdminLayout from '../components/dashboard/AdminLayout'
import {
  FaSearch,
  FaCheck,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown
} from 'react-icons/fa'

import { getUsers } from '../../api/services/Admin/adminuserview.js'
import { getConstituencies } from '../../api/services/Admin/constituencyService.js'

import {
  getRepresentatives,
  deleteRepresentative,
  toggleRepresentativeStatus,
  getAvailableRepresentativeUsers,
  createRepresentative
} from '../../api/services/Admin/representativeService.js'


const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'GRAMA_PANCHAYAT', label: 'Grama Panchayat' },
  { value: 'BLOCK_PANCHAYAT', label: 'Block Panchayat' },
  { value: 'DISTRICT_PANCHAYAT', label: 'District Panchayat' },
  { value: 'MUNICIPALITY', label: 'Municipality' },
  { value: 'CORPORATION', label: 'Corporation' },
  { value: 'LEGISLATIVE_ASSEMBLY', label: 'Niyama Sabha' },
  { value: 'LOK_SABHA', label: 'Lok Sabha' }
]


const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]


const extractErrorMessage = (err, fallback) => {
  const data = err.response?.data

  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.error) return data.error
  if (data.detail) return data.detail

  const key = Object.keys(data)[0]

  if (key) {
    return Array.isArray(data[key])
      ? data[key][0]
      : String(data[key])
  }

  return fallback
}


const getType = (rep) =>
  String(
    rep?.constituency_type ||
    rep?.representative_type ||
    rep?.constituency?.type ||
    rep?.type ||
    ''
  )
    .trim()
    .toUpperCase()


const getTypeLabel = (rep) =>
  TYPE_OPTIONS.find(
    (x) => x.value === getType(rep)
  )?.label || 'Unassigned'


const getActiveStatus = (rep) =>
  Boolean(
    rep?.user_is_active ??
    rep?.is_active ??
    rep?.is_current
  )


function SearchableDropdown({
  value,
  options,
  placeholder,
  searchPlaceholder,
  onChange,
  getOptionValue,
  getOptionLabel,
  emptyMessage
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find(
    (o) =>
      String(getOptionValue(o)) ===
      String(value)
  )

  const filtered = options.filter((o) =>
    String(
      getOptionLabel(o) || ''
    )
      .toLowerCase()
      .includes(
        query.trim().toLowerCase()
      )
  )

  return (
    <div className={Styles.searchableDropdown}>

      <button
        type="button"
        className={`${Styles.searchableDropdownControl} ${
          open
            ? Styles.searchableDropdownOpen
            : ''
        }`}
        onClick={() =>
          setOpen((v) => !v)
        }
      >

        <span
          className={
            selected
              ? Styles.selectedDropdownText
              : Styles.dropdownPlaceholder
          }
        >
          {selected
            ? getOptionLabel(selected)
            : placeholder}
        </span>

        <FaChevronDown
          className={
            open
              ? Styles.dropdownArrowOpen
              : Styles.dropdownArrow
          }
        />

      </button>


      {open && (

        <div
          className={
            Styles.searchableDropdownMenu
          }
        >

          <div
            className={
              Styles.dropdownSearchBox
            }
          >

            <FaSearch />

            <input
              autoFocus
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder={
                searchPlaceholder
              }
            />

          </div>


          <div
            className={
              Styles.dropdownOptions
            }
          >

            {filtered.length ? (

              filtered.map((option) => {

                const optionValue =
                  String(
                    getOptionValue(option)
                  )

                const selectedNow =
                  optionValue ===
                  String(value)

                return (

                  <button
                    type="button"
                    key={optionValue}
                    className={`${Styles.dropdownOption} ${
                      selectedNow
                        ? Styles.dropdownOptionSelected
                        : ''
                    }`}
                    onClick={() => {

                      onChange(
                        optionValue
                      )

                      setQuery('')
                      setOpen(false)

                    }}
                  >

                    <span>
                      {getOptionLabel(option)}
                    </span>

                    {selectedNow && (
                      <FaCheck />
                    )}

                  </button>

                )
              })

            ) : (

              <div
                className={
                  Styles.dropdownEmpty
                }
              >
                {emptyMessage}
              </div>

            )}

          </div>

        </div>

      )}

    </div>
  )
}


export default function AddRepresntatives() {

  const [
    representatives,
    setRepresentatives
  ] = useState([])

  const [
    availableRepresentatives,
    setAvailableRepresentatives
  ] = useState([])

  const [
    constituencies,
    setConstituencies
  ] = useState([])

  const [
    loading,
    setLoading
  ] = useState(true)

  const [
    listError,
    setListError
  ] = useState('')

  const [
    search,
    setSearch
  ] = useState('')

  const [
    representativeType,
    setRepresentativeType
  ] = useState('all')

  const [
    representativeStatus,
    setRepresentativeStatus
  ] = useState('all')

  const [
    currentPage,
    setCurrentPage
  ] = useState(1)

  const PAGE_SIZE = 10


  // ============================================================
  // ADD REPRESENTATIVE
  // ============================================================

  const [
    newRepForm,
    setNewRepForm
  ] = useState({
    name: ''
  })

  const [
    creatingRepresentative,
    setCreatingRepresentative
  ] = useState(false)


  // ============================================================
  // LOAD REPRESENTATIVES
  // ============================================================

  const fetchRepresentatives =
    async () => {

      setLoading(true)
      setListError('')

      try {

        const data =
          await getRepresentatives()

        setRepresentatives(
          Array.isArray(data)
            ? data
            : (
                data?.results || []
              )
        )

      } catch (err) {

        console.error(err)

        setListError(
          extractErrorMessage(
            err,
            'Could not load representatives.'
          )
        )

      } finally {

        setLoading(false)

      }
    }


  const fetchAvailableRepresentatives =
    async () => {

      try {

        const data =
          await getAvailableRepresentativeUsers()

        setAvailableRepresentatives(
          Array.isArray(data)
            ? data
            : (
                data?.results || []
              )
        )

      } catch (err) {

        console.error(err)

      }
    }


  const fetchConstituencies =
    async () => {

      try {

        const data =
          await getConstituencies()

        setConstituencies(
          Array.isArray(data)
            ? data
            : (
                data?.results || []
              )
        )

      } catch (err) {

        console.error(err)

        setConstituencies([])

      }
    }


  useEffect(() => {

    fetchRepresentatives()
    fetchAvailableRepresentatives()
    fetchConstituencies()

    getUsers().catch(() => {})

  }, [])


  // ============================================================
  // CREATE REPRESENTATIVE
  // ============================================================

  const handleCreateRepresentative =
    async () => {

      const name =
        newRepForm.name.trim()

      if (!name) {

        setListError(
          'Representative name is required.'
        )

        return
      }

      setCreatingRepresentative(true)
      setListError('')

      try {

        const created =
          await createRepresentative({
            name
          })

        await Promise.all([
          fetchRepresentatives(),
          fetchAvailableRepresentatives()
        ])

        setNewRepForm({
          name: ''
        })

        window.alert(
          `Representative created successfully.\n\n` +
          `Login email: ${created.generated_email}`
        )

      } catch (err) {

        setListError(
          extractErrorMessage(
            err,
            'Could not create representative.'
          )
        )

      } finally {

        setCreatingRepresentative(false)

      }
    }


  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete =
    async (rep) => {

      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${
            rep.user_name ||
            'this representative'
          }?`
        )

      if (!confirmed) return

      try {

        setListError('')

        await deleteRepresentative(
          rep.id
        )

        await fetchRepresentatives()

      } catch (err) {

        setListError(
          extractErrorMessage(
            err,
            'Could not delete representative.'
          )
        )

      }
    }


  // ============================================================
  // ACTIVE / INACTIVE TOGGLE
  // ============================================================

  const handleToggleStatus =
    async (rep) => {

      const currentStatus =
        getActiveStatus(rep)

      const newStatus =
        !currentStatus

      try {

        setListError('')

        await toggleRepresentativeStatus(
          rep.id,
          newStatus
        )

        await fetchRepresentatives()

      } catch (err) {

        setListError(
          extractErrorMessage(
            err,
            'Could not change representative status.'
          )
        )

      }
    }


  // ============================================================
  // FILTER
  // ============================================================

  const filteredRepresentatives =
    useMemo(() => {

      const q =
        search
          .trim()
          .toLowerCase()

      return representatives.filter(
        (rep) => {

          const matchesSearch =
            !q ||
            [
              rep.user_name,
              rep.user_email,
              rep.constituency_name,
              rep.district_name
            ].some((value) =>
              String(value || '')
                .toLowerCase()
                .includes(q)
            )


          const matchesType =
            representativeType ===
              'all' ||
            getType(rep) ===
              representativeType


          const active =
            getActiveStatus(rep)

          const matchesStatus =
            representativeStatus ===
              'all' ||
            (
              representativeStatus ===
                'active' &&
              active
            ) ||
            (
              representativeStatus ===
                'inactive' &&
              !active
            )


          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          )

        }
      )

    }, [
      representatives,
      search,
      representativeType,
      representativeStatus
    ])


  // ============================================================
  // COUNTS
  // ============================================================

  const allCount =
    representatives.length

  const activeCount =
    representatives.filter(
      (rep) =>
        getActiveStatus(rep)
    ).length

  const inactiveCount =
    representatives.filter(
      (rep) =>
        !getActiveStatus(rep)
    ).length


  // ============================================================
  // TYPE COUNTS
  // ============================================================

  const getTypeCount =
    (type) =>
      representatives.filter(
        (rep) =>
          getType(rep) === type
      ).length


  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRepresentatives.length /
          PAGE_SIZE
      )
    )


  useEffect(() => {

    setCurrentPage(1)

  }, [
    search,
    representativeType,
    representativeStatus
  ])


  useEffect(() => {

    if (
      currentPage >
      totalPages
    ) {

      setCurrentPage(
        totalPages
      )

    }

  }, [
    currentPage,
    totalPages
  ])


  const rows =
    filteredRepresentatives.slice(
      (currentPage - 1) *
        PAGE_SIZE,

      currentPage *
        PAGE_SIZE
    )


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <AdminLayout title="Representatives">

      {/* ======================================================
          ADD REPRESENTATIVE
      ====================================================== */}

      <div
        className={Styles.card}
      >

        <div
          className={Styles.cardHeader}
        >

          <div>

            <h3>
              Add Representative
            </h3>

            <p>
              Create a representative account.
              The login email is generated
              automatically.
            </p>

          </div>

        </div>


        <div
          className={Styles.addRepForm}
        >

          <label>

            <span>
              Representative Name
            </span>

            <input
              value={
                newRepForm.name
              }
              onChange={(e) =>
                setNewRepForm({
                  name:
                    e.target.value
                })
              }
              placeholder="Enter representative name"
            />

          </label>


          <button
            className={
              Styles.primaryBtn
            }
            type="button"
            onClick={
              handleCreateRepresentative
            }
            disabled={
              creatingRepresentative
            }
          >

            {creatingRepresentative
              ? 'Creating...'
              : 'Add Representative'}

          </button>

        </div>

      </div>


      {/* ======================================================
          MANAGE REPRESENTATIVES
      ====================================================== */}

      <div
        className={Styles.card}
      >

        <div
          className={Styles.cardHeader}
        >

          <div>

            <h3>
              Representatives
            </h3>

            <p>
              Manage representative accounts
              and their active status.
            </p>

          </div>


          <div
            className={Styles.searchBox}
          >

            <FaSearch />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search name, email, constituency, district"
            />

          </div>

        </div>


        {/* ====================================================
            STATUS FILTER
        ==================================================== */}

        <div
          className={
            Styles.statusFilterWrapper
          }
        >

          {STATUS_OPTIONS.map(
            (status) => (

              <button
                key={
                  status.value
                }
                type="button"
                className={`${Styles.statusFilterBtn} ${
                  representativeStatus ===
                  status.value
                    ? Styles.activeStatusFilter
                    : ''
                }`}
                onClick={() =>
                  setRepresentativeStatus(
                    status.value
                  )
                }
              >

                {status.label}

                <span>

                  {status.value ===
                    'all'
                    ? allCount
                    : status.value ===
                      'active'
                      ? activeCount
                      : inactiveCount}

                </span>

              </button>

            )
          )}

        </div>


        {/* ====================================================
            TYPE FILTER
        ==================================================== */}

        <div
          className={
            Styles.typeFilterWrapper
          }
        >

          {TYPE_OPTIONS.map(
            (type) => (

              <button
                key={
                  type.value
                }
                type="button"
                className={`${Styles.typeFilterBtn} ${
                  representativeType ===
                  type.value
                    ? Styles.activeTypeFilter
                    : ''
                }`}
                onClick={() =>
                  setRepresentativeType(
                    type.value
                  )
                }
              >

                {type.label}

                <span>

                  {type.value ===
                    'all'
                    ? allCount
                    : getTypeCount(
                        type.value
                      )}

                </span>

              </button>

            )
          )}

        </div>


        {listError && (

          <p
            className={
              Styles.errorText
            }
          >
            {listError}
          </p>

        )}


        {/* ====================================================
            TABLE
        ==================================================== */}

        {loading ? (

          <div
            className={
              Styles.loadingState
            }
          >
            Loading representatives...
          </div>

        ) : rows.length === 0 ? (

          <p
            className={
              Styles.assignHint
            }
          >
            No representatives found.
          </p>

        ) : (

          <>

            <div
              className={
                Styles.tableWrap
              }
            >

              <table
                className={
                  Styles.table
                }
              >

                <thead>

                  <tr>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Constituency
                    </th>

                    <th>
                      Ward
                    </th>

                    <th>
                      District
                    </th>

                    <th>
                      Term
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {rows.map(
                    (rep) => {

                      const active =
                        getActiveStatus(
                          rep
                        )

                      return (

                        <tr
                          key={
                            rep.id
                          }
                        >

                          <td>

                            <strong>
                              {rep.user_name ||
                                'Unnamed User'}
                            </strong>

                          </td>


                          <td>

                            {rep.user_email ||
                              '-'}

                          </td>


                          <td>

                            <span
                              className={
                                Styles.typeBadge
                              }
                            >
                              {getTypeLabel(
                                rep
                              )}
                            </span>

                          </td>


                          <td>

                            {rep.constituency_name ||
                              (
                                <span
                                  className={
                                    Styles.muted
                                  }
                                >
                                  Not assigned
                                </span>
                              )}

                          </td>


                          <td>
                            {rep.constituency_ward ||
                              '-'}
                          </td>


                          <td>
                            {rep.district_name ||
                              '-'}
                          </td>


                          <td>

                            <div
                              className={
                                Styles.termCell
                              }
                            >

                              <div>

                                <strong>
                                  From:
                                </strong>{' '}

                                {rep.start_date ||
                                  '-'}

                              </div>

                              <div>

                                <strong>
                                  To:
                                </strong>{' '}

                                {rep.end_date ||
                                  '-'}

                              </div>

                            </div>

                          </td>


                          <td>

                            <button
                              type="button"
                              className={`${Styles.statusToggle} ${
                                active
                                  ? Styles.statusActive
                                  : Styles.statusInactive
                              }`}
                              onClick={() =>
                                handleToggleStatus(
                                  rep
                                )
                              }
                              title={
                                active
                                  ? 'Click to deactivate'
                                  : 'Click to activate'
                              }
                            >

                              <span
                                className={
                                  Styles.toggleDot
                                }
                              />

                              {active
                                ? 'Active'
                                : 'Inactive'}

                            </button>

                          </td>


                          {/* NO EDIT OPTION */}

                          <td>

                            <div
                              className={
                                Styles.actionsRow
                              }
                            >

                              <button
                                className={
                                  Styles.deleteBtn
                                }
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    rep
                                  )
                                }
                                title="Delete representative"
                              >

                                <FaTrash />

                              </button>

                            </div>

                          </td>

                        </tr>

                      )

                    }
                  )}

                </tbody>

              </table>

            </div>


            {/* ==================================================
                PAGINATION
            ================================================== */}

            <div
              className={
                Styles.paginationWrapper
              }
            >

              <div>

                Showing{' '}

                <strong>
                  {
                    filteredRepresentatives.length
                      ? (
                          (currentPage - 1) *
                            PAGE_SIZE +
                          1
                        )
                      : 0
                  }
                </strong>{' '}

                to{' '}

                <strong>
                  {
                    Math.min(
                      currentPage *
                        PAGE_SIZE,
                      filteredRepresentatives.length
                    )
                  }
                </strong>{' '}

                of{' '}

                <strong>
                  {
                    filteredRepresentatives.length
                  }
                </strong>{' '}

                representatives

              </div>


              <div
                className={
                  Styles.paginationControls
                }
              >

                <button
                  className={
                    Styles.paginationBtn
                  }
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (p) => p - 1
                    )
                  }
                >

                  <FaChevronLeft />

                </button>


                {Array.from(
                  {
                    length:
                      totalPages
                  },
                  (_, i) =>
                    i + 1
                ).map(
                  (page) => (

                    <button
                      key={page}
                      className={`${Styles.pageNumber} ${
                        currentPage ===
                        page
                          ? Styles.activePage
                          : ''
                      }`}
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                    >
                      {page}
                    </button>

                  )
                )}


                <button
                  className={
                    Styles.paginationBtn
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (p) => p + 1
                    )
                  }
                >

                  <FaChevronRight />

                </button>

              </div>

            </div>

          </>

        )}

      </div>

    </AdminLayout>
  )
}

