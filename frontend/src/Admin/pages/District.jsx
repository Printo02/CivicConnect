import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './District.module.css'
import { getDistricts } from '../../api/services/Admin/districtService'
import { FaMapMarkedAlt, FaPlus, FaSearch } from 'react-icons/fa'

export function District() {
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const data = await getDistricts()
        setDistricts(data)
      } catch (err) {
        console.error('Failed to load districts:', err)
        setError('Could not load districts. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchDistricts()
  }, [])

  const filtered = districts.filter((d) =>
    d.dname?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout title="District">
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          <div>
            <h3>District list</h3>
            <p>Add and track districts across your region.</p>
          </div>
          <div className={Styles.headerActions}>
            <div className={Styles.searchBox}>
              <FaSearch className={Styles.searchIcon} />
              <input
                type="text"
                placeholder="Search districts"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className={Styles.addBtn} type="button">
              <FaPlus /> Add district
            </button>
          </div>
        </div>

        {loading && (
          <div className={Styles.stateBlock}>
            <p>Loading districts...</p>
          </div>
        )}

        {!loading && error && (
          <div className={Styles.stateBlock}>
            <p className={Styles.errorText}>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={Styles.stateBlock}>
            <FaMapMarkedAlt className={Styles.emptyIcon} />
            <p>{search ? 'No districts match your search.' : 'No districts added yet.'}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table className={Styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>District name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td className={Styles.idCell}>{d.id}</td>
                  <td className={Styles.nameCell}>{d.dname}</td>
                  <td className={Styles.actionsCell}>⋮</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  )
}