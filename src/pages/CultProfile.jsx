import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../firebase/config";

function CultProfile() {
  const { cultId } = useParams();
  const navigate = useNavigate();

  const [organization, setOrganization] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [editForm, setEditForm] =
    useState(null);

  useEffect(() => {
    loadOrganization();
  }, [cultId]);

  async function loadOrganization() {
    try {
      setLoading(true);
      setError("");

      const organizationRef =
        doc(
          db,
          "cults",
          cultId
        );

      const snapshot =
        await getDoc(
          organizationRef
        );

      if (!snapshot.exists()) {
        setError(
          "Organization record not found."
        );

        setOrganization(null);

        return;
      }

      const data =
        snapshot.data();

      const loadedOrganization = {
        firestoreId:
          snapshot.id,

        id:
          data.cultId ||
          snapshot.id,

        name:
          data.name ||
          "Unnamed Organization",

        classification:
          data.classification ||
          "Unknown",

        status:
          data.status ||
          "Unconfirmed",

        locations:
          Array.isArray(
            data.locations
          )
            ? data.locations
            : [],

        aliases:
          Array.isArray(
            data.aliases
          )
            ? data.aliases
            : [],

        founded:
          data.founded ||
          "",

        leadership:
          data.leadership ||
          "",

        beliefs:
          data.beliefs ||
          "",

        activities:
          data.activities ||
          "",

        description:
          data.description ||
          "",

        incidents:
          Number(
            data.incidents
          ) || 0,

        entities:
          Number(
            data.entities
          ) || 0,

        evidence:
          Number(
            data.evidence
          ) || 0,

        notes:
          data.notes ||
          "",
      };

      setOrganization(
        loadedOrganization
      );

      setEditForm(
        createEditForm(
          loadedOrganization
        )
      );
    } catch (err) {
      console.error(
        "Error loading organization:",
        err
      );

      setError(
        "Unable to load organization profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function createEditForm(
    data
  ) {
    return {
      name:
        data.name || "",

      classification:
        data.classification ||
        "Unknown",

      status:
        data.status ||
        "Unconfirmed",

      locations:
        (data.locations || [])
          .join(", "),

      aliases:
        (data.aliases || [])
          .join(", "),

      founded:
        data.founded || "",

      leadership:
        data.leadership ||
        "",

      beliefs:
        data.beliefs ||
        "",

      activities:
        data.activities ||
        "",

      description:
        data.description ||
        "",

      incidents:
        data.incidents || 0,

      entities:
        data.entities || 0,

      evidence:
        data.evidence || 0,

      notes:
        data.notes || "",
    };
  }

  function updateField(
    field,
    value
  ) {
    setEditForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }

  function startEditing() {
    setEditForm(
      createEditForm(
        organization
      )
    );

    setEditing(true);
    setError("");
  }

  function cancelEditing() {
    setEditForm(
      createEditForm(
        organization
      )
    );

    setEditing(false);
    setError("");
  }

  async function saveChanges(
    event
  ) {
    event.preventDefault();

    if (
      !editForm.name.trim()
    ) {
      setError(
        "Organization Name is required."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const locations =
        editForm.locations
          .split(",")
          .map((location) =>
            location.trim()
          )
          .filter(Boolean);

      const aliases =
        editForm.aliases
          .split(",")
          .map((alias) =>
            alias.trim()
          )
          .filter(Boolean);

      const organizationRef =
        doc(
          db,
          "cults",
          cultId
        );

      await updateDoc(
        organizationRef,
        {
          name:
            editForm.name.trim(),

          classification:
            editForm.classification,

          status:
            editForm.status,

          locations,

          aliases,

          founded:
            editForm.founded.trim(),

          leadership:
            editForm.leadership.trim(),

          beliefs:
            editForm.beliefs.trim(),

          activities:
            editForm.activities.trim(),

          description:
            editForm.description.trim(),

          incidents:
            Number(
              editForm.incidents
            ) || 0,

          entities:
            Number(
              editForm.entities
            ) || 0,

          evidence:
            Number(
              editForm.evidence
            ) || 0,

          notes:
            editForm.notes.trim(),

          updatedAt:
            serverTimestamp(),
        }
      );

      await loadOrganization();

      setEditing(false);
    } catch (err) {
      console.error(
        "Error updating organization:",
        err
      );

      setError(
        "Unable to save organization changes."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="nh-page">

        <div className="nh-card nh-cult-profile-loading">
          Loading organization profile...
        </div>

      </div>
    );
  }

  if (!organization) {
    return (
      <div className="nh-page">

        <div className="nh-page-header">

          <div>

            <h1 className="nh-page-title">
              Organization Not Found
            </h1>

            <p className="nh-page-subtitle">
              The requested registry record
              could not be located.
            </p>

          </div>

          <button
            type="button"
            className="nh-button nh-button-secondary"
            onClick={() =>
              navigate(
                "/cults"
              )
            }
          >
            ← Back to Registry
          </button>

        </div>

        {error && (
          <div className="nh-form-error">
            {error}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="nh-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="nh-page-header">

        <div>

          <div className="nh-command-label">
            CULT REGISTRY /{" "}
            {organization.id}
          </div>

          <h1 className="nh-page-title">
            {organization.name}
          </h1>

          <p className="nh-page-subtitle">
            Organization intelligence and
            investigative research profile.
          </p>

        </div>


        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            type="button"
            className="nh-button nh-button-secondary"
            onClick={() =>
              navigate(
                "/cults"
              )
            }
          >
            ← Registry
          </button>


          {!editing && (

            <button
              type="button"
              className="nh-button nh-button-primary"
              onClick={
                startEditing
              }
            >
              Edit Organization
            </button>

          )}

        </div>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="nh-form-error">
          {error}
        </div>

      )}


      {/* =====================================================
          EDIT MODE
      ===================================================== */}

      {editing ? (

        <form
          className="nh-card nh-cult-profile-edit"
          onSubmit={
            saveChanges
          }
        >

          <div className="nh-cult-profile-section">

            <div className="nh-cult-form-section-title">
              Edit Organization Record
            </div>


            <div className="nh-cult-form-grid">

              <div className="nh-cult-form-field nh-cult-form-field-wide">

                <label>
                  Organization Name *
                </label>

                <input
                  type="text"
                  value={
                    editForm.name
                  }
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  required
                />

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Classification
                </label>

                <select
                  value={
                    editForm.classification
                  }
                  onChange={(event) =>
                    updateField(
                      "classification",
                      event.target.value
                    )
                  }
                >

                  <option value="Occult">
                    Occult
                  </option>

                  <option value="Religious">
                    Religious
                  </option>

                  <option value="Satanic">
                    Satanic
                  </option>

                  <option value="Extremist">
                    Extremist
                  </option>

                  <option value="Unknown">
                    Unknown
                  </option>

                </select>

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Status
                </label>

                <select
                  value={
                    editForm.status
                  }
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value
                    )
                  }
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                  <option value="Under Review">
                    Under Review
                  </option>

                  <option value="Unconfirmed">
                    Unconfirmed
                  </option>

                  <option value="Disbanded">
                    Disbanded
                  </option>

                </select>

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Founded / Established
                </label>

                <input
                  type="text"
                  value={
                    editForm.founded
                  }
                  onChange={(event) =>
                    updateField(
                      "founded",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Leadership
                </label>

                <input
                  type="text"
                  value={
                    editForm.leadership
                  }
                  onChange={(event) =>
                    updateField(
                      "leadership",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="nh-cult-form-field nh-cult-form-field-wide">

                <label>
                  Known Locations
                </label>

                <input
                  type="text"
                  value={
                    editForm.locations
                  }
                  onChange={(event) =>
                    updateField(
                      "locations",
                      event.target.value
                    )
                  }
                  placeholder="Separate locations with commas..."
                />

              </div>


              <div className="nh-cult-form-field nh-cult-form-field-wide">

                <label>
                  Aliases / Alternate Names
                </label>

                <input
                  type="text"
                  value={
                    editForm.aliases
                  }
                  onChange={(event) =>
                    updateField(
                      "aliases",
                      event.target.value
                    )
                  }
                  placeholder="Separate aliases with commas..."
                />

              </div>


              <div className="nh-cult-form-field nh-cult-form-field-wide">

                <label>
                  Description
                </label>

                <textarea
                  rows={5}
                  value={
                    editForm.description
                  }
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Beliefs / Ideology
                </label>

                <textarea
                  rows={5}
                  value={
                    editForm.beliefs
                  }
                  onChange={(event) =>
                    updateField(
                      "beliefs",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Activities
                </label>

                <textarea
                  rows={5}
                  value={
                    editForm.activities
                  }
                  onChange={(event) =>
                    updateField(
                      "activities",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Known Incidents
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    editForm.incidents
                  }
                  onChange={(event) =>
                    updateField(
                      "incidents",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Associated Entities
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    editForm.entities
                  }
                  onChange={(event) =>
                    updateField(
                      "entities",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="nh-cult-form-field">

                <label>
                  Evidence / Research
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    editForm.evidence
                  }
                  onChange={(event) =>
                    updateField(
                      "evidence",
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="nh-cult-form-field nh-cult-form-field-wide">

                <label>
                  Research Notes
                </label>

                <textarea
                  rows={6}
                  value={
                    editForm.notes
                  }
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

          </div>


          <div className="nh-modal-actions">

            <button
              type="button"
              className="nh-button nh-button-secondary"
              onClick={
                cancelEditing
              }
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="nh-button nh-button-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      ) : (

        <>
          {/* =================================================
              PROFILE OVERVIEW
          ================================================= */}

          <section className="nh-cult-profile-overview">

            <div className="nh-card nh-cult-profile-main">

              <div className="nh-cult-profile-icon">
                ◇
              </div>

              <div>

                <div className="nh-command-label">
                  REGISTRY ID
                </div>

                <div className="nh-cult-profile-id">
                  {organization.id}
                </div>

                <div className="nh-cult-profile-badges">

                  <span className="nh-cult-classification">
                    {
                      organization.classification
                    }
                  </span>

                  <span className="nh-status nh-status-active">
                    {
                      organization.status
                    }
                  </span>

                </div>

              </div>

            </div>


            <div className="nh-cult-profile-stats">

              <div className="nh-card nh-cult-profile-stat">

                <div className="nh-cult-stat-label">
                  Incidents
                </div>

                <div className="nh-cult-stat-value">
                  {
                    organization.incidents
                  }
                </div>

              </div>


              <div className="nh-card nh-cult-profile-stat">

                <div className="nh-cult-stat-label">
                  Entities
                </div>

                <div className="nh-cult-stat-value">
                  {
                    organization.entities
                  }
                </div>

              </div>


              <div className="nh-card nh-cult-profile-stat">

                <div className="nh-cult-stat-label">
                  Evidence
                </div>

                <div className="nh-cult-stat-value">
                  {
                    organization.evidence
                  }
                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              PROFILE INFORMATION
          ================================================= */}

          <section className="nh-cult-profile-grid">

            <div className="nh-card nh-cult-profile-card">

              <div className="nh-cult-profile-card-title">
                Organization Information
              </div>

              <div className="nh-cult-profile-details">

                <div>
                  <span>
                    Founded
                  </span>

                  <strong>
                    {
                      organization.founded ||
                      "Unknown"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Leadership
                  </span>

                  <strong>
                    {
                      organization.leadership ||
                      "Unknown"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Locations
                  </span>

                  <strong>
                    {
                      organization.locations
                        .length
                        ? organization.locations.join(
                            ", "
                          )
                        : "Unknown"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Aliases
                  </span>

                  <strong>
                    {
                      organization.aliases
                        .length
                        ? organization.aliases.join(
                            ", "
                          )
                        : "None documented"
                    }
                  </strong>
                </div>

              </div>

            </div>


            <div className="nh-card nh-cult-profile-card">

              <div className="nh-cult-profile-card-title">
                Description
              </div>

              <p className="nh-cult-profile-text">
                {
                  organization.description ||
                  "No description has been entered for this organization."
                }
              </p>

            </div>


            <div className="nh-card nh-cult-profile-card">

              <div className="nh-cult-profile-card-title">
                Beliefs / Ideology
              </div>

              <p className="nh-cult-profile-text">
                {
                  organization.beliefs ||
                  "No beliefs or ideology have been documented."
                }
              </p>

            </div>


            <div className="nh-card nh-cult-profile-card">

              <div className="nh-cult-profile-card-title">
                Activities
              </div>

              <p className="nh-cult-profile-text">
                {
                  organization.activities ||
                  "No known activities have been documented."
                }
              </p>

            </div>


            <div className="nh-card nh-cult-profile-card nh-cult-profile-card-wide">

              <div className="nh-cult-profile-card-title">
                Research Notes
              </div>

              <p className="nh-cult-profile-text">
                {
                  organization.notes ||
                  "No research notes have been entered."
                }
              </p>

            </div>


            {/* FUTURE RELATIONSHIP AREAS */}

            <div className="nh-card nh-cult-profile-card nh-cult-profile-card-wide">

              <div className="nh-cult-profile-card-title">
                Investigative Associations
              </div>

              <div className="nh-cult-profile-placeholder-grid">

                <div>
                  <span>
                    Cases
                  </span>

                  <strong>
                    Coming Soon
                  </strong>
                </div>

                <div>
                  <span>
                    Incidents
                  </span>

                  <strong>
                    {organization.incidents}
                  </strong>
                </div>

                <div>
                  <span>
                    Entities
                  </span>

                  <strong>
                    {organization.entities}
                  </strong>
                </div>

                <div>
                  <span>
                    Evidence
                  </span>

                  <strong>
                    {organization.evidence}
                  </strong>
                </div>

              </div>

            </div>

          </section>

        </>

      )}

    </div>
  );
}

export default CultProfile;