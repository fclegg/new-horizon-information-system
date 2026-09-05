import { useMemo, useState } from "react";

const objectRecords = [
  {
    id: "OBJ-0001",
    name: "Antique Wooden Box",
    type: "Unknown Object",
    status: "Under Investigation",
    location: "NH Storage — Cabinet 02",
    custody: "MEM-002",
    investigations: 2,
    lastInvestigated: "2026-08-12",
  },
  {
    id: "OBJ-0002",
    name: "Porcelain Figure",
    type: "Artifact",
    status: "Potentially Anomalous",
    location: "Private Residence",
    custody: "Property Owner",
    investigations: 1,
    lastInvestigated: "2026-07-29",
  },
  {
    id: "OBJ-0003",
    name: "Black Stone Pendant",
    type: "Jewelry",
    status: "Confirmed Anomalous",
    location: "NH Secure Storage",
    custody: "MEM-001",
    investigations: 4,
    lastInvestigated: "2026-08-21",
  },
  {
    id: "OBJ-0004",
    name: "Handwritten Journal",
    type: "Document",
    status: "In Custody",
    location: "NH Archives",
    custody: "MEM-003",
    investigations: 1,
    lastInvestigated: "2026-06-17",
  },
  {
    id: "OBJ-0005",
    name: "Antique Mirror",
    type: "Furniture",
    status: "Released",
    location: "Private Residence",
    custody: "Property Owner",
    investigations: 3,
    lastInvestigated: "2026-05-04",
  },
  {
    id: "OBJ-0006",
    name: "Unknown Metal Device",
    type: "Unknown Object",
    status: "Potentially Anomalous",
    location: "NH Storage — Shelf 04",
    custody: "MEM-005",
    investigations: 2,
    lastInvestigated: "2026-08-03",
  },
];

function statusClass(status) {
  return `nh-object-status nh-object-status-${status
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

function Objects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const objectTypes = useMemo(
    () => ["All", ...new Set(objectRecords.map((item) => item.type))],
    []
  );

  const filteredObjects = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return objectRecords.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search) ||
        item.type.toLowerCase().includes(search) ||
        item.location.toLowerCase().includes(search) ||
        item.custody.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesType =
        typeFilter === "All" || item.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchTerm, statusFilter, typeFilter]);

  const totalObjects = objectRecords.length;

  const investigationObjects = objectRecords.filter(
    (item) =>
      item.status === "Under Investigation" ||
      item.status === "Potentially Anomalous"
  ).length;

  const custodyObjects = objectRecords.filter(
    (item) =>
      item.status === "In Custody" ||
      item.status === "Confirmed Anomalous"
  ).length;

  const confirmedObjects = objectRecords.filter(
    (item) => item.status === "Confirmed Anomalous"
  ).length;

  return (
    <div className="nh-page">
      <div className="nh-page-header nh-object-header">
        <div>
          <div className="nh-eyebrow">OBJECT REGISTRY</div>
          <h1>Objects</h1>
          <p>
            Records for potentially anomalous and historically investigated
            objects.
          </p>
        </div>

        <button className="nh-primary-button" type="button">
          + Register Object
        </button>
      </div>

      <div className="nh-object-stats">
        <div className="nh-object-stat">
          <span className="nh-object-stat-label">TOTAL OBJECTS</span>
          <strong>{totalObjects}</strong>
          <span className="nh-object-stat-detail">
            Registered object records
          </span>
        </div>

        <div className="nh-object-stat">
          <span className="nh-object-stat-label">UNDER REVIEW</span>
          <strong>{investigationObjects}</strong>
          <span className="nh-object-stat-detail">
            Potentially anomalous
          </span>
        </div>

        <div className="nh-object-stat">
          <span className="nh-object-stat-label">IN CUSTODY</span>
          <strong>{custodyObjects}</strong>
          <span className="nh-object-stat-detail">
            Currently controlled
          </span>
        </div>

        <div className="nh-object-stat">
          <span className="nh-object-stat-label">CONFIRMED</span>
          <strong>{confirmedObjects}</strong>
          <span className="nh-object-stat-detail">
            Confirmed anomalous records
          </span>
        </div>
      </div>

      <section className="nh-section nh-object-section">
        <div className="nh-section-header">
          <div>
            <h2>Object Inventory</h2>
            <p>
              Every registered object receives a unique NHIS object identifier.
            </p>
          </div>
        </div>

        <div className="nh-object-controls">
          <div className="nh-search-box nh-object-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search objects, tags, locations, or custody..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="nh-filter-select"
          >
            <option value="All">All Statuses</option>
            <option value="Potentially Anomalous">
              Potentially Anomalous
            </option>
            <option value="Under Investigation">
              Under Investigation
            </option>
            <option value="Confirmed Anomalous">
              Confirmed Anomalous
            </option>
            <option value="In Custody">In Custody</option>
            <option value="Released">Released</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="nh-filter-select"
          >
            {objectTypes.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All Object Types" : type}
              </option>
            ))}
          </select>
        </div>

        <div className="nh-object-table-wrap">
          <div className="nh-object-table">
            <div className="nh-object-row nh-object-row-header">
              <div>Object</div>
              <div>Tag</div>
              <div>Status</div>
              <div>Location</div>
              <div>Custody</div>
              <div>Investigations</div>
              <div></div>
            </div>

            {filteredObjects.map((item) => (
              <div className="nh-object-row" key={item.id}>
                <div className="nh-object-identity">
                  <div className="nh-object-icon">◇</div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.type}</span>
                  </div>
                </div>

                <div className="nh-object-tag">{item.id}</div>

                <div>
                  <span className={statusClass(item.status)}>
                    {item.status}
                  </span>
                </div>

                <div className="nh-object-location">
                  <strong>{item.location}</strong>
                </div>

                <div className="nh-object-custody">
                  {item.custody}
                </div>

                <div className="nh-object-investigations">
                  <strong>{item.investigations}</strong>
                  <span>case records</span>
                </div>

                <div>
                  <button
                    className="nh-object-view-button"
                    type="button"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}

            {filteredObjects.length === 0 && (
              <div className="nh-object-empty">
                <div className="nh-object-empty-icon">◇</div>
                <strong>No objects found</strong>
                <span>
                  Try changing your search or filter settings.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="nh-section nh-object-overview">
        <div className="nh-object-overview-card">
          <div className="nh-object-overview-icon">⌂</div>

          <div>
            <span className="nh-eyebrow">LOCATION</span>
            <h3>Object Location History</h3>
            <p>
              Track the current location of an object and maintain a record of
              previous known locations.
            </p>
          </div>

          <button type="button" className="nh-secondary-button">
            View Locations
          </button>
        </div>

        <div className="nh-object-overview-card">
          <div className="nh-object-overview-icon">↔</div>

          <div>
            <span className="nh-eyebrow">CUSTODY</span>
            <h3>Chain of Custody</h3>
            <p>
              Record who possesses an object, when custody changed, and where
              the object was transferred.
            </p>
          </div>

          <button type="button" className="nh-secondary-button">
            View Custody
          </button>
        </div>

        <div className="nh-object-overview-card">
          <div className="nh-object-overview-icon">⌁</div>

          <div>
            <span className="nh-eyebrow">HISTORY</span>
            <h3>Investigation History</h3>
            <p>
              Cross-reference every investigation, evidence record, and report
              associated with an object.
            </p>
          </div>

          <button type="button" className="nh-secondary-button">
            View History
          </button>
        </div>
      </section>
    </div>
  );
}

export default Objects;