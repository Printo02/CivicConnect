import React, { useEffect, useState } from "react";
import AdminLayout from "../components/dashboard/AdminLayout";
import Styles from "./ViewUser.module.css";

import {
  getUsers,
  deactivateUser,
  reactivateUser
} from "../../api/services/Admin/adminuserview";


function ViewUsers() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // ACTIVE / INACTIVE
  const [view, setView] = useState("active");

  // ROLE FILTER
  const [roleFilter, setRoleFilter] = useState("all");

  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);


  // =========================================================
  // FETCH USERS
  // =========================================================

  const fetchUsers = async () => {

    setLoading(true);
    setError("");

    try {

      const data = await getUsers();

      setUsers(data);

    } catch (err) {

      console.error(err);

      setError("Could not load users.");

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);


  // =========================================================
  // DELETE / DEACTIVATE MODAL
  // =========================================================

  const confirmDelete = (user) => {
    setDeletingUser(user);
  };


  const cancelDelete = () => {
    setDeletingUser(null);
  };


  // =========================================================
  // ROLE DISPLAY
  // =========================================================

  const getRoleName = (role) => {

    switch (role) {

      case "user":
        return "User";

      case "dept":
        return "Department";

      case "branch":
        return "Branch";

      case "BranchEmployee":
        return "Branch Employee";

      case "representative":
        return "Representative";

      default:
        return role || "User";
    }
  };


  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers = users.filter((u) => {

    // SEARCH
    const searchValue = search.toLowerCase();

    const matchesSearch =
      (u.first_name || "")
        .toLowerCase()
        .includes(searchValue) ||

      (u.email || "")
        .toLowerCase()
        .includes(searchValue);


    // ACTIVE / INACTIVE
    const matchesStatus =
      view === "active"
        ? u.is_active
        : !u.is_active;


    // ROLE
    const matchesRole =
      roleFilter === "all"
        ? true
        : (u.role || "user") === roleFilter;


    return (
      matchesSearch &&
      matchesStatus &&
      matchesRole
    );
  });


  // =========================================================
  // DEACTIVATE
  // =========================================================

  const handleDeactivate = async () => {

    if (!deletingUser) return;

    setDeleting(true);

    try {

      await deactivateUser(deletingUser.id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === deletingUser.id
            ? {
                ...u,
                is_active: false
              }
            : u
        )
      );

      setDeletingUser(null);

    } catch (err) {

      console.error(err);

      alert("Could not deactivate user.");

    } finally {

      setDeleting(false);

    }
  };


  // =========================================================
  // REACTIVATE
  // =========================================================

  const handleReactivate = async (userId) => {

    try {

      await reactivateUser(userId);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                is_active: true
              }
            : u
        )
      );

    } catch (err) {

      console.error(err);

      alert("Could not reactivate user.");

    }
  };


  // =========================================================
  // ROLE COUNTS
  // =========================================================

  const activeUsers = users.filter(
    (u) => u.is_active
  );

  const inactiveUsers = users.filter(
    (u) => !u.is_active
  );


  const getRoleCount = (role) => {

    const source =
      view === "active"
        ? activeUsers
        : inactiveUsers;

    if (role === "all") {
      return source.length;
    }

    return source.filter(
      (u) => (u.role || "user") === role
    ).length;
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <AdminLayout title="Users List">

      <div className={Styles.tableSection}>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className={Styles.tableHeader}>

          {/* STATUS TABS */}

          <div className={Styles.tabs}>

            <button
              className={
                view === "active"
                  ? Styles.activeTab
                  : ""
              }
              onClick={() => {
                setView("active");
                setRoleFilter("all");
              }}
            >
              Active Users
              <span className={Styles.tabCount}>
                {activeUsers.length}
              </span>
            </button>


            <button
              className={
                view === "inactive"
                  ? Styles.activeTab
                  : ""
              }
              onClick={() => {
                setView("inactive");
                setRoleFilter("all");
              }}
            >
              Deactivated Users
              <span className={Styles.tabCount}>
                {inactiveUsers.length}
              </span>
            </button>

          </div>


          {/* SEARCH */}

          <div className={Styles.tableSearch}>

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>


        {/* =================================================
            ROLE TABS
        ================================================= */}

        <div className={Styles.roleTabs}>

          <button
            className={
              roleFilter === "all"
                ? Styles.activeRoleTab
                : ""
            }
            onClick={() => setRoleFilter("all")}
          >
            All
            <span>
              {getRoleCount("all")}
            </span>
          </button>


          <button
            className={
              roleFilter === "user"
                ? Styles.activeRoleTab
                : ""
            }
            onClick={() => setRoleFilter("user")}
          >
            Users
            <span>
              {getRoleCount("user")}
            </span>
          </button>


          <button
            className={
              roleFilter === "dept"
                ? Styles.activeRoleTab
                : ""
            }
            onClick={() => setRoleFilter("dept")}
          >
            Departments
            <span>
              {getRoleCount("dept")}
            </span>
          </button>


          <button
            className={
              roleFilter === "branch"
                ? Styles.activeRoleTab
                : ""
            }
            onClick={() => setRoleFilter("branch")}
          >
            Branches
            <span>
              {getRoleCount("branch")}
            </span>
          </button>


          <button
            className={
              roleFilter === "BranchEmployee"
                ? Styles.activeRoleTab
                : ""
            }
            onClick={() =>
              setRoleFilter("BranchEmployee")
            }
          >
            Branch Employees
            <span>
              {getRoleCount("BranchEmployee")}
            </span>
          </button>


          <button
            className={
              roleFilter === "representative"
                ? Styles.activeRoleTab
                : ""
            }
            onClick={() =>
              setRoleFilter("representative")
            }
          >
            Representatives
            <span>
              {getRoleCount("representative")}
            </span>
          </button>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className={Styles.Block}>

            <p>
              Loading users...
            </p>

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (

          <div className={Styles.Block}>

            <p className={Styles.errorText}>
              {error}
            </p>

          </div>

        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredUsers.length === 0 && (

          <div className={Styles.Block}>

            <p>

              {search
                ? "No users match your search."
                : "No users found."
              }

            </p>

          </div>

        )}


        {/* =================================================
            TABLE
        ================================================= */}

        {!loading &&
          !error &&
          filteredUsers.length > 0 && (

          <div className={Styles.tableWrapper}>

            <table className={Styles.table}>

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    User Type
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredUsers.map((user) => (

                  <tr key={user.id}>

                    {/* USER */}

                    <td>

                      <div
                        className={
                          Styles.complaintCell
                        }
                      >

                        <div
                          className={
                            Styles.complaintAvatar
                          }
                        />

                        <div>

                          <p
                            className={
                              Styles.complaintName
                            }
                          >
                            {user.first_name ||
                              "Unnamed User"}
                          </p>

                          <p
                            className={
                              Styles.complaintDept
                            }
                          >
                            {user.email}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* ROLE */}

                    <td className={Styles.dateCell}>

                      <span
                        className={
                          Styles.roleBadge
                        }
                      >
                        {getRoleName(user.role)}
                      </span>

                    </td>


                    {/* STATUS */}

                    <td>

                      <span
                        className={
                          user.is_active
                            ? Styles.activeBadge
                            : Styles.inactiveBadge
                        }
                      >

                        {user.is_active
                          ? "Active"
                          : "Inactive"}

                      </span>

                    </td>


                    {/* ACTION */}

                    <td>

                      <div
                        className={
                          Styles.tagRow
                        }
                      >

                        {user.is_active ? (

                          <span
                            className={
                              Styles.tagdelete
                            }
                            onClick={() =>
                              confirmDelete(user)
                            }
                          >
                            Deactivate
                          </span>

                        ) : (

                          <span
                            className={
                              Styles.tagview
                            }
                            onClick={() =>
                              handleReactivate(
                                user.id
                              )
                            }
                          >
                            Activate
                          </span>

                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ===================================================
          DEACTIVATE MODAL
      =================================================== */}

      {deletingUser && (

        <div
          className={Styles.modalOverlay}
          onClick={cancelDelete}
        >

          <div
            className={Styles.modal}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3
              className={Styles.modalTitle}
            >
              Deactivate User?
            </h3>


            <p
              className={Styles.modalText}
            >

              Are you sure you want to
              deactivate{" "}

              <strong>
                {deletingUser.first_name ||
                  deletingUser.email}
              </strong>
              ?

              <br />

              This user will no longer be
              able to log in.

            </p>


            <div
              className={Styles.modalActions}
            >

              <button
                type="button"
                className={Styles.cancelBtn}
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>


              <button
                type="button"
                className={Styles.deleteBtn}
                onClick={handleDeactivate}
                disabled={deleting}
              >

                {deleting
                  ? "Deactivating..."
                  : "Deactivate"}

              </button>

            </div>

          </div>

        </div>

      )}

    </AdminLayout>
  );
}

export default ViewUsers;

