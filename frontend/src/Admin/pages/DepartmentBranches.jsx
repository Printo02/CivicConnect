import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../components/dashboard/AdminLayout";
import Styles from "./DepartmentBranches.module.css";
import { FaPlus, FaSearch, FaCheckCircle, FaTimesCircle, FaSave } from "react-icons/fa";
import { getDepartments,getDepartmentBranches, verifyBranch, addDepartmentBranch } from "../../api/services/Admin/departmentService";
import { getDistricts } from "../../api/services/Admin/districtService";

export default function DepartmentBranches() {
  const { id } = useParams();

  const [branches, setBranches] = useState([]);
  const [dept, setdept] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    region: "",
    phone: "",
    email: "",
    location: "",
    website: "",
    urls: "",
  });

  useEffect(() => { 
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const data = await getDepartmentBranches(id);
      setBranches(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    const fetchdepts = async () =>{
      try {
        const data = await getDepartments()
        setdept(data)
      }
      catch (err) {
        console.error('Failed to load profile', err)
      }
    } 
    fetchdepts()},[] )

  const handleVerify = async (branchId) => {
    try {
      await verifyBranch(branchId);
      setBranches((prev) =>
        prev.map((branch) =>
          branch.id === branchId ? { ...branch, is_verified: true } : branch
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    setFormError("");
    setForm({ region: "", phone: "", email: "", location: "", website: "", urls: "" });

    if (districts.length === 0) {
      setDistrictsLoading(true);
      try {
        const data = await getDistricts();
        setDistricts(data);
      } catch (err) {
        console.error("Failed to load districts:", err);
        setFormError("Could not load districts.");
      } finally {
        setDistrictsLoading(false);
      }
    }
  };

  const closeAddModal = () => setShowAddModal(false);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const newBranch = await addDepartmentBranch(id, form);
      setBranches((prev) => [...prev, newBranch]);
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.detail || JSON.stringify(err.response?.data) || "Could not add branch."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.region_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Department Branches">
      <div className={Styles.card}>
        <div className={Styles.cardHeader}>
          {filteredBranches.length > 0 && (
            <div>
              <h3>{filteredBranches[0].dept_name}</h3>
              <p>Manage department branches.</p>
            </div>
          )}

          <div className={Styles.headerRight}>
            <div className={Styles.searchBox}>
              <FaSearch />
              <input
                placeholder="Search branch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className={Styles.addBtn} onClick={openAddModal}>
              <FaPlus />
              Add Branch
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredBranches.length === 0 ? (
          <p className={Styles.emptyText}>
            {search ? "No branches match your search." : "No branches added yet."}
          </p>
        ) : (
          <table className={Styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Region</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Location</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredBranches.map((branch, index) => (
                <tr key={branch.id}>
                  <td>{index + 1}</td>
                  <td>{branch.region_name}</td>
                  <td>{branch.phone}</td>
                  <td>{branch.email}</td>
                  <td>{branch.location}</td>
                  <td>
                    {branch.is_verified ? (
                      <span className={Styles.verified}>
                        <FaCheckCircle />
                        Verified
                      </span>
                    ) : (
                      <span className={Styles.pending}>
                        <FaTimesCircle />
                        Pending
                      </span>
                    )}
                  </td>
                  <td>
                    {!branch.is_verified && (
                      <button className={Styles.verifyBtn} onClick={() => handleVerify(branch.id)}>
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className={Styles.modalOverlay} onClick={closeAddModal}>
          <div className={Styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={Styles.modalTitle}>Add branch</h3>

            {districtsLoading ? (
              <p>Loading districts...</p>
            ) : (
              <form onSubmit={handleAddSubmit}>
                <div className={Styles.inputGroup}>
                  <label>Select District</label>
                  <select name="region" value={form.region} onChange={handleFormChange} required>
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.dname}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={Styles.inputGroup}>
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={form.phone} onChange={handleFormChange} required />
                </div>

                <div className={Styles.inputGroup}>
                  <label>Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleFormChange} required />
                </div>

                <div className={Styles.inputGroup}>
                  <label>Location</label>
                  <input type="text" name="location" value={form.location} onChange={handleFormChange} required />
                </div>

                <div className={Styles.inputGroup}>
                  <label>Website</label>
                  <input type="url" name="website" value={form.website} onChange={handleFormChange} />
                </div>

                <div className={Styles.inputGroup}>
                  <label>Google Map URL</label>
                  <input type="url" name="urls" value={form.urls} onChange={handleFormChange} />
                </div>

                {formError && <p className={Styles.errorText}>{formError}</p>}

                <div className={Styles.modalActions}>
                  <button type="button" className={Styles.cancelBtn} onClick={closeAddModal}>
                    Cancel
                  </button>
                  <button type="submit" className={Styles.submitBtn} disabled={saving}>
                    <FaSave />
                    {saving ? "Saving..." : "Save Branch"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}