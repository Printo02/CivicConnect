import React, { useEffect, useState } from 'react'
import DeptLayout from '../components/DeptLayout'
import Styles from '../../Dept/components/module.css/DeptBranches.module.css'
// import { getMyBranches, getBranchComplaints, updateComplaintAction } from '../../api/services/Dept/deptService'
import { getMyBranches  } from '../../api/services/Dept/deptService'

const STATUS_OPTIONS = ['pending', 'in_progress', 'resolved']

export default function DeptComplaints() {
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [actionText, setActionText] = useState('')
  const [statusValue, setStatusValue] = useState('pending')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const data = await getMyBranches()
      setBranches(data)
      if (data.length > 0) setSelectedBranch(data[0].id)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedBranch) return
    setLoading(true)
    getBranchComplaints(selectedBranch)
      .then(setComplaints)
      .finally(() => setLoading(false))
  }, [selectedBranch])

  const openAction = (c) => {
    setEditing(c)
    setActionText(c.action_taken || '')
    setStatusValue(c.status)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateComplaintAction(editing.id, { action_taken: actionText, status: statusValue })
      setComplaints((prev) => prev.map((c) => (c.id === editing.id ? updated : c)))
      setEditing(null)
    } catch (err) {
      console.error(err)
      alert('Could not update complaint.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DeptLayout title="Complaints">
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          <h3>Complaints</h3>
          <select value={selectedBranch || ''} onChange={(e) => setSelectedBranch(Number(e.target.value))}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.region_name}</option>
            ))}
          </select>
        </div>

        {loading ? <p>Loading...</p> : (
          <table className={Styles.table}>
            <thead>
              <tr><th>Title</th><th>Citizen</th><th>Status</th><th>Action Taken</th><th></th></tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.citizen_name || '—'}</td>
                  <td>{c.status}</td>
                  <td>{c.action_taken || '—'}</td>
                  <td>
                    <button className={Styles.verifyBtn} onClick={() => openAction(c)}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className={Styles.modalOverlay} onClick={() => setEditing(null)}>
          <div className={Styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={Styles.modalTitle}>{editing.title}</h3>
            <form onSubmit={handleSave}>
              <div className={Styles.inputGroup}>
                <label>Status</label>
                <select value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={Styles.inputGroup}>
                <label>Action taken</label>
                <textarea value={actionText} onChange={(e) => setActionText(e.target.value)} rows={4} />
              </div>
              <div className={Styles.modalActions}>
                <button type="button" className={Styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className={Styles.submitBtn} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DeptLayout>
  )
}

