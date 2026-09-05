import { useMemo, useState } from "react";

const trainingModules = [
  {
    id: "TRN-001",
    title: "Basic Safety & Investigation",
    category: "Core Training",
    status: "Required",
    completions: 8,
    material: "Handbook",
  },
  {
    id: "TRN-002",
    title: "Investigation Procedures",
    category: "Field Operations",
    status: "Required",
    completions: 7,
    material: "Handbook",
  },
  {
    id: "TRN-003",
    title: "Evidence Analysis & Debunking",
    category: "Evidence",
    status: "Required",
    completions: 6,
    material: "Handbook",
  },
  {
    id: "TRN-004",
    title: "Spirit Information",
    category: "Spirit Research",
    status: "Required",
    completions: 6,
    material: "Handbook",
  },
  {
    id: "TRN-005",
    title: "Code of Conduct",
    category: "Core Training",
    status: "Required",
    completions: 9,
    material: "Handbook",
  },
  {
    id: "TRN-006",
    title: "Equipment & Field Preparation",
    category: "Field Operations",
    status: "Required",
    completions: 8,
    material: "Handbook",
  },
  {
    id: "TRN-007",
    title: "Research Specialist Training",
    category: "Specialist",
    status: "Specialist",
    completions: 2,
    material: "Handbook",
  },
  {
    id: "TRN-008",
    title: "Analyst Training",
    category: "Specialist",
    status: "Specialist",
    completions: 2,
    material: "Handbook",
  },
];

const personnel = [
  {
    id: "MEM-001",
    name: "Director",
    position: "Director",
    completed: 8,
    total: 8,
    certifications: 4,
    status: "Complete",
  },
  {
    id: "MEM-002",
    name: "Team Lead",
    position: "Team Lead",
    completed: 8,
    total: 8,
    certifications: 3,
    status: "Complete",
  },
  {
    id: "MEM-003",
    name: "Investigator",
    position: "Investigator",
    completed: 7,
    total: 8,
    certifications: 2,
    status: "In Progress",
  },
  {
    id: "MEM-004",
    name: "Investigator",
    position: "Investigator",
    completed: 6,
    total: 8,
    certifications: 2,
    status: "In Progress",
  },
  {
    id: "MEM-005",
    name: "Specialist",
    position: "Researcher",
    completed: 8,
    total: 8,
    certifications: 3,
    status: "Complete",
  },
  {
    id: "MEM-006",
    name: "Investigator",
    position: "Investigator",
    completed: 4,
    total: 8,
    certifications: 1,
    status: "Incomplete",
  },
];

