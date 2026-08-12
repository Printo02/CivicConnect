import React, { useEffect, useState } from 'react'
import DeptLayout from '../components/DeptLayout'
import Styles from '../components/module.css/DeptBranches.module.css'
import { getMyBranches, getBranchEmployees } from '../../api/services/Dept/deptService'

export default function DeptEmployees() {
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyBranches().then((data) => {
      setBranches(data)
      if (data.length > 0) setSelectedBranch(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedBranch) return
    setLoading(true)
    getBranchEmployees(selectedBranch).then(setEmployees).finally(() => setLoading(false))
  }, [selectedBranch])

  return (
    <DeptLayout title="Employees">
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          <h3>Employees</h3>
          <select value={selectedBranch || ''} onChange={(e) => setSelectedBranch(Number(e.target.value))}>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.region_name}</option>)}
          </select>
        </div>
        {loading ? <p>Loading...</p> : (
          <table className={Styles.table}>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}><td>{e.name}</td><td>{e.email}</td><td>{e.role}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DeptLayout>
  )
}