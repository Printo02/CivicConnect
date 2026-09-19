import React, { useEffect, useMemo, useState } from "react";
import {FaSearch,FaFilter,FaChevronRight,FaSyncAlt,FaMapMarkerAlt,FaCalendarAlt} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ComplaintStatusBadge from "../components/ComplaintStatusBadge";
import { getBranchEmployeeComplaints } from "../../api/services/BranchEmployee/Complaint.js";
import styles from "../components/module.css/BranchEmployeeComplaintDetail.module.css";
import BranchEmployeeLayout from "../components/BranchEmployeeLayout";

/* ============================================================
   HELPERS
============================================================ */

function unwrap(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

const PAGE_SIZE = 8;

/* ============================================================
   COMPONENT
============================================================ */

export default function BranchEmployeeComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  /* ==========================================================
     LOAD COMPLAINTS
  ========================================================== */

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBranchEmployeeComplaints();

      console.log(
        "Branch employee complaints API response:",
        data
      );

      setComplaints(unwrap(data));
    } catch (err) {
      console.error(
        "Failed to load branch employee complaints:",
        err
      );

      const responseData = err?.response?.data;

      setError(
        responseData?.detail ||
          responseData?.message ||
          responseData?.error ||
          "Unable to load complaints."
      );

      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadComplaints();
  }, []);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return complaints.filter((item) => {
      const itemStatus = String(
        item.status || ""
      ).toLowerCase();

      const matchesStatus =
        status === "all" ||
        itemStatus === status;

      const matchesSearch =
        !q ||
        String(item.title || "")
          .toLowerCase()
          .includes(q) ||
        String(item.description || "")
          .toLowerCase()
          .includes(q) ||
        String(item.location || "")
          .toLowerCase()
          .includes(q) ||
        String(item.id || "")
          .includes(q) ||
        String(item.citizen_name || "")
          .toLowerCase()
          .includes(q) ||
        String(item.category_name || "")
          .toLowerCase()
          .includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [complaints, search, status]);

  /* ==========================================================
     STATUS COUNTS
  ========================================================== */

  const statusCounts = useMemo(() => {
    return complaints.reduce(
      (counts, complaint) => {
        const complaintStatus = String(
          complaint.status || ""
        ).toLowerCase();

        if (counts[complaintStatus] !== undefined) {
          counts[complaintStatus] += 1;
        }

        return counts;
      },
      {
        pending: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        rejected: 0,
      }
    );
  }, [complaints]);

  /* ==========================================================
     RESET PAGE WHEN FILTER CHANGES
  ========================================================== */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalPages = Math.ceil(
    filtered.length / PAGE_SIZE
  );

  const paginatedComplaints = useMemo(() => {
    const startIndex =
      (currentPage - 1) * PAGE_SIZE;

    const endIndex =
      startIndex + PAGE_SIZE;

    return filtered.slice(
      startIndex,
      endIndex
    );
  }, [filtered, currentPage]);

  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const firstItem =
    filtered.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const lastItem = Math.min(
    currentPage * PAGE_SIZE,
    filtered.length
  );

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 3) {
      return [
        1,
        2,
        3,
        4,
        "...",
        totalPages,
      ];
    }

    if (
      currentPage >=
      totalPages - 2
    ) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  /* ==========================================================
     OPEN DETAIL
  ========================================================== */

  const openComplaint = (id) => {
    /*
     * Mark the complaint as seen locally.
     * This is used by the BranchEmployeeLayout sidebar
     * notification badge.
     */
    const seenIds = JSON.parse(
      localStorage.getItem(
        "branchemployee_seen_complaints"
      ) || "[]"
    );

    if (!seenIds.includes(id)) {
      seenIds.push(id);

      localStorage.setItem(
        "branchemployee_seen_complaints",
        JSON.stringify(seenIds)
      );
    }

    navigate(
      `/branchemployee/complaints/${id}`
    );
  };

  /* ==========================================================
     STATUS TOGGLE
  ========================================================== */

  const statusOptions = [
    {
      value: "all",
      label: "All",
      count: complaints.length,
    },
    {
      value: "pending",
      label: "Pending",
      count: statusCounts.pending,
    },
    {
      value: "in_progress",
      label: "In Progress",
      count: statusCounts.in_progress,
    },
    {
      value: "resolved",
      label: "Resolved",
      count: statusCounts.resolved,
    },
    {
      value: "closed",
      label: "Closed",
      count: statusCounts.closed,
    },
    {
      value: "rejected",
      label: "Rejected",
      count: statusCounts.rejected,
    },
  ];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <BranchEmployeeLayout>
      <div className={styles.page}>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className={styles.header}>
          <div>
            <h1>Complaints</h1>

            <p>
              Complaints assigned to you by your branch.
            </p>
          </div>

          <button
            type="button"
            className={styles.iconButton}
            onClick={loadComplaints}
            title="Refresh complaints"
            disabled={loading}
          >
            <FaSyncAlt
              className={
                loading
                  ? styles.spin
                  : ""
              }
            />
          </button>
        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className={styles.toolbar}>

          <div className={styles.searchBox}>
            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search complaints..."
            />
          </div>

        </div>

        {/* ==================================================
            STATUS TOGGLES
        ================================================== */}

        <div className={styles.statusFilter}>

          <div className={styles.statusFilterHeader}>
            <FaFilter />
            <span>Status</span>
          </div>

          <div className={styles.statusToggleGroup}>

            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.statusToggle} ${
                  status === option.value
                    ? styles.statusToggleActive
                    : ""
                }`}
                onClick={() =>
                  setStatus(option.value)
                }
              >
                <span>
                  {option.label}
                </span>

                <span
                  className={styles.statusCount}
                >
                  {option.count}
                </span>
              </button>
            ))}

          </div>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* ==================================================
            SUMMARY
        ================================================== */}

        {!loading && (
          <div className={styles.summary}>
            <span>
              {filtered.length === 0
                ? "No complaints"
                : `Showing ${firstItem}-${lastItem} of ${filtered.length} complaints`}
            </span>
          </div>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <div className={styles.state}>
            Loading complaints...
          </div>
        )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          filtered.length === 0 && (
            <div className={styles.empty}>
              <h3>
                No complaints found
              </h3>

              <p>
                {complaints.length === 0
                  ? "There are currently no complaints assigned to you."
                  : "There are no complaints matching the selected filters."}
              </p>
            </div>
          )}

        {/* ==================================================
            LIST
        ================================================== */}

        {!loading &&
          paginatedComplaints.length > 0 && (
            <>
              <div className={styles.list}>

                {paginatedComplaints.map(
                  (complaint, index) => {

                    const serialNumber =
                      (currentPage - 1) *
                        PAGE_SIZE +
                      index +
                      1;

                    return (
                      <button
                        type="button"
                        key={complaint.id}
                        className={styles.card}
                        onClick={() =>
                          openComplaint(
                            complaint.id
                          )
                        }
                      >

                        {/* TOP ROW */}

                        <div
                          className={
                            styles.cardTop
                          }
                        >
                          <div
                            className={
                              styles.cardIdentity
                            }
                          >
                            <span
                              className={
                                styles.serialNumber
                              }
                            >
                              {serialNumber}.
                            </span>

                            <span
                              className={
                                styles.complaintId
                              }
                            >
                              #{complaint.id}
                            </span>
                          </div>

                          <ComplaintStatusBadge
                            status={
                              complaint.status
                            }
                            label={
                              complaint.status_display ||
                              complaint.status
                            }
                          />
                        </div>

                        {/* DATE + LOCATION */}

                        <div
                          className={
                            styles.cardMetaTop
                          }
                        >

                          {complaint.created_at && (
                            <span>
                              <FaCalendarAlt />

                              {new Date(
                                complaint.created_at
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          )}

                          {complaint.location && (
                            <span>
                              <FaMapMarkerAlt />

                              {complaint.location}
                            </span>
                          )}

                        </div>

                        {/* TITLE */}

                        <h2>
                          {complaint.title ||
                            "Untitled complaint"}
                        </h2>

                        {/* DESCRIPTION */}

                        <p
                          className={
                            styles.description
                          }
                        >
                          {complaint.description ||
                            "No description provided."}
                        </p>

                        {/* OTHER META */}

                        <div
                          className={
                            styles.meta
                          }
                        >

                          {(
                            complaint.branch_name ||
                            complaint.constituency_name
                          ) && (
                            <span>
                              {
                                complaint.branch_name ||
                                complaint.constituency_name
                              }
                            </span>
                          )}

                          {complaint.priority_display && (
                            <span>
                              Priority:{" "}
                              {
                                complaint.priority_display
                              }
                            </span>
                          )}

                          {complaint.category_name && (
                            <span>
                              Category:{" "}
                              {
                                complaint.category_name
                              }
                            </span>
                          )}

                        </div>

                        {/* OPEN */}

                        <div
                          className={
                            styles.open
                          }
                        >
                          View complaint

                          <FaChevronRight />
                        </div>

                      </button>
                    );
                  }
                )}

              </div>

              {/* ==================================================
                  PAGINATION
              ================================================== */}

              {totalPages > 1 && (
                <div
                  className={
                    styles.pagination
                  }
                >

                  <button
                    type="button"
                    className={
                      styles.pageButton
                    }
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      goToPage(
                        currentPage - 1
                      )
                    }
                  >
                    Previous
                  </button>

                  <div
                    className={
                      styles.pageNumbers
                    }
                  >
                    {getPageNumbers().map(
                      (page, index) => {

                        if (
                          page === "..."
                        ) {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className={
                                styles.ellipsis
                              }
                            >
                              ...
                            </span>
                          );
                        }

                        return (
                          <button
                            type="button"
                            key={page}
                            className={`${
                              styles.pageNumber
                            } ${
                              currentPage === page
                                ? styles.activePage
                                : ""
                            }`}
                            onClick={() =>
                              goToPage(page)
                            }
                          >
                            {page}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    className={
                      styles.pageButton
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      goToPage(
                        currentPage + 1
                      )
                    }>Next</button>
                </div>
              )}
            </>
          )}
      </div>
    </BranchEmployeeLayout>
  );
}