function completionClass(status) {
  return `nh-training-completion nh-training-completion-${status
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

function Training() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = useMemo(
    () => ["All", ...new Set(trainingModules.map((module) => module.category))],
    []
  );

  const filteredModules = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return trainingModules.filter((module) => {
      const matchesSearch =
        !search ||
        module.title.toLowerCase().includes(search) ||
        module.id.toLowerCase().includes(search) ||
        module.category.toLowerCase().includes(search);

      const matchesCategory =
        categoryFilter === "All" || module.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const totalModules = trainingModules.length;

  const requiredModules = trainingModules.filter(
    (module) => module.status === "Required"
  ).length;

  const completedPersonnel = personnel.filter(
    (member) => member.status === "Complete"
  ).length;

  const totalCertifications = personnel.reduce(
    (total, member) => total + member.certifications,
    0
  );

  return (
    <div className="nh-page">
      <div className="nh-page-header nh-training-header">
        <div>
          <div className="nh-eyebrow">PERSONNEL DEVELOPMENT</div>
          <h1>Training</h1>
          <p>
            Training modules, personnel completion, certifications, and
            handbook material.
          </p>
        </div>

        <button className="nh-primary-button" type="button">
          + Add Training Module
        </button>
      </div>

      <div className="nh-training-stats">
        <div className="nh-training-stat">
          <span className="nh-training-stat-label">TRAINING MODULES</span>
          <strong>{totalModules}</strong>
          <span className="nh-training-stat-detail">
            Available training material
          </span>
        </div>

        <div className="nh-training-stat">
          <span className="nh-training-stat-label">REQUIRED</span>
          <strong>{requiredModules}</strong>
          <span className="nh-training-stat-detail">
            Required for personnel
          </span>
        </div>

        <div className="nh-training-stat">
          <span className="nh-training-stat-label">PERSONNEL COMPLETE</span>
          <strong>{completedPersonnel}</strong>
          <span className="nh-training-stat-detail">
            Full required training
          </span>
        </div>

        <div className="nh-training-stat">
          <span className="nh-training-stat-label">CERTIFICATIONS</span>
          <strong>{totalCertifications}</strong>
          <span className="nh-training-stat-detail">
            Recorded personnel certifications
          </span>
        </div>
      </div>

      <section className="nh-section nh-training-section">
        <div className="nh-section-header">
          <div>
            <h2>Training Modules</h2>
            <p>
              Structured training material used to prepare and certify
              personnel.
            </p>
          </div>
        </div>

        <div className="nh-training-controls">
          <div className="nh-search-box nh-training-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search training modules..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            className="nh-filter-select"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>

        <div className="nh-training-table-wrap">
          <div className="nh-training-table">
            <div className="nh-training-row nh-training-row-header">
              <div>Training Module</div>
              <div>Category</div>
              <div>Requirement</div>
              <div>Completions</div>
              <div>Material</div>
              <div></div>
            </div>

            {filteredModules.map((module) => (
              <div className="nh-training-row" key={module.id}>
                <div className="nh-training-identity">
                  <div className="nh-training-icon">▤</div>

                  <div>
                    <strong>{module.title}</strong>
                    <span>{module.id}</span>
                  </div>
                </div>

                <div className="nh-training-category">
                  {module.category}
                </div>

                <div>
                  <span
                    className={`nh-training-requirement ${
                      module.status === "Required"
                        ? "nh-training-required"
                        : "nh-training-specialist"
                    }`}
                  >
                    {module.status}
                  </span>
                </div>

                <div className="nh-training-completions">
                  <strong>{module.completions}</strong>
                  <span>personnel</span>
                </div>

                <div className="nh-training-material">
                  {module.material}
                </div>

                <div>
                  <button
                    className="nh-training-view-button"
                    type="button"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}

            {filteredModules.length === 0 && (
              <div className="nh-training-empty">
                <div className="nh-training-empty-icon">▤</div>
                <strong>No training modules found</strong>
                <span>
                  Try changing your search or category filter.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="nh-section nh-training-personnel">
        <div className="nh-section-header">
          <div>
            <h2>Personnel Completion</h2>
            <p>
              Training progress and certification status by member.
            </p>
          </div>
        </div>

        <div className="nh-training-personnel-table">
          <div className="nh-training-person-row nh-training-person-row-header">
            <div>Member</div>
            <div>Position</div>
            <div>Training Progress</div>
            <div>Certifications</div>
            <div>Status</div>
          </div>

          {personnel.map((member) => {
            const percentage = Math.round(
              (member.completed / member.total) * 100
            );

            return (
              <div
                className="nh-training-person-row"
                key={member.id}
              >
                <div className="nh-training-person">
                  <div className="nh-training-person-avatar">
                    {member.id.replace("MEM-", "")}
                  </div>

                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.id}</span>
                  </div>
                </div>

                <div className="nh-training-position">
                  {member.position}
                </div>

                <div className="nh-training-progress">
                  <div className="nh-training-progress-label">
                    <span>
                      {member.completed} / {member.total} modules
                    </span>
                    <strong>{percentage}%</strong>
                  </div>

                  <div className="nh-training-progress-bar">
                    <div
                      className="nh-training-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="nh-training-certifications">
                  {member.certifications}
                </div>

                <div>
                  <span className={completionClass(member.status)}>
                    {member.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="nh-section nh-training-overview">
        <div className="nh-training-overview-card">
          <div className="nh-training-overview-icon">✓</div>

          <div>
            <span className="nh-eyebrow">CERTIFICATIONS</span>
            <h3>Personnel Certifications</h3>
            <p>
              Track certifications earned by members and connect them to
              personnel records and applicable training.
            </p>
          </div>

          <button type="button" className="nh-secondary-button">
            View Certifications
          </button>
        </div>

        <div className="nh-training-overview-card">
          <div className="nh-training-overview-icon">▤</div>

          <div>
            <span className="nh-eyebrow">HANDBOOK</span>
            <h3>Handbook Training Material</h3>
            <p>
              Access the Investigator&apos;s Handbook and use its operational,
              procedural, safety, evidence, and research material as training
              references.
            </p>
          </div>

          <button type="button" className="nh-secondary-button">
            Open Handbook
          </button>
        </div>
      </section>
    </div>
  );
}

export default Training;