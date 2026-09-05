import React, { useState } from "react";

const procedureDocuments = [
  {
    id: "OPS-001",
    title: "Pre-Investigation Preparations",
    category: "Investigation Procedures",
    description:
      "Preparation requirements before arriving at and conducting an investigation.",
    status: "Official",
  },
  {
    id: "OPS-002",
    title: "Investigation Plan Outline (IPO)",
    category: "Investigation Procedures",
    description:
      "Seven-part framework used to organize and conduct an investigation.",
    status: "Official",
  },
  {
    id: "OPS-003",
    title: "Code of Conduct",
    category: "Investigation Procedures",
    description:
      "Professional, ethical, safety, communication, and evidence-handling standards.",
    status: "Official",
  },
  {
    id: "OPS-004",
    title: "Rules & Regulations",
    category: "Investigation Procedures",
    description:
      "General policies, investigation rules, restricted practices, and object handling.",
    status: "Official",
  },
  {
    id: "OPS-005",
    title: "Legal Considerations",
    category: "Investigation Procedures",
    description:
      "Property permissions, waivers, liability, privacy, and legal compliance.",
    status: "Official",
  },
];

const protocols = [
  {
    id: "PRO-001",
    title: "Emergency Evacuation & Contingency Plan",
    category: "Emergency",
    severity: "Critical",
    description:
      "Procedure for safely exiting an investigation during an extreme event.",
  },
  {
    id: "PRO-002",
    title: "Attachment Response",
    category: "Protocol",
    severity: "High",
    description:
      "Response procedure for suspected spiritual attachment involving a team member or client.",
  },
  {
    id: "PRO-003",
    title: "Demon Protocol",
    category: "Protocol",
    severity: "Critical",
    description:
      "Procedure activated when a demonic entity is encountered during an investigation.",
  },
  {
    id: "PRO-004",
    title: "Possession Protocol",
    category: "Protocol",
    severity: "Critical",
    description:
      "Procedure for situations involving suspected possession and escalation.",
  },
  {
    id: "PRO-005",
    title: "Cursed / Haunted Objects",
    category: "Protocol",
    severity: "High",
    description:
      "Handling, documentation, containment, and disposal procedures for anomalous objects.",
  },
];

const emergencyProcedures = [
  {
    title: "Code Black",
    description: "Immediate evacuation due to life-threatening danger.",
  },
  {
    title: "Code Grey",
    description: "Silent evacuation due to entity disturbance or potential extreme danger.",
  },
  {
    title: "Closed Fist Raised",
    description: "Silent regroup at the designated meeting point.",
  },
  {
    title: "Fallout to Base",
    description: "Begin an orderly exit.",
  },
  {
    title: "Fallout Now",
    description: "Immediate retreat.",
  },
];

const operationalDocuments = [
  {
    id: "DOC-001",
    title: "Investigator's Handbook",
    type: "Handbook",
    description:
      "Primary operational reference for New Horizon investigators.",
  },
  {
    id: "DOC-002",
    title: "Field Forms",
    type: "Forms",
    description:
      "Collection of forms used to document investigations and field activity.",
  },
  {
    id: "DOC-003",
    title: "Equipment Checklist",
    type: "Field Document",
    description:
      "Reference for preparing, tracking, and packing investigation equipment.",
  },
  {
    id: "DOC-004",
    title: "Basecamp Notes Guidelines",
    type: "Field Document",
    description:
      "Guidelines for documenting activity observed from the investigation base.",
  },
  {
    id: "DOC-005",
    title: "Evidence Analysis & Debunking",
    type: "Evidence",
    description:
      "Reference for reviewing evidence and investigating natural explanations.",
  },
  {
    id: "DOC-006",
    title: "Magic & Sigil Guides",
    type: "Reference",
    description:
      "Reference material covering permitted practices, symbols, and spiritual defense.",
  },
];

function categoryClass(category) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function severityClass(severity) {
  return severity.toLowerCase();
}

