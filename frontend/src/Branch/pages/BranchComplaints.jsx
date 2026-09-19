import React, { useEffect, useMemo, useState } from "react";
import { FaSearch,FaFilter,FaChevronRight,
  FaSyncAlt,FaMapMarkerAlt,FaCalendarAlt,FaUserTie,FaTimes,FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ComplaintStatusBadge from "../components/ComplaintStatusBadge";
import { getBranchComplaints,getAssignableEmployees,assignComplaint} from "../../api/services/Branch/BranchComplaintApi";
import styles from "../components/module.css/BranchComplaintDetail.module.css";
import BranchLayout from "../components/BranchLayout";


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

export default function BranchComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(true);

  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  /* ==========================================================
     ASSIGNMENT STATE
  ========================================================== */

  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const [selectedComplaint, setSelectedComplaint] =
    useState(null);

  const [selectedEmployee, setSelectedEmployee] =
    useState("");

  const [assigning, setAssigning] = useState(false);

  const [assignError, setAssignError] = useState("");

  const [assignSuccess, setAssignSuccess] = useState("");


  /* ==========================================================
     LOAD COMPLAINTS
  ========================================================== */

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBranchComplaints();

      console.log(
        "Branch complaints API response:",
        data
      );

      setComplaints(unwrap(data));
    } catch (err) {
      console.error(
        "Failed to load branch complaints:",
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
     LOAD ACTIVE BRANCH EMPLOYEES
  ========================================================== */

  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);

      const data = await getAssignableEmployees();

      console.log(
        "Assignable employees:",
        data
      );

      setEmployees(unwrap(data));
    } catch (err) {
      console.error(
        "Failed to load branch employees:",
        err
      );

      const responseData = err?.response?.data;

      setAssignError(
        responseData?.detail ||
          responseData?.message ||
          responseData?.error ||
          "Unable to load branch employees."
      );

      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadComplaints();
    loadEmployees();
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
          .includes(q) ||
        String(item.assigned_employee_name || "")
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

        if (
          counts[complaintStatus] !== undefined
        ) {
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
    navigate(
      `/branch/complaints/${id}`
    );
  };


  /* ==========================================================
     OPEN ASSIGN MODAL
  ========================================================== */

  const openAssignModal = (
    event,
    complaint
  ) => {
    event.stopPropagation();

    setSelectedComplaint(complaint);

    setSelectedEmployee(
      complaint.assigned_employee
        ? String(
            complaint.assigned_employee
          )
        : ""
    );

    setAssignError("");

    setAssignSuccess("");

    setAssignModalOpen(true);
  };


  /* ==========================================================
     CLOSE ASSIGN MODAL
  ========================================================== */

  const closeAssignModal = () => {
    if (assigning) {
      return;
    }

    setAssignModalOpen(false);

    setSelectedComplaint(null);

    setSelectedEmployee("");

    setAssignError("");

    setAssignSuccess("");
  };


  /* ==========================================================
     ASSIGN COMPLAINT
  ========================================================== */

  const handleAssign = async () => {
    if (!selectedComplaint) {
      return;
    }

    if (!selectedEmployee) {
      setAssignError(
        "Please select a branch employee."
      );

      return;
    }

    try {
      setAssigning(true);

      setAssignError("");

      setAssignSuccess("");

      const response = await assignComplaint(
        selectedComplaint.id,
        Number(selectedEmployee)
      );

      console.log(
        "Complaint assigned:",
        response
      );

      const assignedName =
        response?.employee_name ||
        employees.find(
          (employee) =>
            String(employee.id) ===
            String(selectedEmployee)
        )?.emp_name ||
        employees.find(
          (employee) =>
            String(employee.id) ===
            String(selectedEmployee)
        )?.fullname ||
        "employee";

      setComplaints((previous) =>
        previous.map((complaint) =>
          complaint.id ===
          selectedComplaint.id
            ? {
                ...complaint,
                assigned_employee:
                  Number(selectedEmployee),
                assigned_employee_name:
                  assignedName,
                status:
                  response?.status ||
                  complaint.status,
                status_display:
                  response?.status_display ||
                  complaint.status_display,
              }
            : complaint
        )
      );

      setAssignSuccess(
        `Complaint assigned to ${assignedName}.`
      );

      setTimeout(() => {
        setAssignModalOpen(false);

        setSelectedComplaint(null);

        setSelectedEmployee("");

        setAssignSuccess("");
      }, 900);

    } catch (err) {
      console.error(
        "Failed to assign complaint:",
        err
      );

      const responseData =
        err?.response?.data;

      if (
        typeof responseData ===
        "object"
      ) {
        const firstError =
          Object.values(responseData)
            .flat()
            .find(
              (value) =>
                typeof value ===
                "string"
            );

        setAssignError(
          firstError ||
            responseData?.detail ||
            "Unable to assign complaint."
        );
      } else {
        setAssignError(
          "Unable to assign complaint."
        );
      }
    } finally {
      setAssigning(false);
    }
  };


  /* ==========================================================
     STATUS OPTIONS
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
    <BranchLayout>

      <div className={styles.page}>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className={styles.header}>

          <div>
            <h1>Complaints</h1>

            <p>
              Complaints assigned to your branch.
            </p>
          </div>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              loadComplaints();
              loadEmployees();
            }}
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
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search complaints..."
            />

          </div>

        </div>


        {/* ==================================================
            STATUS TOGGLES
        ================================================== */}

        <div className={styles.statusFilter}>

          <div
            className={
              styles.statusFilterHeader
            }
          >
            <FaFilter />

            <span>Status</span>
          </div>

          <div
            className={
              styles.statusToggleGroup
            }
          >

            {statusOptions.map(
              (option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.statusToggle} ${
                    status ===
                    option.value
                      ? styles.statusToggleActive
                      : ""
                  }`}
                  onClick={() =>
                    setStatus(
                      option.value
                    )
                  }
                >
                  <span>
                    {option.label}
                  </span>

                  <span
                    className={
                      styles.statusCount
                    }
                  >
                    {option.count}
                  </span>
                </button>
              )
            )}

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
                  ? "There are currently no complaints assigned to your branch."
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
                  (
                    complaint,
                    index
                  ) => {

                    const serialNumber =
                      (currentPage - 1) *
                        PAGE_SIZE +
                      index +
                      1;

                    return (
                      <div
                        key={
                          complaint.id
                        }
                        className={
                          styles.card
                        }
                      >

                        {/* ==================================================
                            CARD TOP
                        ================================================== */}

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
                              #
                              {
                                complaint.id
                              }
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


                        {/* ==================================================
                            DATE + LOCATION
                        ================================================== */}

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

                              {
                                complaint.location
                              }

                            </span>
                          )}

                        </div>


                        {/* ==================================================
                            TITLE
                        ================================================== */}

                        <h2>
                          {complaint.title ||
                            "Untitled complaint"}
                        </h2>


                        {/* ==================================================
                            DESCRIPTION
                        ================================================== */}

                        <p
                          className={
                            styles.description
                          }
                        >
                          {complaint.description ||
                            "No description provided."}
                        </p>


                        {/* ==================================================
                            OTHER META
                        ================================================== */}

                        <div
                          className={
                            styles.meta
                          }
                        >

                          {(
                            complaint.representative_constituency ||
                            complaint.constituency_name
                          ) && (
                            <span>
                              {
                                complaint.representative_constituency ||
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


                        {/* ==================================================
                            ASSIGNMENT
                        ================================================== */}

                        <div
                          className={
                            styles.assignmentRow
                          }
                        >

                          <div
                            className={
                              styles.assignmentInfo
                            }
                          >

                            <FaUserTie />

                            <div>

                              <span
                                className={
                                  styles.assignmentLabel
                                }
                              >
                                Assigned employee
                              </span>

                              <strong>
                                {complaint.assigned_employee_name ||
                                  "Not assigned"}
                              </strong>

                            </div>

                          </div>


                          <button
                            type="button"
                            className={
                              styles.assignButton
                            }
                            onClick={(event) =>
                              openAssignModal(
                                event,
                                complaint
                              )
                            }
                          >
                            <FaUserTie />

                            {complaint.assigned_employee
                              ? "Reassign"
                              : "Assign"}
                          </button>

                        </div>


                        {/* ==================================================
                            OPEN
                        ================================================== */}

                        <button
                          type="button"
                          className={
                            styles.open
                          }
                          onClick={() =>
                            openComplaint(
                              complaint.id
                            )
                          }
                        >
                          View complaint

                          <FaChevronRight />

                        </button>

                      </div>
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
                          page ===
                          "..."
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
                            className={`${styles.pageNumber} ${
                              currentPage ===
                              page
                                ? styles.activePage
                                : ""
                            }`}
                            onClick={() =>
                              goToPage(
                                page
                              )
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
                    }
                  >
                    Next
                  </button>

                </div>
              )}

            </>
          )}

      </div>


      {/* ============================================================
          ASSIGN MODAL
      ============================================================ */}

      {assignModalOpen && (
        <div
          className={
            styles.modalBackdrop
          }
          onClick={closeAssignModal}
        >

          <div
            className={
              styles.assignModal
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className={
                styles.modalHeader
              }
            >

              <div>
                <h2>
                  {selectedComplaint?.assigned_employee
                    ? "Reassign Complaint"
                    : "Assign Complaint"}
                </h2>

                <p>
                  Complaint #
                  {
                    selectedComplaint?.id
                  }
                </p>
              </div>


              <button
                type="button"
                className={
                  styles.modalClose
                }
                onClick={
                  closeAssignModal
                }
                disabled={assigning}
              >
                <FaTimes />
              </button>

            </div>


            {/* ==================================================
                COMPLAINT SUMMARY
            ================================================== */}

            <div
              className={
                styles.modalComplaint
              }
            >

              <strong>
                {selectedComplaint?.title ||
                  "Untitled complaint"}
              </strong>

              <span>
                {selectedComplaint?.location ||
                  "Location not provided"}
              </span>

            </div>


            {/* ==================================================
                EMPLOYEE
            ================================================== */}

            <div
              className={
                styles.formGroup
              }
            >

              <label>
                Branch employee
              </label>

              {employeesLoading ? (
                <div
                  className={
                    styles.employeeLoading
                  }
                >
                  Loading active employees...
                </div>
              ) : employees.length === 0 ? (
                <div
                  className={
                    styles.employeeEmpty
                  }
                >
                  No active employees are available
                  for assignment.
                </div>
              ) : (
                <select
                  value={
                    selectedEmployee
                  }
                  onChange={(event) =>
                    setSelectedEmployee(
                      event.target.value
                    )
                  }
                  disabled={assigning}
                >
                  <option value="">
                    Select employee
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={
                          employee.id
                        }
                        value={
                          employee.id
                        }
                      >
                        {employee.emp_name ||
                          employee.fullname ||
                          employee.name ||
                          `Employee #${employee.id}`}
                        {employee.email
                          ? ` — ${employee.email}`
                          : ""}
                      </option>
                    )
                  )}

                </select>
              )}

            </div>


            {/* ==================================================
                ERROR
            ================================================== */}

            {assignError && (
              <div
                className={
                  styles.assignError
                }
              >
                {assignError}
              </div>
            )}


            {/* ==================================================
                SUCCESS
            ================================================== */}

            {assignSuccess && (
              <div
                className={
                  styles.assignSuccess
                }
              >
                <FaCheck />

                {assignSuccess}
              </div>
            )}


            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div
              className={
                styles.modalActions
              }
            >

              <button
                type="button"
                className={
                  styles.cancelButton
                }
                onClick={
                  closeAssignModal
                }
                disabled={assigning}
              >
                Cancel
              </button>


              <button
                type="button"
                className={
                  styles.confirmAssignButton
                }
                onClick={
                  handleAssign
                }
                disabled={
                  assigning ||
                  !selectedEmployee ||
                  employeesLoading
                }
              >

                {assigning ? (
                  "Assigning..."
                ) : (
                  <>
                    <FaCheck />

                    {selectedComplaint?.assigned_employee
                      ? "Reassign"
                      : "Assign"}
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </BranchLayout>
  );
}