import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../firebase/config";

const INITIAL_FORM = {
  locationName: "",
  addressOrCoordinates: "",
  city: "",
  state: "",
  investigationDate: "",
  startTime: "",
  investigationTeam: "",

  firstName: "",
  lastName: "",
  todaysDate: "",

  preDeploymentProcedures: "",
  reconAndInitialDeployment: "",
  baselineReadings: "",
  contactingSpirits: "",
  triggerObjectsExperiments: "",
  liveDocumentation: "",
  wrapUpReviewDebrief: "",
};

function getTodaysDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function IPO() {
  const { investigationId, ipoId } = useParams();
  const navigate = useNavigate();

  const isNew = !ipoId || ipoId === "new";

  const [investigation, setInvestigation] = useState(null);
  const [caseData, setCaseData] = useState(null);

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    todaysDate: getTodaysDate(),
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD INVESTIGATION
     ========================================================= */

  useEffect(() => {
    loadInvestigation();
  }, [investigationId]);

  /* =========================================================
     LOAD EXISTING IPO
     ========================================================= */

  useEffect(() => {
    if (!isNew && ipoId) {
      loadIPO();
    }
  }, [ipoId]);

  /* =========================================================
     LOAD INVESTIGATION
     ========================================================= */

  async function loadInvestigation() {
    try {
      setLoading(true);
      setError("");

      if (!investigationId) {
        setError("No investigation ID was provided.");
        return;
      }

      const investigationRef = doc(
        db,
        "investigations",
        investigationId
      );

      const investigationSnapshot =
        await getDoc(investigationRef);

      if (!investigationSnapshot.exists()) {
        setError("This investigation could not be found.");
        return;
      }

      const loadedInvestigation = {
        firestoreId: investigationSnapshot.id,
        ...investigationSnapshot.data(),
      };

      setInvestigation(loadedInvestigation);

      /* -------------------------------------------------------
         LOAD PARENT CASE
         ------------------------------------------------------- */

      if (loadedInvestigation.caseFirestoreId) {
        const caseRef = doc(
          db,
          "cases",
          loadedInvestigation.caseFirestoreId
        );

        const caseSnapshot = await getDoc(caseRef);

        if (caseSnapshot.exists()) {
          const loadedCase = {
            firestoreId: caseSnapshot.id,
            ...caseSnapshot.data(),
          };

          setCaseData(loadedCase);

          /* ---------------------------------------------------
             PREFILL LOCATION INFORMATION
             --------------------------------------------------- */

          if (isNew) {
            setForm((previous) => ({
              ...previous,

              locationName:
                loadedCase.locationName ||
                loadedCase.name ||
                "",

              addressOrCoordinates:
                loadedCase.addressOrCoordinates ||
                loadedCase.address ||
                loadedCase.coordinates ||
                "",

              city:
                loadedCase.city ||
                "",

              state:
                loadedCase.state ||
                "",
            }));
          }
        }
      }

      /* -------------------------------------------------------
         PREFILL INVESTIGATION INFORMATION
         ------------------------------------------------------- */

      if (isNew) {
        setForm((previous) => ({
          ...previous,

          investigationDate:
            loadedInvestigation.date ||
            "",

          startTime:
            loadedInvestigation.startTime ||
            "",

          investigationTeam:
            loadedInvestigation.teamName ||
            "",
        }));
      }
    } catch (err) {
      console.error(
        "Error loading investigation:",
        err
      );

      setError(
        "Unable to load the investigation."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD EXISTING IPO
     ========================================================= */

  async function loadIPO() {
    try {
      const ipoRef = doc(
        db,
        "investigationPlans",
        ipoId
      );

      const snapshot = await getDoc(ipoRef);

      if (!snapshot.exists()) {
        setError("This IPO could not be found.");
        return;
      }

      const data = snapshot.data();

      setForm({
        ...INITIAL_FORM,
        ...data,
      });
    } catch (err) {
      console.error(
        "Error loading IPO:",
        err
      );

      setError(
        "Unable to load the investigation plan."
      );
    }
  }

  /* =========================================================
     FIELD UPDATE
     ========================================================= */

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =========================================================
     SUBMIT IPO
     ========================================================= */

  async function submitIPO(event) {
    event.preventDefault();

    if (!investigation) {
      setError(
        "The investigation could not be loaded."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      /* -------------------------------------------------------
         VALIDATION
         ------------------------------------------------------- */

      const requiredFields = [
        ["locationName", "Location Name"],
        [
          "addressOrCoordinates",
          "Location Address or Coordinates",
        ],
        ["city", "City"],
        ["state", "State"],
        [
          "investigationDate",
          "Date of Investigation",
        ],
        ["startTime", "Start Time"],
        [
          "investigationTeam",
          "Investigation Team",
        ],
        ["firstName", "Your First Name"],
        ["lastName", "Your Last Name"],
        ["todaysDate", "Today's Date"],
        [
          "preDeploymentProcedures",
          "Pre-Deployment Procedures (If Any)",
        ],
        [
          "reconAndInitialDeployment",
          "Recon and Initial Deployment / Setting Base",
        ],
        [
          "baselineReadings",
          "Baseline Readings",
        ],
        [
          "contactingSpirits",
          "Contacting Spirits",
        ],
        [
          "triggerObjectsExperiments",
          "Trigger Objects and Experiments",
        ],
        [
          "liveDocumentation",
          "Live Documentation",
        ],
        [
          "wrapUpReviewDebrief",
          "Wrap Up & Review / Debrief",
        ],
      ];

      for (const [field, label] of requiredFields) {
        if (!String(form[field] || "").trim()) {
          setError(
            `${label} is required.`
          );

          setSaving(false);
          return;
        }
      }

      /* -------------------------------------------------------
         EXISTING IPO
         ------------------------------------------------------- */

      if (!isNew) {
        await updateDoc(
          doc(
            db,
            "investigationPlans",
            ipoId
          ),
          {
            ...form,
            updatedAt: serverTimestamp(),
          }
        );

        await updateDoc(
          doc(
            db,
            "investigations",
            investigationId
          ),
          {
            ipoStatus: "Submitted",
            ipoId: ipoId,
            updatedAt: serverTimestamp(),
          }
        );

        setEditing(false);

        return;
      }

      /* -------------------------------------------------------
         PREVENT DUPLICATE IPO
         ------------------------------------------------------- */

      if (investigation.ipoId) {
        setError(
          "An IPO has already been submitted for this investigation."
        );

        setSaving(false);
        return;
      }

      /* -------------------------------------------------------
         GENERATE IPO NUMBER
         ------------------------------------------------------- */

      const existingIPOs = await getDocs(
        collection(
          db,
          "investigationPlans"
        )
      );

      let highestNumber = 0;

      existingIPOs.forEach((ipoDoc) => {
        const data = ipoDoc.data();

        const match = String(
          data.ipoId || ""
        ).match(/^IPO-(\d+)$/);

        if (match) {
          highestNumber = Math.max(
            highestNumber,
            Number(match[1])
          );
        }
      });

      const nextNumber =
        highestNumber + 1;

      const generatedIPOId =
        `IPO-${String(nextNumber).padStart(4, "0")}`;

      /* -------------------------------------------------------
         CREATE IPO RECORD
         ------------------------------------------------------- */

      const ipoRecord = {
        ipoId: generatedIPOId,

        caseFirestoreId:
          investigation.caseFirestoreId ||
          "",

        caseId:
          investigation.caseId ||
          "",

        investigationFirestoreId:
          investigationId,

        investigationNumber:
          investigation.investigationNumber ||
          null,

        ...form,

        status: "Submitted",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      const ipoRef = await addDoc(
        collection(
          db,
          "investigationPlans"
        ),
        ipoRecord
      );

      /* -------------------------------------------------------
         UPDATE INVESTIGATION
         ------------------------------------------------------- */

      await updateDoc(
        doc(
          db,
          "investigations",
          investigationId
        ),
        {
          ipoId: ipoRef.id,
          ipoStatus: "Submitted",
          ipoNumber: generatedIPOId,
          updatedAt: serverTimestamp(),
        }
      );

      navigate(
        `/investigations/${investigationId}/ipo/${ipoRef.id}`
      );
    } catch (err) {
      console.error(
        "Error saving IPO:",
        err
      );

      setError(
        "Unable to save the Investigation Plan Outline."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="nh-page nh-ipo-page">
        <div className="nh-case-detail-loading">
          Loading Investigation Plan Outline...
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
     ========================================================= */

  if (error && !investigation) {
    return (
      <div className="nh-page nh-ipo-page">
        <div className="nh-error-box">
          {error}
        </div>

        <button
          type="button"
          className="nh-secondary-button"
          onClick={() =>
            navigate(
              `/investigations/${investigationId}`
            )
          }
        >
          Back to Investigation
        </button>
      </div>
    );
  }

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="nh-page nh-ipo-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="nh-page-header">

        <div>
          <div className="nh-eyebrow">
            INVESTIGATION PLAN
          </div>

          <h1>
            Investigation Plan Outline
          </h1>

          <p>
            Structured plan of action for
            Investigation #
            {investigation?.investigationNumber ||
              "—"}
          </p>
        </div>

        <div className="nh-page-header-actions">

          <button
            type="button"
            className="nh-secondary-button"
            onClick={() =>
              navigate(
                `/investigations/${investigationId}`
              )
            }
          >
            Back to Investigation
          </button>

          {!isNew && !editing && (
            <button
              type="button"
              className="nh-primary-button"
              onClick={() =>
                setEditing(true)
              }
            >
              Edit IPO
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          STATUS
          ===================================================== */}

      {!isNew && !editing && (
        <div className="nh-ipo-status-bar">

          <div>
            <span>Status</span>
            <strong>Submitted</strong>
          </div>

          <div>
            <span>IPO ID</span>
            <strong>
              {form.ipoId || ipoId}
            </strong>
          </div>

          <div>
            <span>Investigation</span>
            <strong>
              #
              {investigation?.investigationNumber ||
                "—"}
            </strong>
          </div>

        </div>
      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="nh-error-box">
          {error}
        </div>
      )}

      <form
        onSubmit={submitIPO}
        className="nh-ipo-form"
      >

        {/* ===================================================
            INVESTIGATION INFORMATION
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                INVESTIGATION PLAN OUTLINE
              </div>

              <h2>
                Investigation Information
              </h2>

              <p>
                Basic information identifying
                the planned investigation.
              </p>
            </div>

          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field nh-form-field-wide">
              <label>
                Location Name
              </label>

              <input
                type="text"
                value={form.locationName}
                onChange={(event) =>
                  updateField(
                    "locationName",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

            <div className="nh-form-field nh-form-field-wide">
              <label>
                Location Address or Coordinates
              </label>

              <input
                type="text"
                value={
                  form.addressOrCoordinates
                }
                onChange={(event) =>
                  updateField(
                    "addressOrCoordinates",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

            <div className="nh-form-field">
              <label>City</label>

              <input
                type="text"
                value={form.city}
                onChange={(event) =>
                  updateField(
                    "city",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

            <div className="nh-form-field">
              <label>State</label>

              <input
                type="text"
                value={form.state}
                onChange={(event) =>
                  updateField(
                    "state",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

            <div className="nh-form-field">
              <label>
                Date of Investigation
              </label>

              <input
                type="date"
                value={
                  form.investigationDate
                }
                onChange={(event) =>
                  updateField(
                    "investigationDate",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

            <div className="nh-form-field">
              <label>Start Time</label>

              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  updateField(
                    "startTime",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

            <div className="nh-form-field nh-form-field-wide">
              <label>
                Investigation Team
              </label>

              <input
                type="text"
                value={
                  form.investigationTeam
                }
                onChange={(event) =>
                  updateField(
                    "investigationTeam",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

          </div>

        </div>

        {/* ===================================================
            INVESTIGATOR
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                PREPARATION
              </div>

              <h2>
                Investigator
              </h2>

            </div>

          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field">
              <label>
                Your First Name
              </label>

              <input
                type="text"
                value={form.firstName}
                onChange={(event) =>
                  updateField(
                    "firstName",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

            <div className="nh-form-field">
              <label>
                Your Last Name
              </label>

              <input
                type="text"
                value={form.lastName}
                onChange={(event) =>
                  updateField(
                    "lastName",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

            <div className="nh-form-field">
              <label>
                Today's Date
              </label>

              <input
                type="date"
                value={form.todaysDate}
                onChange={(event) =>
                  updateField(
                    "todaysDate",
                    event.target.value
                  )
                }
                disabled={!isNew && !editing}
                required
              />
            </div>

          </div>

        </div>

        {/* ===================================================
            SECTION 1
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-section-number">
            01
          </div>

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                PRE-DEPLOYMENT
              </div>

              <h2>
                Pre-Deployment Procedures
              </h2>

              <p>
                Document any procedures planned
                before deployment.
              </p>
            </div>

          </div>

          <div className="nh-form-field">

            <label>
              Pre-Deployment Procedures (If Any)
            </label>

            <textarea
              value={
                form.preDeploymentProcedures
              }
              onChange={(event) =>
                updateField(
                  "preDeploymentProcedures",
                  event.target.value
                )
              }
              disabled={!isNew && !editing}
              rows="7"
              required
            />

          </div>

        </div>

        {/* ===================================================
            SECTION 2
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-section-number">
            02
          </div>

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                RECON
              </div>

              <h2>
                Recon and Initial Deployment / Setting Base
              </h2>

              <p>
                Outline the planned reconnaissance,
                initial deployment, and base
                setup.
              </p>
            </div>

          </div>

          <div className="nh-form-field">

            <label>
              Recon and Initial Deployment / Setting Base
            </label>

            <textarea
              value={
                form.reconAndInitialDeployment
              }
              onChange={(event) =>
                updateField(
                  "reconAndInitialDeployment",
                  event.target.value
                )
              }
              disabled={!isNew && !editing}
              rows="10"
              required
            />

          </div>

        </div>

        {/* ===================================================
            SECTION 3
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-section-number">
            03
          </div>

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                BASELINE
              </div>

              <h2>
                Baseline Readings
              </h2>

              <p>
                Document the planned baseline
                readings and environmental
                checks.
              </p>
            </div>

          </div>

          <div className="nh-form-field">

            <label>
              Baseline Readings
            </label>

            <textarea
              value={
                form.baselineReadings
              }
              onChange={(event) =>
                updateField(
                  "baselineReadings",
                  event.target.value
                )
              }
              disabled={!isNew && !editing}
              rows="10"
              required
            />

          </div>

        </div>

        {/* ===================================================
            SECTION 4
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-section-number">
            04
          </div>

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                CONTACT
              </div>

              <h2>
                Contacting Spirits
              </h2>

              <p>
                Outline the planned approach to
                communication and contact.
              </p>
            </div>

          </div>

          <div className="nh-form-field">

            <label>
              Contacting Spirits
            </label>

            <textarea
              value={
                form.contactingSpirits
              }
              onChange={(event) =>
                updateField(
                  "contactingSpirits",
                  event.target.value
                )
              }
              disabled={!isNew && !editing}
              rows="10"
              required
            />

          </div>

        </div>

        {/* ===================================================
            SECTION 5
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-section-number">
            05
          </div>

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                EXPERIMENTS
              </div>

              <h2>
                Trigger Objects and Experiments
              </h2>

              <p>
                Document planned trigger objects
                and controlled experiments.
              </p>
            </div>

          </div>

          <div className="nh-form-field">

            <label>
              Trigger Objects and Experiments
            </label>

            <textarea
              value={
                form.triggerObjectsExperiments
              }
              onChange={(event) =>
                updateField(
                  "triggerObjectsExperiments",
                  event.target.value
                )
              }
              disabled={!isNew && !editing}
              rows="10"
              required
            />

          </div>

        </div>

        {/* ===================================================
            SECTION 6
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-section-number">
            06
          </div>

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                DOCUMENTATION
              </div>

              <h2>
                Live Documentation
              </h2>

              <p>
                Outline how observations,
                readings, and responses will
                be documented during the
                investigation.
              </p>
            </div>

          </div>

          <div className="nh-form-field">

            <label>
              Live Documentation
            </label>

            <textarea
              value={
                form.liveDocumentation
              }
              onChange={(event) =>
                updateField(
                  "liveDocumentation",
                  event.target.value
                )
              }
              disabled={!isNew && !editing}
              rows="10"
              required
            />

          </div>

        </div>

        {/* ===================================================
            SECTION 7
            =================================================== */}

        <div className="nh-ipo-card">

          <div className="nh-ipo-section-number">
            07
          </div>

          <div className="nh-ipo-card-header">

            <div>
              <div className="nh-eyebrow">
                CONCLUSION
              </div>

              <h2>
                Wrap Up & Review / Debrief
              </h2>

              <p>
                Outline the planned conclusion,
                review, debrief, and equipment
                return.
              </p>
            </div>

          </div>

          <div className="nh-form-field">

            <label>
              Wrap Up & Review / Debrief
            </label>

            <textarea
              value={
                form.wrapUpReviewDebrief
              }
              onChange={(event) =>
                updateField(
                  "wrapUpReviewDebrief",
                  event.target.value
                )
              }
              disabled={!isNew && !editing}
              rows="10"
              required
            />

          </div>

        </div>

        {/* ===================================================
            FOOTER
            =================================================== */}

        {(isNew || editing) && (
          <div className="nh-ipo-footer">

            <div>
              <span>
                Investigation Plan Outline
              </span>

              <strong>
                All fields are required.
              </strong>
            </div>

            <div className="nh-page-header-actions">

              <button
                type="button"
                className="nh-secondary-button"
                onClick={() => {
                  if (editing) {
                    setEditing(false);

                    if (ipoId) {
                      loadIPO();
                    }
                  } else {
                    navigate(
                      `/investigations/${investigationId}`
                    );
                  }
                }}
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
                  ? "Saving..."
                  : isNew
                    ? "Submit IPO"
                    : "Save Changes"}
              </button>

            </div>

          </div>
        )}

      </form>

      {!isNew && !editing && (
        <div className="nh-ipo-record-footer">
          <span>
            Investigation Plan Outline
          </span>

          <strong>
            {form.ipoId || ipoId}
          </strong>
        </div>
      )}

    </div>
  );
}

export default IPO;