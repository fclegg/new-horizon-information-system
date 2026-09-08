import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

function completionClass(status) {
  return `nh-training-completion nh-training-completion-${status
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

function normalizeTrainingModule(docSnapshot) {
  const data = docSnapshot.data();

  return {
    firestoreId: docSnapshot.id,
    id: data.trainingId || data.courseId || data.moduleId || docSnapshot.id,
    title: data.title || data.name || "Untitled Training",
    category: data.category || "Uncategorized",
    status: data.status || data.requirement || "Optional",
    completions: Number(data.completions || 0),
    material: data.material || data.materialType || "—",
  };
}

function getMemberTraining(member) {
  const training =
    member.training ||
    member.trainingProgress ||
    member.completedTraining ||
    [];

  if (Array.isArray(training)) {
    return training;
  }

  if (training && typeof training === "object") {
    return Object.values(training);
  }

  return [];
}

function normalizePersonnel(docSnapshot, trainingModules) {
  const data = docSnapshot.data();
  const training = getMemberTraining(data);

  const total =
    Number(data.trainingTotal) ||
    Number(data.totalTraining) ||
    trainingModules.length;

  let completed =
    Number(data.trainingCompleted) ||
    Number(data.completedTrainingCount) ||
    0;

  if (Array.isArray(training)) {
    completed = training.filter((item) => {
      if (typeof item === "string") return true;

      return (
        item?.completed === true ||
        item?.status === "Complete" ||
        item?.status === "Completed"
      );
    }).length;
  }

  const certifications = Array.isArray(data.certifications)
    ? data.certifications.length
    : Number(data.certificationCount || data.certifications || 0);

  const safeTotal = Math.max(total, 0);
  const safeCompleted = Math.min(Math.max(completed, 0), safeTotal);

  let status = "Incomplete";

  if (safeTotal > 0 && safeCompleted >= safeTotal) {
    status = "Complete";
  } else if (safeCompleted > 0) {
    status = "In Progress";
  }

  return {
    firestoreId: docSnapshot.id,
    id: data.memberId || data.personnelId || docSnapshot.id,
    name:
      data.name ||
      [data.firstName, data.lastName].filter(Boolean).join(" ") ||
      "Unnamed Member",
    position: data.position || data.role || data.title || "Member",
    completed: safeCompleted,
    total: safeTotal,
    certifications,
    status,
  };
}

function Training() {
  const [trainingModules, setTrainingModules] = useState([]);
  const [personnel, setPersonnel] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    loadTraining();
  }, []);

  async function loadTraining() {
    try {
      setLoading(true);
      setError("");

      const [trainingSnapshot, membersSnapshot] = await Promise.all([
        getDocs(collection(db, "training")),
        getDocs(collection(db, "members")),
      ]);

      const modules = trainingSnapshot.docs.map(normalizeTrainingModule);

      const members = membersSnapshot.docs
        .map((docSnapshot) =>
          normalizePersonnel(docSnapshot, modules)
        )
        .sort((a, b) => a.name.localeCompare(b.name));

      setTrainingModules(modules);
      setPersonnel(members);
    } catch (err) {
      console.error("Error loading training:", err);
      setError("Unable to load training records.");
      setTrainingModules([]);
      setPersonnel([]);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        trainingModules
          .map((module) => module.category)
          .filter(Boolean)
      ),
    ],
    [trainingModules]
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
        categoryFilter === "All" ||
        module.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [trainingModules, searchTerm, categoryFilter]);

  const totalModules = trainingModules.length;

  const requiredModules = trainingModules.filter(
    (module) =>
      module.status.toLowerCase() === "required"
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
          <div className="nh-eyebrow">
            PERSONNEL DEVELOPMENT
          </div>

          <h1>Training</h1>

          <p>
            Training modules, personnel completion, certifications, and
            handbook material.
          </p>
        </div>

        <button
          className="nh-primary-button"
          type="button"
        >
          + Add Training Module
        </button>
      </div>


      {error && (
        <div className="nh-form-error">
          {error}
        </div>
      )}


      <div className="nh-training-stats">

        <div className="nh-training-stat">
          <span className="nh-training-stat-label">
            TRAINING MODULES
          </span>

          <strong>{totalModules}</strong>

          <span className="nh-training-stat-detail">
            Available training material
          </span>
        </div>


        <div className="nh-training-stat">
          <span className="nh-training-stat-label">
            REQUIRED
          </span>

          <strong>{requiredModules}</strong>

          <span className="nh-training-stat-detail">
            Required for personnel
          </span>
        </div>


        <div className="nh-training-stat">
          <span className="nh-training-stat-label">
            PERSONNEL COMPLETE
          </span>

          <strong>{completedPersonnel}</strong>

          <span className="nh-training-stat-detail">
            Full required training
          </span>
        </div>


        <div className="nh-training-stat">
          <span className="nh-training-stat-label">
            CERTIFICATIONS
          </span>

          <strong>{totalCertifications}</strong>

          <span className="nh-training-stat-detail">
            Recorded personnel certifications
          </span>
        </div>

      </div>


      {/* =====================================================
          TRAINING MODULES
          ===================================================== */}

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
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

          </div>


          <select
            className="nh-filter-select"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category === "All"
                  ? "All Categories"
                  : category}
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


            {loading ? (
              <div className="nh-training-empty">
                <div className="nh-training-empty-icon">
                  ▤
                </div>

                <strong>
                  Loading training records
                </strong>

                <span>
                  Retrieving training modules from the database.
                </span>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="nh-training-empty">

                <div className="nh-training-empty-icon">
                  ▤
                </div>

                <strong>
                  No training modules found
                </strong>

                <span>
                  There are currently no training courses or modules
                  registered in the system.
                </span>

              </div>
            ) : (
              filteredModules.map((module) => (
                <div
                  className="nh-training-row"
                  key={module.firestoreId}
                >

                  <div className="nh-training-identity">

                    <div className="nh-training-icon">
                      ▤
                    </div>

                    <div>
                      <strong>
                        {module.title}
                      </strong>

                      <span>
                        {module.id}
                      </span>
                    </div>

                  </div>


                  <div className="nh-training-category">
                    {module.category}
                  </div>


                  <div>

                    <span
                      className={`nh-training-requirement ${
                        module.status.toLowerCase() === "required"
                          ? "nh-training-required"
                          : "nh-training-specialist"
                      }`}
                    >
                      {module.status}
                    </span>

                  </div>


                  <div className="nh-training-completions">

                    <strong>
                      {module.completions}
                    </strong>

                    <span>
                      personnel
                    </span>

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
              ))
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          PERSONNEL COMPLETION
          ===================================================== */}

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


          {loading ? (
            <div className="nh-training-empty">
              Loading personnel records...
            </div>
          ) : personnel.length === 0 ? (
            <div className="nh-training-empty">

              <div className="nh-training-empty-icon">
                ◉
              </div>

              <strong>
                No personnel training records found
              </strong>

              <span>
                Personnel completion data will appear here once
                training records are registered.
              </span>

            </div>
          ) : (
            personnel.map((member) => {

              const percentage =
                member.total > 0
                  ? Math.round(
                      (member.completed / member.total) * 100
                    )
                  : 0;

              return (
                <div
                  className="nh-training-person-row"
                  key={member.firestoreId}
                >

                  <div className="nh-training-person">

                    <div className="nh-training-person-avatar">
                      {member.id.replace("MEM-", "")}
                    </div>

                    <div>
                      <strong>
                        {member.name}
                      </strong>

                      <span>
                        {member.id}
                      </span>
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

                      <strong>
                        {percentage}%
                      </strong>

                    </div>


                    <div className="nh-training-progress-bar">

                      <div
                        className="nh-training-progress-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
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
            })
          )}

        </div>

      </section>


      {/* =====================================================
          TRAINING RESOURCES
          ===================================================== */}

      <section className="nh-section nh-training-overview">

        <div className="nh-training-overview-card">

          <div className="nh-training-overview-icon">
            ✓
          </div>

          <div>

            <span className="nh-eyebrow">
              CERTIFICATIONS
            </span>

            <h3>
              Personnel Certifications
            </h3>

            <p>
              Track certifications earned by members and connect them
              to personnel records and applicable training.
            </p>

          </div>

          <button
            type="button"
            className="nh-secondary-button"
          >
            View Certifications
          </button>

        </div>


        <div className="nh-training-overview-card">

          <div className="nh-training-overview-icon">
            ▤
          </div>

          <div>

            <span className="nh-eyebrow">
              HANDBOOK
            </span>

            <h3>
              Handbook Training Material
            </h3>

            <p>
              Access training references from the Resources section
              of the New Horizon Information System.
            </p>

          </div>

          <button
            type="button"
            className="nh-secondary-button"
          >
            Open Resources
          </button>

        </div>

      </section>

    </div>
  );
}

export default Training;
