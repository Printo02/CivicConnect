// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import AdminLayout from "../components/dashboard/AdminLayout";
// import Styles from "./AddBranch.module.css";
// import { FaSave, FaArrowLeft } from "react-icons/fa";
// import MapPicker from "../context/MapPicker";
// import { addDepartmentBranch } from "../../api/services/departmentService";
// import { getDistricts } from "../../api/services/districtService";

// export default function AddBranch() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [districts, setDistricts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   const [form, setForm] = useState({
//     region: "",
//     phone: "",
//     email: "",
//     location: "",
//     website: "",
//     urls: "",
//   });

//   useEffect(() => {
//     const fetchDistricts = async () => {
//       try {
//         const data = await getDistricts();
//         setDistricts(data);
//       } catch (err) {
//         console.error("Failed to load districts:", err);
//         setError("Could not load districts. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDistricts();
//   }, []);

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setSaving(true);

//     try {
//       await addDepartmentBranch(id, {
//         region: form.region,
//         phone: form.phone,
//         email: form.email,
//         location: form.location,
//         website: form.website,
//         urls: form.urls,
//       });

//       alert("Branch added successfully.");

//       navigate(`/departments/${id}`);
//     } catch (err) {
//       console.error(err);
//       console.log(err.response?.data);

//       alert(
//         err.response?.data?.detail ||
//           JSON.stringify(err.response?.data)
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <AdminLayout title="Add Branch">
//       <div className={Styles.card}>
//         <div className={Styles.header}>
//           <button
//             className={Styles.backBtn}
//             onClick={() => navigate(-1)}
//           >
//             <FaArrowLeft />
//             Back
//           </button>

//           <h2>Add Department Branch</h2>
//         </div>

//         {loading ? (
//           <p>Loading districts...</p>
//         ) : (
//           <form className={Styles.form} onSubmit={handleSubmit}>
//             <div className={Styles.inputGroup}>
//               <label>Select District</label>

//               <select
//                 name="region"
//                 value={form.region}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select District</option>

//                 {districts.map((d) => (
//                   <option key={d.id} value={d.id}>
//                     {d.dname}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className={Styles.inputGroup}>
//               <label>Phone Number</label>

//               <input
//                 type="text"
//                 name="phone"
//                 value={form.phone}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             <div className={Styles.inputGroup}>
//               <label>Email</label>

//               <input
//                 type="email"
//                 name="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             <div className={Styles.inputGroup}>
//               <label>Location</label>

//               {/* If your MapPicker is ready, replace this input with it */}
//               {/* 
//               <MapPicker
//                 onLocationSelect={(location, url) =>
//                   setForm((prev) => ({
//                     ...prev,
//                     location,
//                     urls: url,
//                   }))
//                 }
//               />
//               */}

//               <input
//                 type="text"
//                 name="location"
//                 value={form.location}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             <div className={Styles.inputGroup}>
//               <label>Website</label>

//               <input
//                 type="url"
//                 name="website"
//                 value={form.website}
//                 onChange={handleChange}
//               />
//             </div>

//             <div className={Styles.inputGroup}>
//               <label>Google Map URL</label>

//               <input
//                 type="url"
//                 name="urls"
//                 value={form.urls}
//                 onChange={handleChange}
//               />
//             </div>

//             {error && (
//               <p className={Styles.errorText}>{error}</p>
//             )}

//             <button
//               type="submit"
//               className={Styles.submitBtn}
//               disabled={saving}
//             >
//               <FaSave />
//               {saving ? "Saving..." : "Save Branch"}
//             </button>
//           </form>
//         )}
//       </div>
//     </AdminLayout>
//   );
// }


import React from 'react'

const AddBranch = () => {
  return (
    <div>AddBranch</div>
  )
}

export default AddBranch