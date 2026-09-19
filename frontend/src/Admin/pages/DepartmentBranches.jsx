import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { FaArrowLeft, FaUsers, FaSearch } from "react-icons/fa"

import AdminLayout from "../components/dashboard/AdminLayout"
import Styles from "./DepartmentBranches.module.css"

import { getDepartmentBranches } from "../../api/services/Admin/AdminDepartmentBranches"


function DepartmentBranches() {

  const { departmentId } = useParams()
  const navigate = useNavigate()

  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")


  useEffect(() => {

    const fetchBranches = async () => {

      try {

        setLoading(true)
        setError("")

        const data = await getDepartmentBranches(departmentId)

        setBranches(data)

      } catch (err) {

        console.error(err)
        setError("Could not load branches.")

      } finally {

        setLoading(false)

      }
    }

    fetchBranches()

  }, [departmentId])


  const filteredBranches = branches.filter((branch) => {

    const searchValue = search.toLowerCase()

    return (
      (branch.branch_name || "")
        .toLowerCase()
        .includes(searchValue) ||

      (branch.placename || "")
        .toLowerCase()
        .includes(searchValue) ||

      (branch.location || "")
        .toLowerCase()
        .includes(searchValue)
    )

  })


  return (

    <AdminLayout title="Department Branches">

      <div className={Styles.card}>

        {/* HEADER */}

        <div className={Styles.cardHeader}>

          <div>

            <button
              className={Styles.backBtn}
              onClick={() => navigate("/admin/deptview")}
            >
              <FaArrowLeft />
              Back
            </button>

            <h3>
              Department Branches
            </h3>

            <p>
              View branches added by this department.
            </p>

          </div>


          {/* SEARCH */}

          <div className={Styles.searchBox}>

            <FaSearch className={Styles.searchIcon} />

            <input
              type="text"
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

        </div>


        {/* LOADING */}

        {loading && (

          <div className={Styles.stateBlock}>
            <p>Loading branches...</p>
          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className={Styles.stateBlock}>
            <p className={Styles.errorText}>
              {error}
            </p>
          </div>

        )}


        {/* EMPTY */}

        {!loading && !error && filteredBranches.length === 0 && (

          <div className={Styles.stateBlock}>
            <p>
              {search
                ? "No branches match your search."
                : "No branches found for this department."}
            </p>
          </div>

        )}


        {/* TABLE */}

        {!loading && !error && filteredBranches.length > 0 && (

          <div className={Styles.tableWrap}>

            <table className={Styles.table}>

              <thead>

                <tr>
                  <th>Branch</th>
                  <th>Location</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>

              </thead>


              <tbody>

                {filteredBranches.map((branch) => (

                  <tr key={branch.id}>

                    <td>

                      <div className={Styles.branchCell}>

                        <div className={Styles.branchAvatar}>
                          {(branch.branch_name || "B")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>

                          <p className={Styles.branchName}>
                            {branch.branch_name}
                          </p>

                          <p className={Styles.branchMeta}>
                            {branch.placename || "No place specified"}
                          </p>

                        </div>

                      </div>

                    </td>


                    <td>
                      {branch.location || "—"}
                    </td>


                    <td>
                      {branch.phone || "—"}
                    </td>


                    <td>

                      <span
                        className={
                          branch.is_active
                            ? Styles.activeTag
                            : Styles.inactiveTag
                        }
                      >
                        {branch.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </td>


                    <td>

                      <button
                        className={Styles.employeeBtn}
                        onClick={() =>
                          navigate(`/admin/branches/${branch.id}/employees`)
                        }
                      >
                        <FaUsers />
                        Employees
                      </button>

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

export default DepartmentBranches

