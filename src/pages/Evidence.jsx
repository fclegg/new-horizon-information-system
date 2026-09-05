import { useState } from "react";

function Evidence() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const evidenceRecords = [
    {
      id: "EV-2026-001",
      title: "EVP Recording — Basement",
      type: "Audio",
      case: "NH-2026-014",
      classification: "EVP",
      status: "Unexplained",
      date: "Sep 1, 2026",
      submittedBy: "MEM-003",
    },
    {
      id: "EV-2026-002",
      title: "Bedroom Apparition",
      type: "Video",
      case: "NH-2026-012",
      classification: "Apparition",
      status: "Under Review",
      date: "Aug 29, 2026",
      submittedBy: "MEM-002",
    },
    {
      id: "EV-2026-003",
      title: "Object Movement — Kitchen",
      type: "Video",
      case: "NH-2026-014",
      classification: "Object Movement",
      status: "Debunked",
      date: "Aug 27, 2026",
      submittedBy: "MEM-004",
    },
    {
      id: "EV-2026-004",
      title: "Historical Photograph",
      type: "Photo",
      case: "NH-2026-009",
      classification: "Photographic",
      status: "Confirmed",
      date: "Aug 22, 2026",
      submittedBy: "MEM-001",
    },
    {
      id: "EV-2026-005",
      title: "Investigation Report",
      type: "Document",
      case: "NH-2026-009",
      classification: "Research",
      status: "Reference",
      date: "Aug 20, 2026",
      submittedBy: "MEM-001",
    },
  ];

  const filteredEvidence = evidenceRecords.filter((evidence) => {
    const matchesSearch =
      evidence.title.toLowerCase().includes(search.toLowerCase()) ||
      evidence.id.toLowerCase().includes(search.toLowerCase()) ||
      evidence.case.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      typeFilter === "All" || evidence.type === typeFilter;

    const matchesStatus =
      statusFilter === "All" || evidence.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

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

  return (
    <div className="nh-page">

      {/* Header */}
      <div className="nh-page-header">
        <div>
          <h1 className="nh-page-title">Evidence</h1>
          <p className="nh-page-subtitle">
            Central repository for investigative evidence and supporting material.
          </p>
        </div>

        <button className="nh-button nh-button-primary">
          + Upload Evidence
        </button>
      </div>

      {/* Statistics */}
      <section className="nh-evidence-overview">

        <div className="nh-evidence-stat nh-card">
          <div className="nh-evidence-stat-label">
            Total Evidence
          </div>
          <div className="nh-evidence-stat-value">
            05
          </div>
        </div>

        <div className="nh-evidence-stat nh-card">
          <div className="nh-evidence-stat-label">
            Under Review
          </div>
          <div className="nh-evidence-stat-value">
            01
          </div>
        </div>

        <div className="nh-evidence-stat nh-card">
          <div className="nh-evidence-stat-label">
            Unexplained
          </div>
          <div className="nh-evidence-stat-value">
            01
          </div>
        </div>

        <div className="nh-evidence-stat nh-card">
          <div className="nh-evidence-stat-label">
            Confirmed
          </div>
          <div className="nh-evidence-stat-value">
            01
          </div>
        </div>

      </section>

      {/* Search / Filters */}
      <section className="nh-evidence-controls nh-card">

        <div className="nh-search-wrapper">
          <input
            type="text"
            className="nh-search-input"
            placeholder="Search evidence, IDs, or case numbers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="nh-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Photo">Photos</option>
          <option value="Video">Video</option>
          <option value="Audio">Audio</option>
          <option value="Document">Documents</option>
        </select>

        <select
          className="nh-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Review Statuses</option>
          <option value="Under Review">Under Review</option>
          <option value="Unexplained">Unexplained</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Debunked">Debunked</option>
          <option value="Reference">Reference</option>
        </select>

      </section>

      {/* Evidence Repository */}
      <section className="nh-section">

        <div className="nh-section-header">
          <div>
            <h2 className="nh-section-title">
              Evidence Repository
            </h2>

            <p className="nh-section-subtitle">
              Recorded media and supporting documentation collected during investigations.
            </p>
          </div>

          <span className="nh-member-count">
            {filteredEvidence.length} records
          </span>
        </div>

        <div className="nh-card nh-evidence-table">

          {/* Table Header */}
          <div className="nh-evidence-row nh-evidence-header">
            <div>Evidence</div>
            <div>Type</div>
            <div>Case</div>
            <div>Classification</div>
            <div>Date</div>
            <div>Review Status</div>
          </div>

          {/* Evidence Records */}
          {filteredEvidence.map((evidence) => (
            <div
              className="nh-evidence-row"
              key={evidence.id}
            >

              <div className="nh-evidence-identity">

                <div className="nh-evidence-icon">
                  {getEvidenceIcon(evidence.type)}
                </div>

                <div>
                  <div className="nh-list-title">
                    {evidence.title}
                  </div>

                  <div className="nh-list-meta">
                    {evidence.id} · Submitted by {evidence.submittedBy}
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
                {evidence.date}
              </div>

              <div>
                <span className={getStatusClass(evidence.status)}>
                  {evidence.status}
                </span>
              </div>

            </div>
          ))}

          {filteredEvidence.length === 0 && (
            <div className="nh-evidence-empty">
              No evidence matches the current search or filters.
            </div>
          )}

        </div>

      </section>

    </div>
  );
}

export default Evidence;