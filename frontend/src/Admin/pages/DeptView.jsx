import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/dashboard/AdminLayout";
import Styles from "./Department.module.css";
import { FaBuilding, FaSearch, FaArrowRight, FaPlus, FaTrash } from "react-icons/fa";
import {  getDepartments, addDepartment, deleteDepartment } from "../../api/services/Admin/departmentService";

export default function DeptView() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [deptname, setDeptname] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchDepartments = async () => {
    setLoading(true);
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit fires")
    if (!deptname.trim()) return;

    setAdding(true);
    try {
      const newDept = await addDepartment({ deptname });
      setDepartments((prev) => [...prev, newDept]);
      setDeptname("");
    } catch (err) {
      console.error(err);
      alert("Could not add department. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department? All of its branches will be removed too. This can't be undone.")) return;

    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete department. Please try again.");
    }
  };

  const filtered = departments.filter((dept) =>
    dept.deptname?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Departments">
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          <div>
            <h3>Departments</h3>
            <p>Create departments and manage their branches.</p>
          </div>

          <div className={Styles.searchBox}>
            <FaSearch className={Styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Department"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <form onSubmit={handleAddSubmit} className={Styles.addForm}>
          <input
            type="text"
            placeholder="New department name"
            value={deptname}
            onChange={(e) => setDeptname(e.target.value)}
          />
          <button type="submit" className={Styles.addBtn} disabled={adding}>
            <FaPlus />
            {adding ? "Adding..." : "Add Department"}
          </button>
        </form>

        {loading && (
          <div className={Styles.stateBlock}>
            <p>Loading departments...</p>
          </div>
        )}

        {!loading && error && (
          <div className={Styles.stateBlock}>
            <p className={Styles.errorText}>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={Styles.stateBlock}>
            <FaBuilding className={Styles.emptyIcon} />
            <p>{search ? "No departments match your search." : "No departments found."}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table className={Styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((dept, index) => (
                <tr key={dept.id}>
                  <td>{index + 1}</td>
                  <td>{dept.deptname}</td>
                  <td>
                    <div className={Styles.actionsRow}>
                      <button
                        className={Styles.viewBtn}
                        onClick={() => navigate(`/admin/departments/${dept.id}`)}
                      >
                        View Branches

                      </button>
                      <button
                        className={Styles.deleteIconBtn}
                        onClick={() => handleDelete(dept.id)}
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
        )}
      </div>
    </AdminLayout>
  );
}