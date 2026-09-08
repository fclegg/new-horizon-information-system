import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";

const STATUS_OPTIONS = [
  "Potentially Anomalous",
  "Under Investigation",
  "Confirmed Anomalous",
  "In Custody",
  "Released",
  "Archived",
];

const emptyObject = {
  name: "",
  type: "",
  status: "Under Investigation",
  location: "",
  custody: "",
  description: "",
  history: "",
  notes: "",
};

function statusClass(status) {
  return `nh-object-status nh-object-status-${(status || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

function generateObjectId(objects) {
  const numbers = objects
    .map((item) => {
      const match = String(item.id || "").match(/^OBJ-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((number) => Number.isFinite(number));

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

  return `OBJ-${String(nextNumber).padStart(4, "0")}`;
}

function Objects() {
  const navigate = useNavigate();

  const [objects, setObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState(emptyObject);
  const [error, setError] = useState("");

  useEffect(() => {
    loadObjects();
  }, []);

  async function loadObjects() {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(collection(db, "objects"));

      const loadedObjects = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          firestoreId: doc.id,
          id: data.objectId || data.id || "—",
          name: data.name || "Unnamed Object",
          type: data.type || "Unknown",
          status: data.status || "Under Investigation",
          location: data.location || "Unknown",
          custody: data.custody || "Unknown",
          description: data.description || "",
          history: data.history || "",
          notes: data.notes || "",
          investigations: Number(data.investigations || 0),
          lastInvestigated: data.lastInvestigated || null,
          createdAt: data.createdAt || null,
        };
      });

      setObjects(loadedObjects);
    } catch (err) {
      console.error("Error loading objects:", err);
      setError("Unable to load object records.");
    } finally {
      setLoading(false);
    }
  }

  const objectTypes = useMemo(() => {
    const types = objects
      .map((item) => item.type)
      .filter((type) => type && type !== "Unknown");

    return ["All", ...new Set(types)];
  }, [objects]);

  const filteredObjects = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return objects.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search) ||
        item.type.toLowerCase().includes(search) ||
        item.location.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesType =
        typeFilter === "All" || item.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [objects, searchTerm, statusFilter, typeFilter]);

  const totalObjects = objects.length;

  const investigationObjects = objects.filter(
    (item) =>
      item.status === "Under Investigation" ||
      item.status === "Potentially Anomalous"
  ).length;

  const custodyObjects = objects.filter(
    (item) =>
      item.status === "In Custody" ||
      item.status === "Confirmed Anomalous"
  ).length;

  const confirmedObjects = objects.filter(
    (item) => item.status === "Confirmed Anomalous"
  ).length;

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openRegisterModal() {
    setFormData(emptyObject);
    setError("");
    setShowRegisterModal(true);
  }

  function closeRegisterModal() {
    if (saving) return;

    setShowRegisterModal(false);
    setFormData(emptyObject);
    setError("");
  }

  async function handleRegisterObject(event) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Object name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const objectId = generateObjectId(objects);
      const user = auth.currentUser;

      const objectRef = await addDoc(collection(db, "objects"), {
        objectId,
        name: formData.name.trim(),
        type: formData.type.trim() || "Unknown",
        status: formData.status,
        location: formData.location.trim() || "Unknown",
        custody: formData.custody.trim() || "Unknown",

        description: formData.description.trim(),
        history: formData.history.trim(),
        notes: formData.notes.trim(),

        investigations: 0,
        investigationIds: [],
        evidenceIds: [],
        caseIds: [],
        locationHistory: [],
        custodyHistory: [],

        createdBy: user?.uid || null,
        createdByEmail: user?.email || null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setShowRegisterModal(false);
      setFormData(emptyObject);

      await loadObjects();

      navigate(`/objects/${objectRef.id}`);
    } catch (err) {
      console.error("Error registering object:", err);
      setError("Unable to register the object. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="nh-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="nh-page-header nh-object-header">
        <div>
          <div className="nh-eyebrow">OBJECT REGISTRY</div>

          <h1>Objects</h1>

          <p>
            Records for potentially anomalous and historically investigated
            objects.
          </p>
        </div>

        <button
          className="nh-primary-button"
          type="button"
          onClick={openRegisterModal}
        >
          + Register Object
        </button>
      </div>

      {error && !showRegisterModal && (
        <div className="nh-form-error nh-object-modal-error">{error}</div>
      )}

      {/* =====================================================
          STATISTICS
          ===================================================== */}

      <div className="nh-object-stats">

        <div className="nh-object-stat">
          <span className="nh-object-stat-label">
            TOTAL OBJECTS
          </span>

          <strong>{totalObjects}</strong>

          <span className="nh-object-stat-detail">
            Registered object records
          </span>
        </div>

        <div className="nh-object-stat">
          <span className="nh-object-stat-label">
            UNDER REVIEW
          </span>

          <strong>{investigationObjects}</strong>

          <span className="nh-object-stat-detail">
            Potentially anomalous
          </span>
        </div>

        <div className="nh-object-stat">
          <span className="nh-object-stat-label">
            IN CUSTODY
          </span>

          <strong>{custodyObjects}</strong>

          <span className="nh-object-stat-detail">
            Currently controlled
          </span>
        </div>

        <div className="nh-object-stat">
          <span className="nh-object-stat-label">
            CONFIRMED
          </span>

          <strong>{confirmedObjects}</strong>

          <span className="nh-object-stat-detail">
            Confirmed anomalous records
          </span>
        </div>

      </div>

      {/* =====================================================
          OBJECT INVENTORY
          ===================================================== */}

      <section className="nh-section nh-object-section">

        <div className="nh-section-header">
          <div>
            <h2>Object Inventory</h2>

            <p>
              Every registered object receives a unique NHIS object identifier.
            </p>
          </div>

          <span className="nh-member-count">
            {filteredObjects.length} records
          </span>
        </div>

        {/* FILTERS */}

        <div className="nh-object-controls">

          <div className="nh-search-box nh-object-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search objects, tags, locations..."
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

            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
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

        {/* OBJECT TABLE */}

        <div className="nh-object-table-wrap">

          <div className="nh-object-table">

            <div className="nh-object-row nh-object-row-header">
              <div>Object</div>
              <div>Tag</div>
              <div>Status</div>
              <div>Location</div>
              <div></div>
            </div>

            {loading ? (
              <div className="nh-object-empty">

                <div className="nh-object-empty-icon">
                  ◇
                </div>

                <strong>
                  Loading objects...
                </strong>

                <span>
                  Please wait while the registry is loaded.
                </span>

              </div>
            ) : filteredObjects.length > 0 ? (

              filteredObjects.map((item) => (

                <div
                  className="nh-object-row"
                  key={item.firestoreId}
                >

                  <div className="nh-object-identity">

                    <div className="nh-object-icon">
                      ◇
                    </div>

                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.type}
                      </span>
                    </div>

                  </div>

                  <div className="nh-object-tag">
                    {item.id}
                  </div>

                  <div>
                    <span
                      className={statusClass(item.status)}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="nh-object-location">
                    <strong>
                      {item.location}
                    </strong>
                  </div>

                  <div className="nh-object-action">

                    <button
                      className="nh-object-view-button"
                      type="button"
                      onClick={() =>
                        navigate(`/objects/${item.firestoreId}`)
                      }
                    >
                      View
                    </button>

                  </div>

                </div>

              ))

            ) : (

              <div className="nh-object-empty">

                <div className="nh-object-empty-icon">
                  ◇
                </div>

                <strong>
                  {objects.length === 0
                    ? "No objects registered"
                    : "No objects found"}
                </strong>

                <span>
                  {objects.length === 0
                    ? "Register your first object to begin building the object registry."
                    : "Try changing your search or filter settings."}
                </span>

                {objects.length === 0 && (
                  <button
                    className="nh-primary-button"
                    type="button"
                    onClick={openRegisterModal}
                    style={{ marginTop: "18px" }}
                  >
                    + Register First Object
                  </button>
                )}

              </div>

            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          OBJECT SYSTEMS
          ===================================================== */}

      <section className="nh-section nh-object-overview">

        <div className="nh-object-overview-card">

          <div className="nh-object-overview-icon">
            ⌂
          </div>

          <div>

            <span className="nh-eyebrow">
              LOCATION
            </span>

            <h3>
              Object Location History
            </h3>

            <p>
              Track the current location of an object and maintain a record of
              previous known locations.
            </p>

          </div>

          <button
            type="button"
            className="nh-secondary-button"
          >
            View Locations
          </button>

        </div>

        <div className="nh-object-overview-card">

          <div className="nh-object-overview-icon">
            ↔
          </div>

          <div>

            <span className="nh-eyebrow">
              CUSTODY
            </span>

            <h3>
              Chain of Custody
            </h3>

            <p>
              Record who possesses an object, when custody changed, and where
              the object was transferred.
            </p>

          </div>

          <button
            type="button"
            className="nh-secondary-button"
          >
            View Custody
          </button>

        </div>

        <div className="nh-object-overview-card">

          <div className="nh-object-overview-icon">
            ⌁
          </div>

          <div>

            <span className="nh-eyebrow">
              HISTORY
            </span>

            <h3>
              Investigation History
            </h3>

            <p>
              Cross-reference every investigation, evidence record, and report
              associated with an object.
            </p>

          </div>

          <button
            type="button"
            className="nh-secondary-button"
          >
            View History
          </button>

        </div>

      </section>

      {/* =====================================================
          REGISTER OBJECT MODAL
          ===================================================== */}

      {showRegisterModal && (

        <div
          className="nh-modal-backdrop nh-object-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRegisterModal();
            }
          }}
        >

          <div className="nh-modal nh-object-modal">

            <div className="nh-modal-header nh-object-modal-header">

              <div>

                <div className="nh-eyebrow">
                  OBJECT REGISTRY
                </div>

                <h2>
                  Register Object
                </h2>

                <p>
                  Create a new object record in the New Horizon Information
                  System.
                </p>

              </div>

              <button
                type="button"
                className="nh-modal-close nh-object-modal-close"
                onClick={closeRegisterModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              className="nh-form nh-object-modal-form"
              onSubmit={handleRegisterObject}
            >

              <div className="nh-form-section nh-object-modal-section">

                <div className="nh-form-section-header nh-object-modal-section-header">

                  <h3>
                    Object Information
                  </h3>

                  <p>
                    Basic identification information for the object.
                  </p>

                </div>

                <div className="nh-form-grid nh-object-modal-grid">

                  <div className="nh-form-field nh-form-field-full">

                    <label htmlFor="object-name">
                      Object Name <span>*</span>
                    </label>

                    <input
                      id="object-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Enter object name..."
                      required
                    />

                  </div>

                  <div className="nh-form-field nh-object-modal-field">

                    <label htmlFor="object-type">
                      Object Type
                    </label>

                    <input
                      id="object-type"
                      name="type"
                      type="text"
                      value={formData.type}
                      onChange={handleFormChange}
                      placeholder="Artifact, jewelry, document..."
                    />

                  </div>

                  <div className="nh-form-field nh-object-modal-field">

                    <label htmlFor="object-status">
                      Status
                    </label>

                    <select
                      id="object-status"
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>

                  </div>

                </div>

              </div>

              <div className="nh-form-section nh-object-modal-section">

                <div className="nh-form-section-header nh-object-modal-section-header">

                  <h3>
                    Location & Custody
                  </h3>

                  <p>
                    Document where the object is currently located and who
                    maintains custody.
                  </p>

                </div>

                <div className="nh-form-grid nh-object-modal-grid">

                  <div className="nh-form-field nh-object-modal-field">

                    <label htmlFor="object-location">
                      Current Location
                    </label>

                    <input
                      id="object-location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleFormChange}
                      placeholder="Current location..."
                    />

                  </div>

                  <div className="nh-form-field nh-object-modal-field">

                    <label htmlFor="object-custody">
                      Current Custody
                    </label>

                    <input
                      id="object-custody"
                      name="custody"
                      type="text"
                      value={formData.custody}
                      onChange={handleFormChange}
                      placeholder="Person, member, owner..."
                    />

                  </div>

                </div>

              </div>

              <div className="nh-form-section nh-object-modal-section">

                <div className="nh-form-section-header nh-object-modal-section-header">

                  <h3>
                    Research Information
                  </h3>

                  <p>
                    Record historical and investigative information about the
                    object.
                  </p>

                </div>

                <div className="nh-form-grid nh-object-modal-grid">

                  <div className="nh-form-field nh-form-field-full">

                    <label htmlFor="object-description">
                      Description
                    </label>

                    <textarea
                      id="object-description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      placeholder="Describe the object..."
                      rows="4"
                    />

                  </div>

                  <div className="nh-form-field nh-form-field-full">

                    <label htmlFor="object-history">
                      Historical Information
                    </label>

                    <textarea
                      id="object-history"
                      name="history"
                      value={formData.history}
                      onChange={handleFormChange}
                      placeholder="Known history, ownership, origin, previous locations..."
                      rows="4"
                    />

                  </div>

                  <div className="nh-form-field nh-form-field-full">

                    <label htmlFor="object-notes">
                      Investigative Notes
                    </label>

                    <textarea
                      id="object-notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleFormChange}
                      placeholder="Additional notes or observations..."
                      rows="4"
                    />

                  </div>

                </div>

              </div>

              {error && (
                <div className="nh-form-error nh-object-modal-error">
                  {error}
                </div>
              )}

              <div className="nh-modal-actions nh-object-modal-footer-actions">

                <button
                  type="button"
                  className="nh-secondary-button"
                  onClick={closeRegisterModal}
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
                    ? "Registering..."
                    : "Register Object"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Objects;