export default function Operations() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");

  const normalizedSearch = search.toLowerCase();

  const filteredProcedures = procedureDocuments.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch)
  );

  const filteredProtocols = protocols.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch)
  );

  const filteredDocuments = operationalDocuments.filter(
    (item) =>
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch)
  );

  return (
    <div className="nh-page">
      <div className="nh-page-header">
        <div>
          <div className="nh-eyebrow">NEW HORIZON OPERATIONS</div>
          <h1>Operations</h1>
          <p>
            Investigation procedures, emergency protocols, and operational
            reference documents.
          </p>
        </div>
      </div>

      <div className="nh-operations-search">
        <span>⌕</span>
        <input
          type="text"
          placeholder="Search operations, protocols, or documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="nh-operations-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>

        <button
          className={activeTab === "procedures" ? "active" : ""}
          onClick={() => setActiveTab("procedures")}
        >
          Investigation Procedures
        </button>

        <button
          className={activeTab === "protocols" ? "active" : ""}
          onClick={() => setActiveTab("protocols")}
        >
          Protocols
        </button>

        <button
          className={activeTab === "emergency" ? "active" : ""}
          onClick={() => setActiveTab("emergency")}
        >
          Emergency Procedures
        </button>

        <button
          className={activeTab === "documents" ? "active" : ""}
          onClick={() => setActiveTab("documents")}
        >
          Operational Documents
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="nh-operations-hero">
            <div>
              <div className="nh-operations-hero-label">
                OPERATIONAL REFERENCE
              </div>

              <h2>Investigation Operations Center</h2>

              <p>
                Centralized access to New Horizon's investigation procedures,
                emergency response protocols, and operational documentation.
              </p>
            </div>

            <div className="nh-operations-hero-mark">NH</div>
          </div>

          <div className="nh-stat-grid nh-operations-stats">
            <div className="nh-stat-card">
              <div className="nh-stat-label">PROCEDURES</div>
              <div className="nh-stat-value">{procedureDocuments.length}</div>
              <div className="nh-stat-meta">Official procedures</div>
            </div>

            <div className="nh-stat-card">
              <div className="nh-stat-label">PROTOCOLS</div>
              <div className="nh-stat-value">{protocols.length}</div>
              <div className="nh-stat-meta">Response protocols</div>
            </div>

            <div className="nh-stat-card">
              <div className="nh-stat-label">EMERGENCY SIGNALS</div>
              <div className="nh-stat-value">{emergencyProcedures.length}</div>
              <div className="nh-stat-meta">Field commands</div>
            </div>

            <div className="nh-stat-card">
              <div className="nh-stat-label">DOCUMENTS</div>
              <div className="nh-stat-value">
                {operationalDocuments.length}
              </div>
              <div className="nh-stat-meta">Operational references</div>
            </div>
          </div>

          <div className="nh-operations-section">
            <div className="nh-section-heading">
              <div>
                <h2>Quick Access</h2>
                <p>Frequently needed operational references.</p>
              </div>
            </div>

            <div className="nh-operations-card-grid">
              <button
                className="nh-operations-card"
                onClick={() => setActiveTab("procedures")}
              >
                <div className="nh-operations-card-icon">01</div>
                <div>
                  <h3>Investigation Procedures</h3>
                  <p>
                    Preparation, IPO, conduct, regulations, and legal
                    considerations.
                  </p>
                </div>
                <span>→</span>
              </button>

              <button
                className="nh-operations-card"
                onClick={() => setActiveTab("protocols")}
              >
                <div className="nh-operations-card-icon">02</div>
                <div>
                  <h3>Protocols</h3>
                  <p>
                    Response procedures for high-risk and unusual situations.
                  </p>
                </div>
                <span>→</span>
              </button>

              <button
                className="nh-operations-card nh-operations-card-danger"
                onClick={() => setActiveTab("emergency")}
              >
                <div className="nh-operations-card-icon">!</div>
                <div>
                  <h3>Emergency Procedures</h3>
                  <p>
                    Evacuation signals, retreat commands, regrouping, and
                    post-event procedures.
                  </p>
                </div>
                <span>→</span>
              </button>

              <button
                className="nh-operations-card"
                onClick={() => setActiveTab("documents")}
              >
                <div className="nh-operations-card-icon">04</div>
                <div>
                  <h3>Operational Documents</h3>
                  <p>
                    Handbook, field references, forms, and evidence resources.
                  </p>
                </div>
                <span>→</span>
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "procedures" && (
        <div className="nh-operations-section">
          <div className="nh-section-heading">
            <div>
              <div className="nh-eyebrow">OPERATIONS / PROCEDURES</div>
              <h2>Investigation Procedures</h2>
              <p>
                Official procedures governing preparation and investigation
                operations.
              </p>
            </div>
          </div>

          <div className="nh-operations-list">
            {filteredProcedures.map((item) => (
              <div className="nh-operation-row" key={item.id}>
                <div className="nh-operation-number">{item.id}</div>

                <div className="nh-operation-main">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <div
                  className={`nh-operation-category nh-category-${categoryClass(
                    item.category
                  )}`}
                >
                  {item.category}
                </div>

                <div className="nh-operation-status">{item.status}</div>

                <button className="nh-operation-open">Open →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "protocols" && (
        <div className="nh-operations-section">
          <div className="nh-section-heading">
            <div>
              <div className="nh-eyebrow">OPERATIONS / RESPONSE</div>
              <h2>Protocols</h2>
              <p>
                Procedures established for unusual, dangerous, or high-risk
                situations.
              </p>
            </div>
          </div>

          <div className="nh-protocol-grid">
            {filteredProtocols.map((item) => (
              <div className="nh-protocol-card" key={item.id}>
                <div className="nh-protocol-top">
                  <span>{item.id}</span>

                  <span
                    className={`nh-protocol-severity ${severityClass(
                      item.severity
                    )}`}
                  >
                    {item.severity}
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <div className="nh-protocol-footer">
                  <span>{item.category}</span>
                  <button>Open Protocol →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "emergency" && (
        <div className="nh-operations-section">
          <div className="nh-emergency-banner">
            <div className="nh-emergency-symbol">!</div>

            <div>
              <div className="nh-eyebrow">CRITICAL SAFETY INFORMATION</div>
              <h2>Emergency Evacuation & Contingency Plan</h2>
              <p>
                The handbook requires a safety briefing before entering a
                location, including emergency exits, regroup locations,
                evacuation signals, and assigned responsibilities.
              </p>
            </div>
          </div>

          <div className="nh-emergency-grid">
            {emergencyProcedures.map((item, index) => (
              <div className="nh-emergency-card" key={item.title}>
                <div className="nh-emergency-card-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="nh-emergency-notice">
            <strong>Post-Evacuation</strong>
            <p>
              Once safe, leadership reviews the cause of evacuation, checks
              for injuries or lingering effects, determines whether the
              investigation continues, and documents the event with an
              Incident Report.
            </p>
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="nh-operations-section">
          <div className="nh-section-heading">
            <div>
              <div className="nh-eyebrow">OPERATIONS / REFERENCES</div>
              <h2>Operational Documents</h2>
              <p>
                Central access point for documents supporting field and
                administrative operations.
              </p>
            </div>
          </div>

          <div className="nh-document-grid">
            {filteredDocuments.map((item) => (
              <div className="nh-document-card" key={item.id}>
                <div className="nh-document-icon">DOC</div>

                <div className="nh-document-content">
                  <div className="nh-document-type">{item.type}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <button>Open →</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}