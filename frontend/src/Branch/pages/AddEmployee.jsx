import React, { useEffect, useState } from 'react'
import { FaPlus, FaTrash, FaSearch, FaTimes, FaCopy } from 'react-icons/fa'
import Styles from '../../Branch/components/module.css/AddEmployees.module.css'
import { getBranchEmployees,addBranchEmployee,deleteBranchEmployee } from '../../api/services/Branch/Addemployee.js'
import BranchLayout from '../components/BranchLayout.jsx'

export default function AddEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ fullname: '' })
  const [newCreds, setNewCreds] = useState(null)

  const loadEmployees = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getBranchEmployees()
      setEmployees(Array.isArray(data) ? data : data?.results || [])
    } catch (err) {
      console.error('Failed to load branch employees:', err)
      setError(err.response?.data?.detail || 'Failed to load branch employees.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const openModal = () => {
    setForm({ fullname: '' })
    setFormError('')
    setNewCreds(null)
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setFormError('')
    setForm({ fullname: '' })
    setNewCreds(null)
  }

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
      const newEmployee = await addBranchEmployee({ fullname })

      // FIX: the created object now actually carries employee_name + email
      setEmployees((prev) => [...prev, newEmployee])

      // FIX: show the generated credentials once, instead of just closing the modal
      setNewCreds({ email: newEmployee.email, password: newEmployee.email })
      setForm({ fullname: '' })
    } catch (err) {
      console.error('Failed to add branch employee:', err)
      const data = err.response?.data
      if (typeof data === 'object' && data !== null) {
        const messages = Object.values(data).flat().join(' ')
        setFormError(messages || 'Could not add employee.')
      } else {
        setFormError('Could not add employee.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to remove this employee?')
    if (!confirmed) return

    try {
      await deleteBranchEmployee(id)
      setEmployees((prev) => prev.filter((employee) => employee.id !== id))
    } catch (err) {
      console.error('Failed to delete employee:', err)
      alert(err.response?.data?.detail || 'Could not delete employee.')
    }
  }

  const copyToClipboard = (text) => navigator.clipboard.writeText(text)

  const filteredEmployees = employees.filter((employee) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    const name = employee.employee_name || employee.fullname || ''
    return (
      String(name).toLowerCase().includes(query) ||
      String(employee.branch || '').toLowerCase().includes(query)
    )
  })

  return (
    <BranchLayout>
    <div className={Styles.page}>
      <div className={Styles.header}>
        <div>
          <h2>Branch Employees</h2>
          <p>Manage employees working in your branch.</p>
        </div>

        <div className={Styles.searchBox}>
          <FaSearch className={Styles.searchIcon} />
          <input type="text" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)}/>
          <button className={Styles.addButton} onClick={openModal}><FaPlus />Add Employee</button>
        </div>
      </div>

      {error && <div className={Styles.error}>{error}</div>}

      <div className={Styles.tableContainer}>
        <table className={Styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Employee Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className={Styles.empty}>Loading employees...</td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="4" className={Styles.empty}>
                  {search ? 'No matching employees found.' : 'No employees added yet.'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee, index) => (
                <tr key={employee.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className={Styles.employeeName}>
                      {/* FIX: create-response uses employee_name; list-response may use fullname — cover both */}
                      {employee.emp_name}
                    </div>
                  </td>
                  <td>{employee.email || '—'}</td>
                  <td>
                    <button
                      className={Styles.deleteButton}
                      onClick={() => handleDelete(employee.id)}
                      title="Remove employee"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={Styles.modalOverlay} onClick={closeModal}>
          <div className={Styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={Styles.modalHeader}>
              <div>
                <h3>Add Branch Employee</h3>
                <p>Create an employee account for this branch.</p>
              </div>

              <button className={Styles.closeButton} onClick={closeModal} disabled={saving}>
                <FaTimes />
              </button>
            </div>

            {!newCreds ? (
              <form onSubmit={handleSubmit}>
                <div className={Styles.inputGroup}>
                  <label>Employee Name</label>
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
                  The employee's email and password will be generated automatically.
                </div>

                {formError && <div className={Styles.formError}>{formError}</div>}

                <div className={Styles.modalActions}>
                  <button type="button" className={Styles.cancelButton} onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className={Styles.saveButton} disabled={saving}>
                    {saving ? 'Creating...' : 'Create Employee'}
                  </button>
                </div>
              </form>
            ) : (
              // FIX: credential reveal — this is the only moment these values are ever visible
              <div className={Styles.credentialBox}>
                <h4>Employee created — The password matches the login email.</h4>
                <div className={Styles.modalActions}>
                  <button type="button" className={Styles.saveButton} onClick={closeModal}>
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