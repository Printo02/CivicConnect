import React, { useEffect, useState } from "react";
import AdminLayout from "../components/dashboard/AdminLayout";
import Styles from "./ViewUser.module.css";
// import Styles from '../components/module.css/DeptLayout.module.css'

import { getUsers, deactivateUser, reactivateUser } from "../../api/services/Admin/adminuserview";

function ViewUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("active");

  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);

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

  const confirmDelete = (user) => {
    setDeletingUser(user);
  };

  const cancelDelete = () => {
    setDeletingUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.first_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (u.email || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      view === "active"
        ? u.is_active
        : !u.is_active;

    return matchesSearch && matchesStatus;
  });

  const handleReactivate = async (userId) => {
    try {
      await reactivateUser(userId);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, is_active: true }
            : u
        )
      );

      setView("active");

    } catch (err) {
      console.error(err);
      alert("Could not reactivate user.");
    }
  };

  const handleDeactivate = async () => {
    if (!deletingUser) return;

    setDeleting(true);

    try {
      await deactivateUser(deletingUser.id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === deletingUser.id
            ? { ...u, is_active: false }
            : u
        )
      );

      setDeletingUser(null);

      // Automatically switch to Deactivated Users tab
      setView("inactive");
    } catch (err) {
      console.error(err);
      alert("Could not deactivate user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Users List">
      <div className={Styles.tableSection}>
        <div className={Styles.tableHeader}>
          <div className={Styles.tabs}>
            <button
              className={view === "active" ? Styles.activeTab : ""}
              onClick={() => setView("active")}
            >
              Active Users
            </button>

            <button
              className={view === "inactive" ? Styles.activeTab : ""}
              onClick={() => setView("inactive")}
            >
              Deactivated Users
            </button>
          </div>

          <div className={Styles.tableSearch}>
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div className={Styles.Block}>
            <p>Loading users...</p>
          </div>
        )}

        {!loading && error && (
          <div className={Styles.Block}>
            <p className={Styles.errorText}>{error}</p>
          </div>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <div className={Styles.Block}>
            <p>
              {search
                ? "No users match your search."
                : "No users found."}
            </p>
          </div>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
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
                <tr key={c.id}>
                  <td>
                    <div className={Styles.complaintCell}>
                      <div className={Styles.complaintAvatar}></div>

                      <div>
                        <p className={Styles.complaintName}>
                          {c.first_name}
                        </p>

                        <p className={Styles.complaintDept}>
                          {c.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className={Styles.dateCell}>
                    {c.is_staff ? "Admin" : "User"}
                  </td>

                  <td className={Styles.dateCell}>
                    {c.is_active ? "Active" : "Inactive"}
                  </td>

                  <td>
                    <div className={Styles.tagRow}>
                      {view === "active" ? (
                        <span
                          className={Styles.tagdelete}
                          onClick={() => confirmDelete(c)}
                        >
                          Deactivate
                        </span>
                      ) : (
                      <span
                        className={Styles.tagview}
                        onClick={() => handleReactivate(c.id)}
                      >
                        Activate
                      </span>
                    )}
                    {/* <span className={Styles.tagdelete} onClick={() => confirmDelete(c)}> Promote </span>  */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
            {deletingUser && (
        <div
          className={Styles.modalOverlay}
          onClick={cancelDelete}
        >
          <div
            className={Styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={Styles.modalTitle}>
              Deactivate User?
            </h3>

            <p className={Styles.modalText}>
              Are you sure you want to deactivate{" "}
              <strong>
                {deletingUser.first_name || deletingUser.email}
              </strong>
              ?
              <br />
              This user will no longer be able to log in.
            </p>

            <div className={Styles.modalActions}>
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