import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/dashboard/AdminLayout";
import Styles from "./Department.module.css";
import { FaBuilding, FaSearch, FaTrash, FaPlus, FaTimes, FaSave } from "react-icons/fa";
import { getDepartments, addDepartment, deleteDepartment } from "../../api/services/Admin/departmentService";


export default function DeptView() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    deptname: "",
    deptadv: "",
  });

  const [formError, setFormError] = useState("");

  // --------------------------------
  // Fetch departments
  // --------------------------------

  const fetchDepartments = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDepartments();

      setDepartments(data);
    } catch (err) {
      console.error(err);
      setError("Could not load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // --------------------------------
  // Open modal
  // --------------------------------

  const openAddModal = () => {
    setFormData({
      deptname: "",
      deptadv: "",
    });

    setFormError("");
    setShowAddModal(true);
  };

  // --------------------------------
  // Close modal
  // --------------------------------

  const closeAddModal = () => {
    if (adding) return;

    setShowAddModal(false);

    setFormData({
      deptname: "",
      deptadv: "",
    });

    setFormError("");
  };

  // --------------------------------
  // Form input
  // --------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormError("");
  };

  // --------------------------------
  // Add department
  // --------------------------------

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    const deptname = formData.deptname.trim();
    const deptadv = formData.deptadv.trim().toUpperCase();

    if (!deptname) {
      setFormError("Department name is required.");
      return;
    }

    if (!deptadv) {
      setFormError("Department abbreviation is required.");
      return;
    }

    try {
      setAdding(true);

      const newDept = await addDepartment({
        deptname,
        deptadv,
      });

      // Add new department to table
      setDepartments((prev) => [
        ...prev,
        newDept,
      ]);

      // Close modal
      setShowAddModal(false);

      // Reset form
      setFormData({
        deptname: "",
        deptadv: "",
      });

    } catch (err) {
      console.error(err);

      const backendError =
        err?.response?.data?.deptname?.[0] ||
        err?.response?.data?.deptadv?.[0] ||
        err?.response?.data?.detail ||
        "Could not add department. Please try again.";

      setFormError(backendError);

    } finally {
      setAdding(false);
    }
  };

  // --------------------------------
  // Delete department
  // --------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm( 
      "Are you sure you want to delete this department?\n\n" +
      "This will also remove its department account and branches."
    );

    if (!confirmed) return;

    try {
      await deleteDepartment(id);

      setDepartments((prev) =>
        prev.filter((dept) => dept.id !== id)
      );

    } catch (err) {
      console.error("Delete department error:", err);

      const message =
        err.response?.data?.detail ||
        "Could not delete department.";

      alert(message);
    }
  };

  // --------------------------------
  // Search
  // --------------------------------

  const filtered = departments.filter((dept) =>
    dept.deptname
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Departments">

      <div className={Styles.card}>

        {/* =========================
            HEADER
        ========================= */}

        <div className={Styles.cardHeader}>

          <div>
            <h3>Departments</h3>

            <p>
              Create departments and manage their branches.
            </p>
          </div>

          <div className={Styles.headerActions}>

            {/* Search */}

            <div className={Styles.searchBox}>

              <FaSearch className={Styles.searchIcon} />

              <input
                type="text"
                placeholder="Search Department"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            {/* Add */}

            <button
              type="button"
              className={Styles.addBtn}
              onClick={openAddModal}
            >
              <FaPlus />
              Add Department
            </button>

          </div>

        </div>


        {/* =========================
            LOADING
        ========================= */}

        {loading && (
          <div className={Styles.stateBlock}>
            <p>Loading departments...</p>
          </div>
        )}


        {/* =========================
            ERROR
        ========================= */}

        {!loading && error && (
          <div className={Styles.stateBlock}>
            <p className={Styles.errorText}>
              {error}
            </p>
          </div>
        )}


        {/* =========================
            EMPTY
        ========================= */}

        {!loading &&
          !error &&
          filtered.length === 0 && (

            <div className={Styles.stateBlock}>

              <FaBuilding
                className={Styles.emptyIcon}
              />

              <p>
                {search
                  ? "No departments match your search."
                  : "No departments found."
                }
              </p>

            </div>
          )}


        {/* =========================
            TABLE
        ========================= */}

        {!loading &&
          !error &&
          filtered.length > 0 && (

            <div className={Styles.tableWrap}>

              <table className={Styles.table}>

                <thead>

                  <tr>
                    <th>#</th>
                    <th>Department</th>
                    <th>Abbreviation</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filtered.map((dept, index) => (

                    <tr key={dept.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {dept.deptname}
                      </td>

                      <td>
                        {dept.deptadv}
                      </td>

                      <td>
                        {dept.email || "—"}
                      </td>

                      <td>

                        <div
                          className={
                            Styles.actionsRow
                          }
                        >

                          <button
                            type="button"
                            className={
                              Styles.viewBtn
                            }
                            onClick={() =>
                              navigate(
                                `/admin/departments/${dept.id}`
                              )
                            }
                          >
                            Branches
                          </button>

                          <button
                            type="button"
                            className={
                              Styles.deleteIconBtn
                            }
                            onClick={() =>
                              handleDelete(dept.id)
                            }
                            aria-label="Delete department"
                          >
                            <FaTrash />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

      </div>


      {/* ==================================================
          ADD DEPARTMENT MODAL
      ================================================== */}

      {showAddModal && (
        <div
          className={Styles.modalOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div className={Styles.modalHorizontal}>

            {/* Header */}
            <div className={Styles.modalHeader}>
              <div>
                <h2 className={Styles.modalTitle}>
                  Add Department
                </h2>

                <p className={Styles.modalSubtitle}>
                  Create a new department account
                </p>
              </div>

              <button
                type="button"
                className={Styles.closeBtn}
                onClick={closeAddModal}
                disabled={adding}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Horizontal Form */}
            <form
              onSubmit={handleAddSubmit}
              className={Styles.horizontalForm}
            >
              {/* Department Name */}
              <div className={Styles.horizontalInputGroup}>
                <label htmlFor="deptname">
                  Department Name
                </label>

                <div className={Styles.inputWrapper}>
                  <FaBuilding className={Styles.inputIcon} />

                  <input
                    id="deptname"
                    type="text"
                    name="deptname"
                    placeholder="Public Works Department"
                    value={formData.deptname}
                    onChange={handleChange}
                    disabled={adding}
                    autoFocus
                  />
                </div>
              </div>

              {/* Abbreviation */}
              <div className={Styles.horizontalInputGroup}>
                <label htmlFor="deptadv">
                  Abbreviation
                </label>

                <input
                  id="deptadv"
                  type="text"
                  name="deptadv"
                  placeholder="PWD"
                  value={formData.deptadv}
                  onChange={handleChange}
                  maxLength={20}
                  disabled={adding}
                />
              </div>

              {/* Create */}
              <div className={Styles.horizontalButtonGroup}>
                <button
                  type="submit"
                  className={Styles.submitBtn}
                  disabled={adding}
                >
                  <FaSave />
                  {adding ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>

            {/* Error */}
            {formError && (
              <p className={Styles.errorText}>
                {formError}
              </p>
            )}

            {/* Credential information */}
            <div className={Styles.horizontalInfoBox}>
              <strong>Account credentials:</strong>{" "}
              Email and initial password are automatically generated from the abbreviation.
            </div>

            {/* Footer */}
            <div className={Styles.modalActions}>
              <button
                type="button"
                className={Styles.cancelBtn}
                onClick={closeAddModal}
                disabled={adding}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}