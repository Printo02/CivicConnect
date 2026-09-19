import React, { useEffect, useState } from 'react'
import { FaPlus,FaTrash,FaSearch,FaTimes } from 'react-icons/fa'
import Styles from '../../Branch/components/module.css/AddEmployees.module.css'
import { getBranchEmployees,addBranchEmployee,deleteBranchEmployee,toggleBranchEmployeeStatus} from '../../api/services/Branch/Addemployee.js'
import BranchLayout from '../components/BranchLayout.jsx'

export default function AddEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // active | inactive
  const [statusView, setStatusView] = useState('active')

  const [updatingId, setUpdatingId] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    fullname: '',
  })

  const [newCreds, setNewCreds] = useState(null)

  // =========================================================
  // LOAD EMPLOYEES
  // =========================================================

  const loadEmployees = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getBranchEmployees()

      const employeeList = Array.isArray(data)
        ? data
        : data?.results || []

      setEmployees(employeeList)
    } catch (err) {
      console.error(
        'Failed to load branch employees:',
        err
      )

      setError(
        err.response?.data?.detail ||
        'Failed to load branch employees.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const openModal = () => {
    setForm({
      fullname: '',
    })

    setFormError('')
    setNewCreds(null)
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    setFormError('')

    setForm({
      fullname: '',
    })

    setNewCreds(null)
  }

  // =========================================================
  // CREATE EMPLOYEE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    const fullname = form.fullname.trim()

    if (!fullname) {
      setFormError('Employee name is required.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const newEmployee = await addBranchEmployee({
        fullname,
      })

      setEmployees((prev) => [
        newEmployee,
        ...prev,
      ])

      setNewCreds({
        email: newEmployee.email,
        password: newEmployee.email,
      })

      setForm({
        fullname: '',
      })

      // New employee is active
      setStatusView('active')
    } catch (err) {
      console.error(
        'Failed to add branch employee:',
        err
      )

      const data = err.response?.data

      if (
        typeof data === 'object' &&
        data !== null
      ) {
        const messages = Object.values(data)
          .flat()
          .join(' ')

        setFormError(
          messages || 'Could not add employee.'
        )
      } else {
        setFormError('Could not add employee.')
      }
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // ACTIVATE / DEACTIVATE
  // =========================================================

  const handleStatusToggle = async (employee) => {
    if (updatingId !== null) return

    const nextStatus = !employee.is_active

    const employeeName =
      employee.emp_name ||
      employee.employee_name ||
      employee.fullname ||
      'this employee'

    const confirmed = window.confirm(
      nextStatus
        ? `Activate ${employeeName}?`
        : `Deactivate ${employeeName}?`
    )

    if (!confirmed) return

    setUpdatingId(employee.id)

    try {
      const result =
        await toggleBranchEmployeeStatus(
          employee.id,
          nextStatus
        )

      setEmployees((prev) =>
        prev.map((item) =>
          item.id === employee.id
            ? {
                ...item,
                is_active: result.is_active,
                account_is_active:
                  result.account_is_active,
              }
            : item
        )
      )

      /*
       * The employee automatically disappears from the
       * current list because filteredEmployees is based
       * on is_active.
       */
    } catch (err) {
      console.error(
        'Failed to update employee status:',
        err.response?.status,
        err.response?.data || err
      )

      const data = err.response?.data

      let message =
        'Could not update employee status.'

      if (data?.detail) {
        message = data.detail
      } else if (data?.is_active) {
        message = Array.isArray(data.is_active)
          ? data.is_active.join(' ')
          : data.is_active
      }

      alert(message)
    } finally {
      setUpdatingId(null)
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently remove this employee?'
    )

    if (!confirmed) return

    try {
      await deleteBranchEmployee(id)

      setEmployees((prev) =>
        prev.filter(
          (employee) => employee.id !== id
        )
      )
    } catch (err) {
      console.error(
        'Failed to delete employee:',
        err
      )

      alert(
        err.response?.data?.detail ||
        'Could not delete employee.'
      )
    }
  }

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '—'
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // =========================================================
  // FILTER EMPLOYEES
  // =========================================================

  const filteredEmployees = employees
    .filter((employee) => {
      // Active tab
      if (
        statusView === 'active' &&
        !employee.is_active
      ) {
        return false
      }

      // Deactivated tab
      if (
        statusView === 'inactive' &&
        employee.is_active
      ) {
        return false
      }

      const query = search
        .trim()
        .toLowerCase()

      if (!query) return true

      const name =
        employee.emp_name ||
        employee.employee_name ||
        employee.fullname ||
        ''

      const email =
        employee.email || ''

      return (
        String(name)
          .toLowerCase()
          .includes(query) ||
        String(email)
          .toLowerCase()
          .includes(query)
      )
    })
    .sort((a, b) => {
      const dateA = a.date_joined
        ? new Date(a.date_joined).getTime()
        : 0

      const dateB = b.date_joined
        ? new Date(b.date_joined).getTime()
        : 0

      return dateB - dateA
    })

  const activeCount = employees.filter(
    (employee) => employee.is_active
  ).length

  const inactiveCount = employees.filter(
    (employee) => !employee.is_active
  ).length

  // =========================================================
  // UI
  // =========================================================

  return (
    <BranchLayout>
      <div className={Styles.page}>

        {/* HEADER */}

        <div className={Styles.header}>
          <div>
            <h2>Branch Employees</h2>

            <p>
              Manage employees working in your branch.
            </p>
          </div>

          <button
            type="button"
            className={Styles.addButton}
            onClick={openModal}
          >
            <FaPlus />
            Add Employee
          </button>
        </div>

        {/* SEARCH + STATUS TOGGLE */}

        <div className={Styles.toolbar}>

          <div className={Styles.searchBox}>
            <FaSearch
              className={Styles.searchIcon}
            />

            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className={Styles.clearSearch}
                onClick={() => setSearch('')}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* ACTIVE / DEACTIVATED TOGGLE */}

          <div className={Styles.statusToggle}>

            <button
              type="button"
              className={`${Styles.statusToggleButton} ${
                statusView === 'active'
                  ? Styles.statusToggleActive
                  : ''
              }`}
              onClick={() =>
                setStatusView('active')
              }
            >
              Active
              <span>{activeCount}</span>
            </button>

            <button
              type="button"
              className={`${Styles.statusToggleButton} ${
                statusView === 'inactive'
                  ? Styles.statusToggleActive
                  : ''
              }`}
              onClick={() =>
                setStatusView('inactive')
              }
            >
              Deactivated
              <span>{inactiveCount}</span>
            </button>

          </div>
        </div>

        {error && (
          <div className={Styles.error}>
            {error}
          </div>
        )}

        {/* TABLE */}

        <div className={Styles.tableContainer}>
          <table className={Styles.table}>

            <thead>
              <tr>
                <th>#</th>
                <th>Employee Name</th>
                <th>Email</th>
                <th>DOB</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className={Styles.empty}
                  >
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className={Styles.empty}
                  >
                    {search
                      ? 'No matching employees found.'
                      : statusView === 'active'
                        ? 'No active employees found.'
                        : 'No deactivated employees found.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(
                  (employee, index) => (

                    <tr key={employee.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <div
                          className={
                            Styles.employeeName
                          }
                        >
                          {employee.emp_name ||
                            employee.employee_name ||
                            employee.fullname ||
                            '—'}
                        </div>
                      </td>

                      <td>
                        {employee.email || '—'}
                      </td>

                      <td>
                        {formatDate(employee.dob)}
                      </td>

                      <td>
                        {formatDate(
                          employee.date_joined
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            employee.is_active
                              ? Styles.activeBadge
                              : Styles.inactiveBadge
                          }
                        >
                          {employee.is_active
                            ? 'Active'
                            : 'Deactivated'}
                        </span>
                      </td>

                      <td>
                        <div
                          className={
                            Styles.actionButtons
                          }
                        >

                          {/* STATUS ACTION */}

                          <button
                            type="button"
                            className={
                              employee.is_active
                                ? Styles.deactivateButton
                                : Styles.activateButton
                            }
                            disabled={
                              updatingId ===
                              employee.id
                            }
                            onClick={() =>
                              handleStatusToggle(
                                employee
                              )
                            }
                          >
                            {updatingId ===
                            employee.id
                              ? 'Updating...'
                              : employee.is_active
                                ? 'Deactivate'
                                : 'Activate'}
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            className={
                              Styles.deleteButton
                            }
                            disabled={
                              updatingId ===
                              employee.id
                            }
                            onClick={() =>
                              handleDelete(
                                employee.id
                              )
                            }
                            title="Permanently remove employee"
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

        {/* ADD EMPLOYEE MODAL */}

        {showModal && (
          <div
            className={Styles.modalOverlay}
            onClick={closeModal}
          >
            <div
              className={Styles.modal}
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className={Styles.modalHeader}>

                <div>
                  <h3>Add Branch Employee</h3>

                  <p>
                    Create an employee account
                    for this branch.
                  </p>
                </div>

                <button
                  type="button"
                  className={Styles.closeButton}
                  onClick={closeModal}
                  disabled={saving}
                >
                  <FaTimes />
                </button>

              </div>

              {!newCreds ? (

                <form onSubmit={handleSubmit}>

                  <div className={Styles.inputGroup}>

                    <label>
                      Employee Name
                    </label>

                    <input
                      type="text"
                      name="fullname"
                      placeholder="Enter employee full name"
                      value={form.fullname}
                      onChange={handleChange}
                      required
                      autoFocus
                    />

                  </div>

                  <div className={Styles.infoText}>
                    The employee's email and password
                    will be generated automatically.
                  </div>

                  {formError && (
                    <div className={Styles.formError}>
                      {formError}
                    </div>
                  )}

                  <div className={Styles.modalActions}>

                    <button
                      type="button"
                      className={Styles.cancelButton}
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className={Styles.saveButton}
                      disabled={saving}
                    >
                      {saving
                        ? 'Creating...'
                        : 'Create Employee'}
                    </button>

                  </div>

                </form>

              ) : (

                <div className={Styles.credentialBox}>

                  <h4>
                    Employee created successfully
                  </h4>

                  <p>
                    The password matches the login email.
                  </p>

                  <div className={Styles.credentialRow}>
                    <span>Email</span>
                    <strong>{newCreds.email}</strong>
                  </div>

                  <div className={Styles.credentialRow}>
                    <span>Initial Password</span>
                    <strong>{newCreds.password}</strong>
                  </div>

                  <div className={Styles.modalActions}>

                    <button
                      type="button"
                      className={Styles.saveButton}
                      onClick={closeModal}
                    >
                      Done
                    </button>

                  </div>

                </div>

              )}

            </div>
          </div>
        )}

      </div>
    </BranchLayout>
  )
}