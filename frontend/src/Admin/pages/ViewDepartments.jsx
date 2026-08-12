// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AdminLayout from "../components/dashboard/AdminLayout";
// import Styles from "./Department.module.css";
// import { FaBuilding, FaSearch, FaArrowRight } from "react-icons/fa";
// import { getDepartments } from "../../api/services/departmentService";

// export default function ViewDepartments() {
//   const navigate = useNavigate();

//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");

//   useEffect(() => {
//     const fetchDepartments = async () => {
//       try {
//         const data = await getDepartments();
//         setDepartments(data);
//       } catch (err) {
//         console.error(err);
//         setError("Could not load departments.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDepartments();
//   }, []);

//   const filtered = departments.filter((dept) =>
//     dept.deptname?.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <AdminLayout title="Departments">
//       <div className={Styles.card}>
//         <div className={Styles.cardHeader}>
//           <div>
//             <h3>Departments</h3>
//             <p>View all departments and manage their branches.</p>
//           </div>

//           <div className={Styles.searchBox}>
//             <FaSearch className={Styles.searchIcon} />

//             <input
//               type="text"
//               placeholder="Search Department"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//         </div>

//         {loading && (
//           <div className={Styles.stateBlock}>
//             <p>Loading departments...</p>
//           </div>
//         )}

//         {!loading && error && (
//           <div className={Styles.stateBlock}>
//             <p className={Styles.errorText}>{error}</p>
//           </div>
//         )}

//         {!loading && !error && filtered.length === 0 && (
//           <div className={Styles.stateBlock}>
//             <FaBuilding className={Styles.emptyIcon} />
//             <p>No departments found.</p>
//           </div>
//         )}

//         {!loading && !error && filtered.length > 0 && (
//           <table className={Styles.table}>
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Department</th>
//                 <th>Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filtered.map((dept, index) => (
//                 <tr key={dept.id}>
//                   <td>{index + 1}</td>

//                   <td>{dept.deptname}</td>

//                   <td>
//                     <button
//                       className={Styles.viewBtn}
//                       onClick={() =>
//                         navigate(`/departments/${dept.id}`)
//                       }
//                     >
//                       View Branches
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </AdminLayout>
//   );
// }

// 
import React from 'react'

const ViewDepartments = () => {
  return (
    <div>

    </div>
  )
}

export default ViewDepartments