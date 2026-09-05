import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

function formatDate(value) {
  if (!value) return "N/A";

  if (value?.toDate) {
    return value.toDate().toLocaleDateString();
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === "string") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }

  return "N/A";
}

function Cases() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewCase, setShowNewCase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newCase, setNewCase] = useState({
    name: "",
    status: "Active",
    priority: "Normal",
    locationType: "Residential",
    locationName: "",
    address: "",
    city: "",
    state: "Oklahoma",
    clientName: "",
    description: "",
    leadInvestigator: "",
  });

  /*
   * =========================================================
   * LOAD CASES FROM FIRESTORE
   * =========================================================
   */

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    try {
      setLoading(true);

      const casesRef = collection(db, "cases");

      const casesQuery = query(
        casesRef,
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(casesQuery);

      const loadedCases = snapshot.docs.map((doc) => ({
        firestoreId: doc.id,
        ...doc.data(),
      }));

      setCases(loadedCases);
    } catch (err) {
      console.error("Error loading cases:", err);
      setError("Unable to load cases from the database.");
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * CASE NUMBER
   * =========================================================
   */

  function generateCaseNumber() {
    const year = new Date().getFullYear();

    const existingNumbers = cases
      .map((caseItem) => caseItem.id)
      .filter((id) => typeof id === "string")
      .map((id) => {
        const match = id.match(/NH-\d{4}-(\d+)/);
        return match ? Number(match[1]) : 0;
      });

    const highestNumber =
      existingNumbers.length > 0
        ? Math.max(...existingNumbers)
        : 0;

    return `NH-${year}-${String(highestNumber + 1).padStart(3, "0")}`;
  }

  /*
   * =========================================================
   * CREATE CASE
   * =========================================================
   */

  async function handleCreateCase(event) {
    event.preventDefault();

    if (!newCase.name.trim()) {
      setError("Case name is required.");
      return;
    }

    if (!newCase.locationName.trim()) {
      setError("Location name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const caseNumber = generateCaseNumber();

      const caseRecord = {
        id: caseNumber,

        name: newCase.name.trim(),

        status: newCase.status,
        priority: newCase.priority,

        locationType: newCase.locationType,
        locationName: newCase.locationName.trim(),

        address: newCase.address.trim(),
        city: newCase.city.trim(),
        state: newCase.state,

        clientName: newCase.clientName.trim(),

        description: newCase.description.trim(),

        leadInvestigator:
          newCase.leadInvestigator.trim(),

        dateOpened: serverTimestamp(),

        /*
         * Future relationships.
         *
         * These will be populated as the case develops.
         */
        investigationIds: [],
        evidenceIds: [],
        incidentReportIds: [],
        entityIds: [],
        objectIds: [],
        memberIds: [],

        investigationCount: 0,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "cases"), caseRecord);

      await loadCases();

      setNewCase({
        name: "",
        status: "Active",
        priority: "Normal",
        locationType: "Residential",
        locationName: "",
        address: "",
        city: "",
        state: "Oklahoma",
        clientName: "",
        description: "",
        leadInvestigator: "",
      });

      setShowNewCase(false);
    } catch (err) {
      console.error("Error creating case:", err);
      setError(
        "Unable to create the case. Check the console for details."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * FILTER CASES
   * =========================================================
   */

  const filteredCases = useMemo(() => {
    return cases.filter((caseItem) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        caseItem.id?.toLowerCase().includes(search) ||
        caseItem.name?.toLowerCase().includes(search) ||
        caseItem.locationName?.toLowerCase().includes(search) ||
        caseItem.city?.toLowerCase().includes(search) ||
        caseItem.leadInvestigator
          ?.toLowerCase()
          .includes(search) ||
        caseItem.locationType
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        caseItem.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cases, searchTerm, statusFilter]);

  /*
   * =========================================================
   * STATISTICS
   * =========================================================
   */

  const activeCount = cases.filter(
    (caseItem) => caseItem.status === "Active"
  ).length;

  const reviewCount = cases.filter(
    (caseItem) => caseItem.status === "Review"
  ).length;

  const completedCount = cases.filter(
    (caseItem) => caseItem.status === "Completed"
  ).length;

  /*
   * =========================================================
   * FORM HANDLER
   * =========================================================
   */

  function updateNewCase(field, value) {
    setNewCase((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  return (
    <div className="nh-page nh-cases-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="nh-page-header">

        <div>
          <div className="nh-command-label">
            INVESTIGATIONS
          </div>

          <h1 className="nh-page-title">
            Investigation Cases
          </h1>

          <p className="nh-page-subtitle">
            Manage investigations, case records, and field activity.
          </p>
        </div>

        <button
          className="nh-primary-button"
          onClick={() => {
            setError("");
            setShowNewCase(true);
          }}
        >
          + New Case
        </button>

      </div>


      {/* =====================================================
          CASE STATISTICS
          ===================================================== */}

      <section className="nh-case-stats">

        <div className="nh-card nh-case-stat-card">
          <div className="nh-case-stat-label">
            Active Cases
          </div>

          <div className="nh-case-stat-value">
            {String(activeCount).padStart(2, "0")}
          </div>
        </div>

        <div className="nh-card nh-case-stat-card">
          <div className="nh-case-stat-label">
            Under Review
          </div>

          <div className="nh-case-stat-value">
            {String(reviewCount).padStart(2, "0")}
          </div>
        </div>

        <div className="nh-card nh-case-stat-card">
          <div className="nh-case-stat-label">
            Completed
          </div>

          <div className="nh-case-stat-value">
            {String(completedCount).padStart(2, "0")}
          </div>
        </div>

        <div className="nh-card nh-case-stat-card">
          <div className="nh-case-stat-label">
            Total Cases
          </div>

          <div className="nh-case-stat-value">
            {String(cases.length).padStart(2, "0")}
          </div>
        </div>

      </section>


      {/* =====================================================
          CASE DATABASE
          ===================================================== */}

      <section className="nh-cases-section">

        <div className="nh-section-header">

          <div>
            <h2 className="nh-section-title">
              Case Database
            </h2>

            <p className="nh-section-description">
              Investigation records currently registered in the system.
            </p>
          </div>

        </div>


        {/* ===================================================
            FILTER BAR
            =================================================== */}

        <div className="nh-card nh-case-toolbar">

          <div className="nh-case-search">

            <span className="nh-search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

          </div>


          <div className="nh-case-filter">

            <label htmlFor="case-status">
              Status
            </label>

            <select
              id="case-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Cases</option>
              <option value="Active">Active</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>

          </div>

        </div>


        {/* ===================================================
            CASE TABLE
            =================================================== */}

        <div className="nh-card nh-case-table-card">

          <div className="nh-case-table-wrapper">

            {loading ? (
              <div className="nh-case-empty">
                <div className="nh-case-empty-title">
                  Loading cases...
                </div>
              </div>
            ) : (
              <table className="nh-case-table">

                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Location</th>
                    <th>Lead Investigator</th>
                    <th>Date Opened</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>

                  {filteredCases.map((caseItem) => (

                    <tr key={caseItem.firestoreId}>

                      <td>

                        <div className="nh-case-name">
                          {caseItem.name}
                        </div>

                        <div className="nh-case-id">
                          {caseItem.id}
                        </div>

                      </td>

                      <td>
                        <span className="nh-table-text">
                          {caseItem.city
                            ? `${caseItem.city}, ${caseItem.state || "OK"}`
                            : caseItem.locationName || "N/A"}
                        </span>
                      </td>

                      <td>
                        <span className="nh-table-text">
                          {caseItem.leadInvestigator || "Unassigned"}
                        </span>
                      </td>

                      <td>
                        <span className="nh-table-text">
                          {formatDate(caseItem.dateOpened)}
                        </span>
                      </td>

                      <td>

                        <span
                          className={`nh-case-status nh-case-status-${(
                            caseItem.status || "Active"
                          ).toLowerCase()}`}
                        >
                          <span className="nh-status-dot-small"></span>
                          {caseItem.status || "Active"}
                        </span>

                      </td>

                      <td className="nh-case-action-cell">

                        <button
                          className="nh-view-button"
                          onClick={() => {
                            console.log("Opening case:", caseItem);
                            navigate(`/cases/${caseItem.firestoreId}`);
                          }}
                        >
                          View →
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>
            )}


            {/* =================================================
                EMPTY STATE
                ================================================= */}

            {!loading && filteredCases.length === 0 && (

              <div className="nh-case-empty">

                <div className="nh-case-empty-title">
                  No cases found
                </div>

                <div className="nh-case-empty-text">
                  Try changing your search or status filter.
                </div>

              </div>

            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          NEW CASE MODAL
          ===================================================== */}

      {showNewCase && (

        <div
          className="nh-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowNewCase(false);
            }
          }}
        >

          <div className="nh-modal nh-new-case-modal">

            <div className="nh-modal-header">

              <div>
                <div className="nh-command-label">
                  CASE REGISTRATION
                </div>

                <h2>
                  Create New Case
                </h2>

                <p>
                  Register a new investigation case in NHIS.
                </p>
              </div>

              <button
                className="nh-modal-close"
                onClick={() => setShowNewCase(false)}
              >
                ×
              </button>

            </div>


            <form onSubmit={handleCreateCase}>

              {/* =================================================
                  BASIC INFORMATION
                  ================================================= */}

              <div className="nh-form-section">

                <div className="nh-form-section-title">
                  Case Information
                </div>

                <div className="nh-form-grid">

                  <div className="nh-form-field nh-form-field-wide">

                    <label>
                      Case Name *
                    </label>

                    <input
                      type="text"
                      value={newCase.name}
                      onChange={(event) =>
                        updateNewCase(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Example: Private Residence"
                      required
                    />

                  </div>


                  <div className="nh-form-field">

                    <label>
                      Status
                    </label>

                    <select
                      value={newCase.status}
                      onChange={(event) =>
                        updateNewCase(
                          "status",
                          event.target.value
                        )
                      }
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Review">
                        Review
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                      <option value="Unscheduled">
                        Unscheduled
                      </option>
                    </select>

                  </div>


                  <div className="nh-form-field">

                    <label>
                      Priority
                    </label>

                    <select
                      value={newCase.priority}
                      onChange={(event) =>
                        updateNewCase(
                          "priority",
                          event.target.value
                        )
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>

                  </div>

                </div>

              </div>


              {/* =================================================
                  LOCATION
                  ================================================= */}

              <div className="nh-form-section">

                <div className="nh-form-section-title">
                  Location
                </div>

                <div className="nh-form-grid">

                  <div className="nh-form-field">

                    <label>
                      Location Type *
                    </label>

                    <select
                      value={newCase.locationType}
                      onChange={(event) =>
                        updateNewCase(
                          "locationType",
                          event.target.value
                        )
                      }
                    >
                      <option value="Residential">
                        Residential
                      </option>

                      <option value="Commercial">
                        Commercial
                      </option>

                      <option value="Cemetery">
                        Cemetery
                      </option>

                      <option value="Lake / Water">
                        Lake / Water
                      </option>

                      <option value="Park">
                        Park
                      </option>

                      <option value="Historic Property">
                        Historic Property
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>

                  </div>


                  <div className="nh-form-field">

                    <label>
                      Location Name *
                    </label>

                    <input
                      type="text"
                      value={newCase.locationName}
                      onChange={(event) =>
                        updateNewCase(
                          "locationName",
                          event.target.value
                        )
                      }
                      placeholder="Property or location name"
                      required
                    />

                  </div>


                  <div className="nh-form-field nh-form-field-wide">

                    <label>
                      Street Address
                    </label>

                    <input
                      type="text"
                      value={newCase.address}
                      onChange={(event) =>
                        updateNewCase(
                          "address",
                          event.target.value
                        )
                      }
                      placeholder="Street address"
                    />

                  </div>


                  <div className="nh-form-field">

                    <label>
                      City
                    </label>

                    <input
                      type="text"
                      value={newCase.city}
                      onChange={(event) =>
                        updateNewCase(
                          "city",
                          event.target.value
                        )
                      }
                      placeholder="Tulsa"
                    />

                  </div>


                  <div className="nh-form-field">

                    <label>
                      State
                    </label>

                    <input
                      type="text"
                      value={newCase.state}
                      onChange={(event) =>
                        updateNewCase(
                          "state",
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>

              </div>


              {/* =================================================
                  CLIENT
                  ================================================= */}

              <div className="nh-form-section">

                <div className="nh-form-section-title">
                  Client & Investigation
                </div>

                <div className="nh-form-grid">

                  <div className="nh-form-field">

                    <label>
                      Client Name
                    </label>

                    <input
                      type="text"
                      value={newCase.clientName}
                      onChange={(event) =>
                        updateNewCase(
                          "clientName",
                          event.target.value
                        )
                      }
                      placeholder="Client or property owner"
                    />

                  </div>


                  <div className="nh-form-field">

                    <label>
                      Lead Investigator
                    </label>

                    <input
                      type="text"
                      value={newCase.leadInvestigator}
                      onChange={(event) =>
                        updateNewCase(
                          "leadInvestigator",
                          event.target.value
                        )
                      }
                      placeholder="Investigator name or ID"
                    />

                  </div>

                  <div className="nh-form-field nh-form-field-wide">

                    <label>
                      Case Description
                    </label>

                    <textarea
                      value={newCase.description}
                      onChange={(event) =>
                        updateNewCase(
                          "description",
                          event.target.value
                        )
                      }
                      placeholder="Brief description of the reported activity or reason for investigation..."
                      rows="4"
                    />

                  </div>

                </div>

              </div>


              {/* =================================================
                  ERROR
                  ================================================= */}

              {error && (

                <div className="nh-form-error">
                  {error}
                </div>

              )}


              {/* =================================================
                  ACTIONS
                  ================================================= */}

              <div className="nh-modal-actions">

                <button
                  type="button"
                  className="nh-secondary-button"
                  onClick={() => setShowNewCase(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="nh-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Creating Case..."
                    : "Create Case"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Cases;