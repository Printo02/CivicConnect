import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './ViewUser.module.css'
import { getUsers } from '../../api/services/adminuserview'
function ViewUsers() {
  const [user,setUser]  = useState([])
  const [loading ,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [search,setSearch] = useState('')
  
  useEffect(() => {
    const fetchUsers = async() =>{
      try{
        const data = await getUsers()
        setUser(data)
      }
      catch(err){
        console.error('Failed to load users',err)
        setError('Could not load users. Please try again.')
      }
      finally{
        setLoading(false)
      }
    }
    fetchUsers()},[])
    const filteredUsers = user.filter((c) => 
      c.first_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
    )
  return (
      <AdminLayout title="Users List">
        <div className={Styles.tableSection}>
            <div className={Styles.tableSection}>
            <div className={Styles.tableHeader}>
              <div>
                <h3>List of Active User</h3>
              </div>
              <div className={Styles.tableSearch}>
                <input placeholder="Search" value={search} onChange={(e)=>setSearch(e.target.value)}/>
                <span className={Styles.kbd}>⌘K</span>
              </div>
            </div>
            <table className={Styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>User Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <div className={Styles.complaintCell}>
                        <div className={Styles.complaintAvatar} />
                        <div>
                          <p className={Styles.complaintName}>{c.first_name}</p>
                          <p className={Styles.complaintDept}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={Styles.dateCell}>{c.is_staff ? 'Yes' : 'No'}</td>

                    <td className={Styles.dateCell}>{c.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className={Styles.tagRow}>
                          <span className={Styles.tagview} title="Edit User">Edit</span> 
                          {/* <span className={Styles.tagedit}>Activate</span>  */}
                          <span className={Styles.tagdelete} title="Deactivate User">Remove</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className={Styles.Block}>
              <p>Loading Users...</p>
            </div>
          )}
        </div>
      </AdminLayout>
  )
}
export default ViewUsers