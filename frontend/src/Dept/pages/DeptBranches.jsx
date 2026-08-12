import React, { useEffect, useState } from 'react'
import DeptLayout from '../components/DeptLayout'
import Styles from '../components/module.css/DeptBranches.module.css' 
import { FaPlus, FaCheckCircle, FaTimesCircle, FaEdit } from 'react-icons/fa'
import { getMyBranches, toggleBranchActive, addBranch, updateBranch } from '../../api/services/Dept/deptService'

export default function DeptBranches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ phone: '', email: '', location: '', website: '', urls: '' })

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const data = await getMyBranches()
      setBranches(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBranches() }, [])

  const handleToggle = async (branchId) => {
    try {
      const updated = await toggleBranchActive(branchId)
      setBranches((prev) => prev.map((b) => (b.id === branchId ? updated : b)))
    } catch (err) {
      console.error(err)
      alert('Could not update branch status.')
    }
  }

  const openAdd = () => {
    setEditingBranch(null)
    setForm({ phone: '', email: '', location: '', website: '', urls: '' })
    setShowModal(true)
  }

  const openEdit = (branch) => {
    setEditingBranch(branch)
    setForm({
      phone: branch.phone || '', email: branch.email || '', location: branch.location || '',
      website: branch.website || '', urls: branch.urls || '',
    })
    setShowModal(true)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingBranch) {
        const updated = await updateBranch(editingBranch.id, form)
        setBranches((prev) => prev.map((b) => (b.id === editingBranch.id ? updated : b)))
      } else {
        const newBranch = await addBranch(form)
        setBranches((prev) => [...prev, newBranch])
      }
      setShowModal(false)
    } catch (err) {
      console.error(err)
      setError(JSON.stringify(err.response?.data) || 'Could not save branch.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DeptLayout title="My Branches">
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          <div>
            <h3>Branches</h3>
            <p>Manage your branch details and status.</p>
          </div>
          <button className={Styles.addBtn} onClick={openAdd}>
            <FaPlus /> Add Branch
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className={Styles.table}>
            <thead>
              <tr>
                <th>Region</th><th>Phone</th><th>Email</th><th>Location</th>
                <th>Verified</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td>{b.region_name}</td>
                  <td>{b.phone}</td>
                  <td>{b.email}</td>
                  <td>{b.location}</td>
                  <td>{b.is_verified ? <FaCheckCircle color="#22C55E" /> : <FaTimesCircle color="#dc2626" />}</td>
                  <td>{b.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className={Styles.actionsRow}>
                      <button className={Styles.deleteIconBtn} onClick={() => openEdit(b)} aria-label="Edit branch">
                        <FaEdit />
                      </button>
                      <button className={Styles.verifyBtn} onClick={() => handleToggle(b.id)}>
                        {b.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={Styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={Styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={Styles.modalTitle}>{editingBranch ? 'Edit branch' : 'Add branch'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={Styles.inputGroup}>
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} required />
              </div>
              <div className={Styles.inputGroup}>
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className={Styles.inputGroup}>
                <label>Location</label>
                <input name="location" value={form.location} onChange={handleChange} required />
              </div>
              <div className={Styles.inputGroup}>
                <label>Website</label>
                <input type="url" name="website" value={form.website} onChange={handleChange} />
              </div>
              <div className={Styles.inputGroup}>
                <label>Google Map URL</label>
                <input type="url" name="urls" value={form.urls} onChange={handleChange} />
              </div>
              {error && <p className={Styles.errorText}>{error}</p>}
              <div className={Styles.modalActions}>
                <button type="button" className={Styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={Styles.submitBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DeptLayout>
  )
}