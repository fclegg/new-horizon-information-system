import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/config";

function formatDate(value) {
  if (!value) return "—";

  if (value?.toDate) {
    return value.toDate().toLocaleString();
  }

  if (typeof value === "string") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return String(value);
}

const STATUS_OPTIONS = [
  "Potentially Anomalous",
  "Under Investigation",
  "Confirmed Anomalous",
  "In Custody",
  "Released",
  "Archived",
];

function ObjectCaseFile() {
  const { objectId } = useParams();
  const navigate = useNavigate();

  const [object, setObject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    status: "",
    location: "",
    custody: "",
    description: "",
    history: "",
    notes: "",
  });

  useEffect(() => {
    loadObject();
  }, [objectId]);

  async function loadObject() {
    try {
      setLoading(true);
      setError("");

      const objectRef = doc(db, "objects", objectId);
      const snapshot = await getDoc(objectRef);

      if (!snapshot.exists()) {
        setError("This object record could not be found.");
        setObject(null);
        return;
      }

      const data = snapshot.data();

      const loadedObject = {
        firestoreId: snapshot.id,
        ...data,
      };

      setObject(loadedObject);

      setEditForm({
        name: data.name || "",
        type: data.type || "",
        status: data.status || "Under Investigation",
        location: data.location || "",
        custody: data.custody || "",
        description: data.description || "",
        history: data.history || "",
        notes: data.notes || "",
      });
    } catch (err) {
      console.error("Error loading object:", err);
      setError("Unable to load this object case file.");
    } finally {
      setLoading(false);
    }
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function startEditing() {
    if (!object) return;

    setEditForm({
      name: object.name || "",
      type: object.type || "",
      status: object.status || "Under Investigation",
      location: object.location || "",
      custody: object.custody || "",
      description: object.description || "",
      history: object.history || "",
      notes: object.notes || "",
    });

    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    if (saving) return;

    setEditForm({
      name: object.name || "",
      type: object.type || "",
      status: object.status || "Under Investigation",
      location: object.location || "",
      custody: object.custody || "",
      description: object.description || "",
      history: object.history || "",
      notes: object.notes || "",
    });

    setError("");
    setEditing(false);
  }

  async function saveObject() {
    if (!editForm.name.trim()) {
      setError("Object name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const objectRef = doc(db, "objects", objectId);

      await updateDoc(objectRef, {
        name: editForm.name.trim(),
        type: editForm.type.trim() || "Unknown",
        status: editForm.status,
        location: editForm.location.trim() || "Unknown",
        custody: editForm.custody.trim() || "Unknown",
        description: editForm.description.trim(),
        history: editForm.history.trim(),
        notes: editForm.notes.trim(),
        updatedAt: serverTimestamp(),
      });

      await loadObject();

      setEditing(false);
    } catch (err) {
      console.error("Error updating object:", err);
      setError("Unable to save the object. Please try again.");
    } finally {
      setSaving(false);
    }
  }

if (loading) {
    return (
      <div className="nh-object-file-page">
        <div className="nh-object-file-loading">
          Loading object case file...
        </div>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="nh-object-file-page">
        <div className="nh-object-file-error">
          <div className="nh-object-file-eyebrow">
            OBJECT REGISTRY
          </div>

          <h1>Object Not Found</h1>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/objects")}
          >
            ← Back to Objects
          </button>
        </div>
      </div>
    );
  }

  const caseCount = Array.isArray(object.caseIds)
    ? object.caseIds.length
    : 0;

  const investigationCount = Array.isArray(object.investigationIds)
    ? object.investigationIds.length
    : Number(object.investigations || 0);

  const evidenceCount = Array.isArray(object.evidenceIds)
    ? object.evidenceIds.length
    : 0;

  return (
    <div className="nh-object-file-page">

      {/* =====================================================
          TOP BAR
          ===================================================== */}

      <div className="nh-object-file-topbar">

        <button
          type="button"
          className="nh-object-file-back"
          onClick={() => navigate("/objects")}
          disabled={saving}
        >
          ← Object Registry
        </button>

        <span className="nh-object-file-system">
          NEW HORIZON INFORMATION SYSTEM
        </span>

      </div>


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="nh-object-file-header">

        <div className="nh-object-file-header-main">

          <div className="nh-object-file-icon">
            ◇
          </div>

          <div>

            <div className="nh-object-file-eyebrow">
              OBJECT CASE FILE
            </div>

            {editing ? (
              <input
                className="nh-object-file-title-input"
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Object name..."
              />
            ) : (
              <h1>
                {object.name || "Unnamed Object"}
              </h1>
            )}

            <div className="nh-object-file-id">
              {object.objectId || "UNASSIGNED"}
            </div>

          </div>

        </div>


        <div className="nh-object-file-header-right">

            <div className="nh-object-file-header-status">

                <span>
                CURRENT STATUS
                </span>

                {editing ? (
                <select
                    className="nh-object-file-status-select"
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
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
                ) : (
                <strong>
                    {object.status || "Unknown"}
                </strong>
                )}

            </div>

            {!editing && (
                <button
                type="button"
                className="nh-object-file-edit"
                onClick={startEditing}
                >
                <span>✎</span>
                Edit Object
                </button>
            )}

            </div>

      </header>


      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <section className="nh-object-file-summary">

        <div>
          <span>OBJECT TYPE</span>

          {editing ? (
            <input
              type="text"
              name="type"
              value={editForm.type}
              onChange={handleEditChange}
              placeholder="Object type..."
            />
          ) : (
            <strong>
              {object.type || "Unknown"}
            </strong>
          )}
        </div>


        <div>
          <span>LOCATION</span>

          {editing ? (
            <input
              type="text"
              name="location"
              value={editForm.location}
              onChange={handleEditChange}
              placeholder="Current location..."
            />
          ) : (
            <strong>
              {object.location || "Unknown"}
            </strong>
          )}
        </div>


        <div>
          <span>CUSTODY</span>

          {editing ? (
            <input
              type="text"
              name="custody"
              value={editForm.custody}
              onChange={handleEditChange}
              placeholder="Current custody..."
            />
          ) : (
            <strong>
              {object.custody || "Unknown"}
            </strong>
          )}
        </div>


        <div>
          <span>REGISTERED</span>

          <strong>
            {formatDate(object.createdAt)}
          </strong>
        </div>

      </section>


      {/* =====================================================
          DESCRIPTION
          ===================================================== */}

      <section className="nh-object-file-section">

        <div className="nh-object-file-section-heading">

          <div className="nh-object-file-number">
            01
          </div>

          <div>
            <span>OBJECT RECORD</span>

            <h2>
              Description
            </h2>
          </div>

        </div>

        <div className="nh-object-file-content">

          {editing ? (
            <textarea
              className="nh-object-file-textarea"
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              placeholder="Describe the object..."
              rows="6"
            />
          ) : object.description ? (
            <p>
              {object.description}
            </p>
          ) : (
            <span className="nh-object-file-empty">
              No description has been entered for this object.
            </span>
          )}

        </div>

      </section>


      {/* =====================================================
          HISTORY
          ===================================================== */}

      <section className="nh-object-file-section">

        <div className="nh-object-file-section-heading">

          <div className="nh-object-file-number">
            02
          </div>

          <div>
            <span>HISTORICAL RECORD</span>

            <h2>
              Historical Information
            </h2>
          </div>

        </div>

        <div className="nh-object-file-content">

          {editing ? (
            <textarea
              className="nh-object-file-textarea"
              name="history"
              value={editForm.history}
              onChange={handleEditChange}
              placeholder="Historical information, ownership, origin, previous locations..."
              rows="7"
            />
          ) : object.history ? (
            <p>
              {object.history}
            </p>
          ) : (
            <span className="nh-object-file-empty">
              No historical information has been entered.
            </span>
          )}

        </div>

      </section>


      {/* =====================================================
          INVESTIGATIVE NOTES
          ===================================================== */}

      <section className="nh-object-file-section">

        <div className="nh-object-file-section-heading">

          <div className="nh-object-file-number">
            03
          </div>

          <div>
            <span>INVESTIGATION</span>

            <h2>
              Investigative Notes
            </h2>
          </div>

        </div>

        <div className="nh-object-file-content">

          {editing ? (
            <textarea
              className="nh-object-file-textarea"
              name="notes"
              value={editForm.notes}
              onChange={handleEditChange}
              placeholder="Additional investigative notes..."
              rows="7"
            />
          ) : object.notes ? (
            <p>
              {object.notes}
            </p>
          ) : (
            <span className="nh-object-file-empty">
              No investigative notes have been entered.
            </span>
          )}

        </div>

      </section>


      {/* =====================================================
          ASSOCIATED RECORDS
          ===================================================== */}

      <section className="nh-object-file-section">

        <div className="nh-object-file-section-heading">

          <div className="nh-object-file-number">
            04
          </div>

          <div>
            <span>DATABASE LINKS</span>

            <h2>
              Associated Records
            </h2>
          </div>

        </div>


        <div className="nh-object-file-record-grid">

          <div className="nh-object-file-record">

            <span>
              CASES
            </span>

            <strong>
              {caseCount}
            </strong>

            <small>
              Associated case records
            </small>

          </div>


          <div className="nh-object-file-record">

            <span>
              INVESTIGATIONS
            </span>

            <strong>
              {investigationCount}
            </strong>

            <small>
              Associated investigations
            </small>

          </div>


          <div className="nh-object-file-record">

            <span>
              EVIDENCE
            </span>

            <strong>
              {evidenceCount}
            </strong>

            <small>
              Associated evidence records
            </small>

          </div>

        </div>

      </section>


      {editing && (
        <div className="nh-object-file-edit-footer">

          <div className="nh-object-file-edit-footer-info">

            <span>
              EDIT MODE
            </span>

            <strong>
              Unsaved changes will be discarded if you cancel.
            </strong>

          </div>

          <div className="nh-object-file-edit-footer-actions">

            <button
              type="button"
              className="nh-object-file-cancel"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="nh-object-file-save"
              onClick={saveObject}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          SYSTEM INFORMATION
          ===================================================== */}

      <section className="nh-object-file-section nh-object-file-system-section">

        <div className="nh-object-file-section-heading">

          <div className="nh-object-file-number">
            05
          </div>

          <div>
            <span>SYSTEM RECORD</span>

            <h2>
              Database Information
            </h2>
          </div>

        </div>


        <div className="nh-object-file-system-grid">

          <div>
            <span>FIRESTORE RECORD ID</span>

            <strong>
              {object.firestoreId}
            </strong>
          </div>


          <div>
            <span>CREATED BY</span>

            <strong>
              {object.createdByEmail || "—"}
            </strong>
          </div>


          <div>
            <span>CREATED</span>

            <strong>
              {formatDate(object.createdAt)}
            </strong>
          </div>


          <div>
            <span>LAST UPDATED</span>

            <strong>
              {formatDate(object.updatedAt)}
            </strong>
          </div>

        </div>

      </section>

    </div>
  );
}

export default ObjectCaseFile;