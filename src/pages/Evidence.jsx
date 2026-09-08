import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

function Evidence() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [evidenceRecords, setEvidenceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD REAL EVIDENCE FROM FIRESTORE
     ===================================================== */

  useEffect(() => {
    loadEvidence();
  }, []);

  async function loadEvidence() {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(
        collection(db, "evidence")
      );

      const records = snapshot.docs.map((evidenceDoc) => {
        const data = evidenceDoc.data();

        return {
          firestoreId: evidenceDoc.id,

          id:
            data.evidenceId ||
            data.id ||
            evidenceDoc.id,

          title:
            data.title ||
            data.name ||
            "Untitled Evidence",

          type:
            data.type ||
            "Unknown",

          case:
            data.caseNumber ||
            data.caseId ||
            data.case ||
            "Unassigned",

          classification:
            data.classification ||
            "Unclassified",

          status:
            data.status ||
            "Under Review",

          date:
            data.date ||
            data.createdAt ||
            null,

          submittedBy:
            data.submittedBy ||
            data.submittedByName ||
            "Unknown",
        };
      });

      setEvidenceRecords(records);
    } catch (err) {
      console.error("Error loading evidence:", err);

      setError(
        "Unable to load evidence records. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     FORMAT DATE
     ===================================================== */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Unknown";
    }

    try {
      if (
        typeof dateValue === "object" &&
        typeof dateValue.toDate === "function"
      ) {
        return dateValue
          .toDate()
          .toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
      }

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return String(dateValue);
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown";
    }
  };

  /* =====================================================
     FILTER EVIDENCE
     ===================================================== */

  const filteredEvidence = evidenceRecords.filter(
    (evidence) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        evidence.title
          .toLowerCase()
          .includes(searchText) ||
        evidence.id
          .toLowerCase()
          .includes(searchText) ||
        evidence.case
          .toLowerCase()
          .includes(searchText);

      const matchesType =
        typeFilter === "All" ||
        evidence.type === typeFilter;

      const matchesStatus =
        statusFilter === "All" ||
        evidence.status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    }
  );

  /* =====================================================
     STATISTICS
     ===================================================== */

  const totalEvidence =
    evidenceRecords.length;

  const underReviewCount =
    evidenceRecords.filter(
      (evidence) =>
        evidence.status === "Under Review"
    ).length;

  const unexplainedCount =
    evidenceRecords.filter(
      (evidence) =>
        evidence.status === "Unexplained"
    ).length;

  const confirmedCount =
    evidenceRecords.filter(
      (evidence) =>
        evidence.status === "Confirmed"
    ).length;

  /* =====================================================
     EVIDENCE ICON
     ===================================================== */

  const getEvidenceIcon = (type) => {
    switch (type) {
      case "Photo":
        return "▧";

      case "Video":
        return "▶";

      case "Audio":
        return "♫";

      case "Document":
        return "▤";

      default:
        return "◈";
    }
  };

  /* =====================================================
     STATUS CLASS
     ===================================================== */

  const getStatusClass = (status) => {
    if (status === "Confirmed") {
      return "nh-status nh-status-active";
    }

    if (status === "Debunked") {
      return "nh-status nh-status-danger";
    }

    if (status === "Unexplained") {
      return "nh-status nh-status-warning";
    }

    return "nh-status nh-status-neutral";
  };

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <div className="nh-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="nh-page-header">

        <div>
          <h1 className="nh-page-title">
            Evidence
          </h1>

          <p className="nh-page-subtitle">
            Central repository for investigative
            evidence and supporting material.
          </p>
        </div>

        <button
          className="nh-button nh-button-primary"
          type="button"
        >
          + Upload Evidence
        </button>

      </div>


      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="nh-error">
          {error}
        </div>
      )}


      {/* =================================================
          STATISTICS
          ================================================= */}

      <section className="nh-evidence-overview">

        <div className="nh-evidence-stat nh-card">

          <div className="nh-evidence-stat-label">
            Total Evidence
          </div>

          <div className="nh-evidence-stat-value">
            {String(totalEvidence).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-evidence-stat nh-card">

          <div className="nh-evidence-stat-label">
            Under Review
          </div>

          <div className="nh-evidence-stat-value">
            {String(underReviewCount).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-evidence-stat nh-card">

          <div className="nh-evidence-stat-label">
            Unexplained
          </div>

          <div className="nh-evidence-stat-value">
            {String(unexplainedCount).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-evidence-stat nh-card">

          <div className="nh-evidence-stat-label">
            Confirmed
          </div>

          <div className="nh-evidence-stat-value">
            {String(confirmedCount).padStart(2, "0")}
          </div>

        </div>

      </section>


      {/* =================================================
          SEARCH / FILTERS
          ================================================= */}

      <section className="nh-evidence-controls nh-card">

        <div className="nh-search-wrapper">

          <input
            type="text"
            className="nh-search-input"
            placeholder="Search evidence, IDs, or case numbers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <select
          className="nh-filter-select"
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value)
          }
        >

          <option value="All">
            All Types
          </option>

          <option value="Photo">
            Photos
          </option>

          <option value="Video">
            Video
          </option>

          <option value="Audio">
            Audio
          </option>

          <option value="Document">
            Documents
          </option>

        </select>


        <select
          className="nh-filter-select"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >

          <option value="All">
            All Review Statuses
          </option>

          <option value="Under Review">
            Under Review
          </option>

          <option value="Unexplained">
            Unexplained
          </option>

          <option value="Confirmed">
            Confirmed
          </option>

          <option value="Debunked">
            Debunked
          </option>

          <option value="Reference">
            Reference
          </option>

        </select>

      </section>


      {/* =================================================
          EVIDENCE REPOSITORY
          ================================================= */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Evidence Repository
            </h2>

            <p className="nh-section-subtitle">
              Recorded media and supporting
              documentation collected during
              investigations.
            </p>

          </div>


          <span className="nh-member-count">
            {filteredEvidence.length} records
          </span>

        </div>


        <div className="nh-card nh-evidence-table">

          {/* =================================================
              TABLE HEADER
              ================================================= */}

          <div className="nh-evidence-row nh-evidence-header">

            <div>
              Evidence
            </div>

            <div>
              Type
            </div>

            <div>
              Case
            </div>

            <div>
              Classification
            </div>

            <div>
              Date
            </div>

            <div>
              Review Status
            </div>

          </div>


          {/* =================================================
              LOADING
              ================================================= */}

          {loading && (
            <div className="nh-evidence-empty">
              Loading evidence records...
            </div>
          )}


          {/* =================================================
              REAL EVIDENCE RECORDS
              ================================================= */}

          {!loading &&
            filteredEvidence.map((evidence) => (

              <div
                className="nh-evidence-row"
                key={evidence.firestoreId}
              >

                <div className="nh-evidence-identity">

                  <div className="nh-evidence-icon">
                    {getEvidenceIcon(
                      evidence.type
                    )}
                  </div>

                  <div>

                    <div className="nh-list-title">
                      {evidence.title}
                    </div>

                    <div className="nh-list-meta">
                      {evidence.id} · Submitted by{" "}
                      {evidence.submittedBy}
                    </div>

                  </div>

                </div>


                <div className="nh-evidence-type">
                  {evidence.type}
                </div>


                <div>

                  <span className="nh-evidence-case">
                    {evidence.case}
                  </span>

                </div>


                <div>

                  <span className="nh-evidence-classification">
                    {evidence.classification}
                  </span>

                </div>


                <div className="nh-evidence-date">
                  {formatDate(evidence.date)}
                </div>


                <div>

                  <span
                    className={getStatusClass(
                      evidence.status
                    )}
                  >
                    {evidence.status}
                  </span>

                </div>

              </div>

            ))}


          {/* =================================================
              EMPTY STATE
              ================================================= */}

          {!loading &&
            filteredEvidence.length === 0 && (

              <div className="nh-evidence-empty">

                {evidenceRecords.length === 0 ? (
                  <>
                    <strong>
                      No evidence records yet.
                    </strong>

                    <span>
                      Evidence uploaded through the
                      New Horizon investigation system
                      will appear here.
                    </span>
                  </>
                ) : (
                  <>
                    No evidence matches the current
                    search or filters.
                  </>
                )}

              </div>

            )}

        </div>

      </section>

    </div>
  );
}

export default Evidence;