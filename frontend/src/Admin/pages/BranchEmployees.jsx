import  { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { FaArrowLeft, FaSearch } from "react-icons/fa"

import AdminLayout from "../components/dashboard/AdminLayout"
import Styles from "./BranchEmployees.module.css"

import { getBranchEmployees } from "../../api/services/Admin/AdminDepartmentBranches"


function BranchEmployees() {

  const { branchId } = useParams()
  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")


  useEffect(() => {

    const fetchEmployees = async () => {

      try {

        setLoading(true)
        setError("")

        const data = await getBranchEmployees(branchId)

        setEmployees(data)

      } catch (err) {

        console.error(err)
        setError("Could not load branch employees.")

      } finally {

        setLoading(false)

      }
    }

    fetchEmployees()

  }, [branchId])


  const filteredEmployees = employees.filter((employee) => {

    const searchValue = search.toLowerCase()

    return (
      (employee.name || "")
        .toLowerCase()
        .includes(searchValue) ||

      (employee.email || "")
        .toLowerCase()
        .includes(searchValue)
    )

  })


  return (

    <AdminLayout title="Branch Employees">

      <div className={Styles.card}>

        <div className={Styles.cardHeader}>

          <div>

            <button
              className={Styles.backBtn}
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
              Back
            </button>

            <h3>
              Branch Employees
            </h3>

            <p>
              Employees added by this branch.
            </p>

          </div>


          <div className={Styles.searchBox}>

            <FaSearch className={Styles.searchIcon} />

            <input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        </div>


        {loading && (
          <div className={Styles.stateBlock}>
            <p>Loading employees...</p>
          </div>
        )}
        {!loading && error && (
          <div className={Styles.stateBlock}>
            <p className={Styles.errorText}>
              {error}
            </p>
          </div>
        )}
        {!loading && !error && filteredEmployees.length === 0 && (
          <div className={Styles.stateBlock}>
            <p>
              {search
                ? "No employees match your search."
                : "No employees found for this branch."}
            </p>
          </div>
        )}
        {!loading && !error && filteredEmployees.length > 0 && (
          <div className={Styles.tableWrap}>
            <table className={Styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Date of Birth</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className={Styles.employeeCell}>
                        <div className={Styles.avatar}>{(employee.name || "E").charAt(0).toUpperCase()}</div>
                        <div>
                          <p className={Styles.employeeName}>
                            {employee.name || "Unnamed Employee"}
                          </p>
                          <p className={Styles.employeeMeta}>{employee.branch_name}</p>
                        </div>
                      </div>
                    </td>
                    <td>{employee.email || "—"}</td>
                    <td>{employee.dob || "—"}</td>
                    <td>
                      <span className={employee.is_active ? Styles.activeTag : Styles.inactiveTag}>
                        {employee.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default BranchEmployees

