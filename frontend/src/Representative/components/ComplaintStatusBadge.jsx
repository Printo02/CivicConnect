import React from "react";
import { FaCircle } from "react-icons/fa";
import styles from '../components/module.css/RepresentativeComplaints.module.css'


const STATUS_META = {
  pending: ["Pending", "pending"],
  assigned: ["Assigned", "assigned"],
  in_progress: ["In Progress", "inProgress"],
  resolved: ["Resolved", "resolved"],
  rejected: ["Rejected", "rejected"],
};

export default function ComplaintStatusBadge({ status, label }) {
  const key = String(status || "").toLowerCase();
  const [text, className] = STATUS_META[key] || [label || status || "Unknown", "default"];

  return (
    <span className={`${styles.statusBadge} ${styles[className] || ""}`}>
      <FaCircle size={7} />
      {text}
    </span>
  );
}
