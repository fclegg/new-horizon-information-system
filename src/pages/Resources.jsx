import { useState } from "react";

function Resources() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const resources = [
    {
      id: "RES-001",
      title: "Investigator's Handbook",
      type: "Document",
      category: "Operations",
      author: "New Horizon",
      date: "2026",
      reference: "Internal",
    },
    {
      id: "RES-002",
      title: "Comparative Demonology Research",
      type: "Research Material",
      category: "Demonology",
      author: "Research Department",
      date: "2026",
      reference: "Internal",
    },
    {
      id: "RES-003",
      title: "Historical Records — Tulsa County",
      type: "Document",
      category: "History",
      author: "County Archives",
      date: "2025",
      reference: "External",
    },
    {
      id: "RES-004",
      title: "Paranormal Investigation Methodology",
      type: "External Reference",
      category: "Investigation",
      author: "Research Archive",
      date: "2024",
      reference: "External",
    },
    {
      id: "RES-005",
      title: "Spirit Classification Reference",
      type: "Research Material",
      category: "Spirit Research",
      author: "New Horizon",
      date: "2026",
      reference: "Internal",
    },
  ];

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(search.toLowerCase()) ||
      resource.id.toLowerCase().includes(search.toLowerCase()) ||
      resource.author.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      resource.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getResourceIcon = (type) => {
    switch (type) {
      case "Document":
        return "▤";
      case "Research Material":
        return "⌕";
      case "External Reference":
        return "↗";
      default:
        return "◈";
    }
  };

  return (
    <div className="nh-page">

      {/* Header */}
      <div className="nh-page-header">
        <div>
          <h1 className="nh-page-title">Resources</h1>
          <p className="nh-page-subtitle">
            Research materials, documents, references, and investigative resources.
          </p>
        </div>

        <button className="nh-button nh-button-primary">
          + Add Resource
        </button>
      </div>

      {/* Statistics */}
      <section className="nh-resource-overview">

        <div className="nh-resource-stat nh-card">
          <div className="nh-resource-stat-label">
            Total Resources
          </div>
          <div className="nh-resource-stat-value">
            05
          </div>
        </div>

        <div className="nh-resource-stat nh-card">
          <div className="nh-resource-stat-label">
            Documents
          </div>
          <div className="nh-resource-stat-value">
            02
          </div>
        </div>

        <div className="nh-resource-stat nh-card">
          <div className="nh-resource-stat-label">
            Research Material
          </div>
          <div className="nh-resource-stat-value">
            02
          </div>
        </div>

        <div className="nh-resource-stat nh-card">
          <div className="nh-resource-stat-label">
            External References
          </div>
          <div className="nh-resource-stat-value">
            01
          </div>
        </div>

      </section>

      {/* Search / Filters */}
      <section className="nh-resource-controls nh-card">

        <div className="nh-search-wrapper">
          <input
            type="text"
            className="nh-search-input"
            placeholder="Search resources, IDs, or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="nh-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Operations">Operations</option>
          <option value="Demonology">Demonology</option>
          <option value="History">History</option>
          <option value="Investigation">Investigation</option>
          <option value="Spirit Research">Spirit Research</option>
        </select>

      </section>

      {/* Resource Library */}
      <section className="nh-section">

        <div className="nh-section-header">
          <div>
            <h2 className="nh-section-title">
              Resource Library
            </h2>

            <p className="nh-section-subtitle">
              Reference material available to New Horizon personnel.
            </p>
          </div>

          <span className="nh-member-count">
            {filteredResources.length} resources
          </span>
        </div>

        <div className="nh-card nh-resource-table">

          {/* Table Header */}
          <div className="nh-resource-row nh-resource-header">
            <div>Resource</div>
            <div>Type</div>
            <div>Category</div>
            <div>Author</div>
            <div>Date</div>
            <div>Source</div>
          </div>

          {/* Resources */}
          {filteredResources.map((resource) => (
            <div
              className="nh-resource-row"
              key={resource.id}
            >

              <div className="nh-resource-identity">

                <div className="nh-resource-icon">
                  {getResourceIcon(resource.type)}
                </div>

                <div>
                  <div className="nh-list-title">
                    {resource.title}
                  </div>

                  <div className="nh-list-meta">
                    {resource.id}
                  </div>
                </div>

              </div>

              <div className="nh-resource-type">
                {resource.type}
              </div>

              <div>
                <span className="nh-resource-category">
                  {resource.category}
                </span>
              </div>

              <div className="nh-resource-author">
                {resource.author}
              </div>

              <div className="nh-resource-date">
                {resource.date}
              </div>

              <div>
                <span
                  className={
                    resource.reference === "Internal"
                      ? "nh-resource-source nh-resource-source-internal"
                      : "nh-resource-source"
                  }
                >
                  {resource.reference}
                </span>
              </div>

            </div>
          ))}

          {filteredResources.length === 0 && (
            <div className="nh-resource-empty">
              No resources match the current search or category.
            </div>
          )}

        </div>

      </section>

    </div>
  );
}

export default Resources;