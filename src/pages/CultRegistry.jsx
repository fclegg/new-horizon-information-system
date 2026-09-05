import { useState } from "react";

function CultRegistry() {
  const [search, setSearch] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("All");

  const organizations = [
    {
      id: "CULT-001",
      name: "Dakhma of Angra Mainyu",
      classification: "Unknown",
      locations: ["Oklahoma", "Unknown"],
      incidents: 2,
      entities: 1,
      evidence: 4,
      status: "Active",
    },
    {
      id: "CULT-002",
      name: "Example Organization",
      classification: "Occult",
      locations: ["Tulsa, OK"],
      incidents: 1,
      entities: 2,
      evidence: 3,
      status: "Under Review",
    },
    {
      id: "CULT-003",
      name: "Unknown Group",
      classification: "Unknown",
      locations: ["Unknown"],
      incidents: 0,
      entities: 0,
      evidence: 1,
      status: "Unconfirmed",
    },
  ];

  const filteredOrganizations = organizations.filter((organization) => {
    const matchesSearch =
      organization.name.toLowerCase().includes(search.toLowerCase()) ||
      organization.id.toLowerCase().includes(search.toLowerCase());

    const matchesClassification =
      classificationFilter === "All" ||
      organization.classification === classificationFilter;

    return matchesSearch && matchesClassification;
  });

  return (
    <div className="nh-page">

      {/* Header */}
      <div className="nh-page-header">
        <div>
          <h1 className="nh-page-title">Cult Registry</h1>
          <p className="nh-page-subtitle">
            Organization records, incidents, associated entities, and research.
          </p>
        </div>

        <button className="nh-button nh-button-primary">
          + Register Organization
        </button>
      </div>

      {/* Statistics */}
      <section className="nh-cult-overview">

        <div className="nh-cult-stat nh-card">
          <div className="nh-cult-stat-label">
            Registered Organizations
          </div>
          <div className="nh-cult-stat-value">
            03
          </div>
        </div>

        <div className="nh-cult-stat nh-card">
          <div className="nh-cult-stat-label">
            Known Incidents
          </div>
          <div className="nh-cult-stat-value">
            03
          </div>
        </div>

        <div className="nh-cult-stat nh-card">
          <div className="nh-cult-stat-label">
            Associated Entities
          </div>
          <div className="nh-cult-stat-value">
            03
          </div>
        </div>

        <div className="nh-cult-stat nh-card">
          <div className="nh-cult-stat-label">
            Evidence / Research
          </div>
          <div className="nh-cult-stat-value">
            08
          </div>
        </div>

      </section>

      {/* Search / Filters */}
      <section className="nh-cult-controls nh-card">

        <div className="nh-search-wrapper">
          <input
            type="text"
            className="nh-search-input"
            placeholder="Search organizations or registry IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="nh-filter-select"
          value={classificationFilter}
          onChange={(e) => setClassificationFilter(e.target.value)}
        >
          <option value="All">All Classifications</option>
          <option value="Occult">Occult</option>
          <option value="Religious">Religious</option>
          <option value="Satanic">Satanic</option>
          <option value="Extremist">Extremist</option>
          <option value="Unknown">Unknown</option>
        </select>

      </section>

      {/* Registry */}
      <section className="nh-section">

        <div className="nh-section-header">
          <div>
            <h2 className="nh-section-title">
              Organization Records
            </h2>

            <p className="nh-section-subtitle">
              Registered organizations and associated investigative information.
            </p>
          </div>

          <span className="nh-member-count">
            {filteredOrganizations.length} records
          </span>
        </div>

        <div className="nh-card nh-cult-table">

          {/* Table Header */}
          <div className="nh-cult-row nh-cult-header">
            <div>Organization</div>
            <div>Classification</div>
            <div>Locations</div>
            <div>Incidents</div>
            <div>Entities</div>
            <div>Evidence</div>
            <div>Status</div>
          </div>

          {/* Records */}
          {filteredOrganizations.map((organization) => (
            <div
              className="nh-cult-row"
              key={organization.id}
            >

              <div className="nh-cult-identity">

                <div className="nh-cult-icon">
                  ◇
                </div>

                <div>
                  <div className="nh-list-title">
                    {organization.name}
                  </div>

                  <div className="nh-list-meta">
                    {organization.id}
                  </div>
                </div>

              </div>

              <div>
                <span className="nh-cult-classification">
                  {organization.classification}
                </span>
              </div>

              <div className="nh-cult-locations">

                {organization.locations.slice(0, 2).map(
                  (location, index) => (
                    <span key={index}>
                      {location}
                    </span>
                  )
                )}

                {organization.locations.length > 2 && (
                  <span className="nh-cult-more">
                    +{organization.locations.length - 2}
                  </span>
                )}

              </div>

              <div className="nh-cult-number">
                {organization.incidents}
              </div>

              <div className="nh-cult-number">
                {organization.entities}
              </div>

              <div className="nh-cult-number">
                {organization.evidence}
              </div>

              <div>
                <span className="nh-status nh-status-active">
                  {organization.status}
                </span>
              </div>

            </div>
          ))}

          {filteredOrganizations.length === 0 && (
            <div className="nh-cult-empty">
              No organizations match the current search or classification.
            </div>
          )}

        </div>

      </section>

    </div>
  );
}

export default CultRegistry;