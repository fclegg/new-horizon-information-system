import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { db } from "../firebase/config";

/*
  FRM-004
  FINAL ASSESSMENT REPORT

  This is a CASE-LEVEL document.

  It is intended to be completed after all
  investigations associated with the case
  have been completed.

  The form follows the existing finalized
  Final Assessment Report.
*/

const EVIDENCE_OPTIONS = [
  "No Anomalous Evidence Captured",
  "Environmental Anomalies Detected",
  "Audio Anomalies (EVPs / Voices)",
  "Visual Anomalies (Shadows / Apparitions)",
  "Equipment Interaction",
  "Physical Sensations Reported by Team",
  "Corroborated Witness Experiences",
];

const CASE_STATUS_OPTIONS = [
  "Active",
  "Closed",
  "Unscheduled",
];

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  todaysDate: new Date()
    .toISOString()
    .split("T")[0],

  locationName: "",
  locationAddress: "",
  city: "",
  state: "",

  team: "",
  caseInvestigators: "",

  dateCaseStarted: "",
  dateCaseEnded: "",

  numberOfOnSiteInvestigations: "",
  caseStatus: "",

  locationAssessment: "",
  evidenceOverview: [],

  riskAssessment: "",

  recommendations: [],

  finalThoughts: "",
};

function FinalAssessment() {
  const navigate = useNavigate();
  const { caseId, assessmentId } =
    useParams();

  const isNew =
    !assessmentId ||
    assessmentId === "new";

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(isNew);

  const [error, setError] =
    useState("");

  const [caseData, setCaseData] =
    useState(null);

  const [investigations, setInvestigations] =
    useState([]);

  const [form, setForm] =
    useState(INITIAL_FORM);

  /* =========================================================
     FIELD UPDATE
     ========================================================= */

  function updateField(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =========================================================
     CHECKBOX TOGGLE
     ========================================================= */

  function toggleArrayValue(
    field,
    value
  ) {
    setForm((previous) => {
      const current =
        Array.isArray(previous[field])
          ? previous[field]
          : [];

      const exists =
        current.includes(value);

      return {
        ...previous,
        [field]: exists
          ? current.filter(
              (item) =>
                item !== value
            )
          : [...current, value],
      };
    });
  }

  /* =========================================================
     LOAD CASE
     ========================================================= */

  useEffect(() => {
    async function loadAssessment() {
      try {
        setLoading(true);
        setError("");

        if (!caseId) {
          setError(
            "No case was specified."
          );
          return;
        }

        /* -----------------------------------------------------
           CASE
        ----------------------------------------------------- */

        const caseSnapshot =
          await getDoc(
            doc(db, "cases", caseId)
          );

        if (!caseSnapshot.exists()) {
          setError(
            "The requested case could not be found."
          );
          return;
        }

        const loadedCase = {
          firestoreId:
            caseSnapshot.id,
          ...caseSnapshot.data(),
        };

        setCaseData(loadedCase);

        /* -----------------------------------------------------
           INVESTIGATIONS
        ----------------------------------------------------- */

        let loadedInvestigations = [];

        if (
          Array.isArray(
            loadedCase.investigationIds
          ) &&
          loadedCase.investigationIds
            .length > 0
        ) {
          const investigationResults =
            await Promise.all(
              loadedCase.investigationIds.map(
                async (id) => {
                  const snapshot =
                    await getDoc(
                      doc(
                        db,
                        "investigations",
                        id
                      )
                    );

                  if (!snapshot.exists()) {
                    return null;
                  }

                  return {
                    firestoreId:
                      snapshot.id,
                    ...snapshot.data(),
                  };
                }
              )
            );

          loadedInvestigations =
            investigationResults.filter(
              Boolean
            );
        } else {
          /*
            Fallback in case the case does not
            have investigationIds populated.
          */

          const allInvestigations =
            await getDocs(
              collection(
                db,
                "investigations"
              )
            );

          loadedInvestigations =
            allInvestigations.docs
              .map((item) => ({
                firestoreId:
                  item.id,
                ...item.data(),
              }))
              .filter(
                (item) =>
                  item.caseFirestoreId ===
                  caseId
              );
        }

        setInvestigations(
          loadedInvestigations
        );

        /* -----------------------------------------------------
           EXISTING ASSESSMENT
        ----------------------------------------------------- */

        let existingAssessment =
          null;

        if (!isNew && assessmentId) {
          const assessmentSnapshot =
            await getDoc(
              doc(
                db,
                "finalAssessments",
                assessmentId
              )
            );

          if (
            !assessmentSnapshot.exists()
          ) {
            setError(
              "The requested final assessment could not be found."
            );
            return;
          }

          existingAssessment =
            assessmentSnapshot.data();
        }

        /* -----------------------------------------------------
           DERIVED CASE INFORMATION
        ----------------------------------------------------- */

        const dates =
          loadedInvestigations
            .map(
              (item) =>
                item.date ||
                item.investigationDate
            )
            .filter(Boolean)
            .sort();

        const firstInvestigationDate =
          dates[0] || "";

        const lastInvestigationDate =
          dates[dates.length - 1] ||
          "";

        const investigatorNames =
          loadedInvestigations
            .flatMap((item) =>
              Array.isArray(
                item.personnelNames
              )
                ? item.personnelNames
                : []
            )
            .filter(Boolean);

        const investigatorText =
          [
            ...new Set(
              investigatorNames
            ),
          ].join(", ");

        const firstTeam =
          loadedInvestigations.find(
            (item) =>
              item.teamName
          )?.teamName || "";

        /* -----------------------------------------------------
           PREFILL FORM
        ----------------------------------------------------- */

        setForm((previous) => ({
          ...previous,

          locationName:
            loadedCase.locationName ||
            loadedCase.location ||
            loadedCase.name ||
            "",

          locationAddress:
            loadedCase.address ||
            loadedCase.locationAddress ||
            loadedCase.coordinates ||
            "",

          city:
            loadedCase.city || "",

          state:
            loadedCase.state || "",

          team:
            loadedCase.teamName ||
            firstTeam ||
            "",

          caseInvestigators:
            loadedCase.caseInvestigators ||
            investigatorText ||
            "",

          dateCaseStarted:
            loadedCase.dateCreated ||
            loadedCase.createdDate ||
            firstInvestigationDate ||
            "",

          dateCaseEnded:
            loadedCase.dateClosed ||
            loadedCase.closedDate ||
            lastInvestigationDate ||
            "",

          numberOfOnSiteInvestigations:
            loadedInvestigations.length ||
            "",

          caseStatus:
            loadedCase.status ||
            "",

          ...(existingAssessment || {}),
        }));
      } catch (err) {
        console.error(
          "Error loading final assessment:",
          err
        );

        setError(
          "Unable to load the final assessment."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [
    caseId,
    assessmentId,
    isNew,
  ]);

  /* =========================================================
     DETERMINE WHETHER ALL INVESTIGATIONS ARE COMPLETE
  ========================================================= */

  function isInvestigationComplete(
    investigation
  ) {
    const status =
      String(
        investigation.status || ""
      ).toLowerCase();

    return (
      status === "completed" ||
      status === "complete" ||
      status === "closed"
    );
  }

  const completedInvestigations =
    investigations.filter(
      isInvestigationComplete
    );

  const incompleteInvestigations =
    investigations.filter(
      (investigation) =>
        !isInvestigationComplete(
          investigation
        )
    );

  const allInvestigationsComplete =
    investigations.length > 0 &&
    incompleteInvestigations.length === 0;

  /* =========================================================
     GENERATE ASSESSMENT ID
  ========================================================= */

  async function generateAssessmentId() {
    const snapshot =
      await getDocs(
        collection(
          db,
          "finalAssessments"
        )
      );

    let highestNumber = 0;

    snapshot.forEach((item) => {
      const data =
        item.data();

      const match =
        String(
          data.assessmentId || ""
        ).match(
          /^ASM-(\d+)$/
        );

      if (match) {
        highestNumber =
          Math.max(
            highestNumber,
            Number(match[1])
          );
      }
    });

    return `ASM-${String(
      highestNumber + 1
    ).padStart(4, "0")}`;
  }

  /* =========================================================
     VALIDATE
  ========================================================= */

  function validateForm() {
    if (!form.firstName.trim()) {
      return "First Name is required.";
    }

    if (!form.lastName.trim()) {
      return "Last Name is required.";
    }

    if (!form.todaysDate) {
      return "Today's Date is required.";
    }

    if (!form.locationName.trim()) {
      return "Location's Name is required.";
    }

    if (
      !form.locationAddress.trim()
    ) {
      return "Location's Address or Coordinates is required.";
    }

    if (!form.city.trim()) {
      return "City is required.";
    }

    if (!form.state.trim()) {
      return "State is required.";
    }

    if (!form.team.trim()) {
      return "Team is required.";
    }

    if (
      !form.caseInvestigators.trim()
    ) {
      return "Case Investigator(s) is required.";
    }

    if (!form.dateCaseStarted) {
      return "Date Case Started is required.";
    }

    if (!form.dateCaseEnded) {
      return "Date Case Ended is required.";
    }

    if (
      !form.numberOfOnSiteInvestigations
    ) {
      return "Number of On-Site Investigations is required.";
    }

    if (!form.caseStatus) {
      return "Case Status is required.";
    }

    if (
      !form.locationAssessment.trim()
    ) {
      return "Location Assessment is required.";
    }

    if (
      !form.riskAssessment.trim()
    ) {
      return "Risk Assessment is required.";
    }

    if (
      form.evidenceOverview.length ===
      0
    ) {
      return "At least one Evidence Overview option must be selected.";
    }

    if (
      form.recommendations.length ===
      0
    ) {
      return "At least one Recommendation to Client option must be selected.";
    }

    if (
      !form.finalThoughts.trim()
    ) {
      return "Final Thoughts and Notes are required.";
    }

    return "";
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function saveAssessment() {
    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    /*
      New assessments are intended to be
      completed after all investigations
      are finished.
    */

    if (
      isNew &&
      !allInvestigationsComplete
    ) {
      setError(
        "The Final Assessment cannot be filed until all investigations associated with this case are completed."
      );
      return;
    }

    try {
      setSaving(true);

      /* =====================================================
         CREATE
      ===================================================== */

      if (isNew) {
        const newAssessmentId =
          await generateAssessmentId();

        const assessmentRecord = {
          ...form,

          assessmentId:
            newAssessmentId,

          caseFirestoreId:
            caseId,

          caseId:
            caseData?.caseNumber ||
            caseData?.caseId ||
            "",

          investigationIds:
            investigations.map(
              (item) =>
                item.firestoreId
            ),

          investigationCount:
            investigations.length,

          completedInvestigationCount:
            completedInvestigations.length,

          filedBy:
            `${form.firstName.trim()} ${form.lastName.trim()}`,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        };

        const assessmentReference =
          await addDoc(
            collection(
              db,
              "finalAssessments"
            ),
            assessmentRecord
          );

        /* -----------------------------------------------------
           UPDATE CASE
        ----------------------------------------------------- */

        await updateDoc(
          doc(
            db,
            "cases",
            caseId
          ),
          {
            finalAssessmentId:
              assessmentReference.id,

            finalAssessmentStatus:
              "Filed",

            finalAssessmentCount: 1,

            finalAssessmentFiledAt:
              serverTimestamp(),

            finalAssessmentFiledBy:
              `${form.firstName.trim()} ${form.lastName.trim()}`,

            updatedAt:
              serverTimestamp(),
          }
        );

        /*
          The assessment itself is the closing
          document. We do NOT automatically force
          the case status to Closed because the
          Team Lead should decide that through the
          Case Status field.
        */

        navigate(
          `/cases/${caseId}`
        );

        return;
      }

      /* =====================================================
         UPDATE
      ===================================================== */

      await updateDoc(
        doc(
          db,
          "finalAssessments",
          assessmentId
        ),
        {
          ...form,

          updatedAt:
            serverTimestamp(),
        }
      );

      await updateDoc(
        doc(
          db,
          "cases",
          caseId
        ),
        {
          finalAssessmentId:
            assessmentId,

          finalAssessmentStatus:
            "Filed",

          updatedAt:
            serverTimestamp(),
        }
      );

      setEditing(false);
    } catch (err) {
      console.error(
        "Error saving final assessment:",
        err
      );

      setError(
        "Unable to save the Final Assessment."
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
      <div className="nh-page nh-final-assessment-page">

        <div className="nh-final-assessment-loading">

          <div className="nh-final-eyebrow">
            FRM-004 · FINAL ASSESSMENT
          </div>

          <h1>
            Loading Final Assessment
          </h1>

          <p>
            Loading case records and investigation history...
          </p>

        </div>

      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="nh-page nh-final-assessment-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="nh-final-header">

        <div>

          <div className="nh-final-eyebrow">
            FRM-004 · CASE CLOSURE DOCUMENT
          </div>

          <h1>
            Final Assessment Report
          </h1>

          <p>
            Final assessment of the case following
            completion of all associated investigations.
          </p>

        </div>

        <div className="nh-final-header-actions">

          {!isNew && !editing && (
            <button
              type="button"
              className="nh-final-button nh-final-button-primary"
              onClick={() => {
                setError("");
                setEditing(true);
              }}
            >
              Edit Assessment
            </button>
          )}

          <button
            type="button"
            className="nh-final-button nh-final-button-secondary"
            onClick={() =>
              navigate(
                `/cases/${caseId}`
              )
            }
          >
            ← Back to Case
          </button>

        </div>

      </header>

      {/* =====================================================
          COMPLETION STATUS
      ===================================================== */}

      <div
        className={`nh-final-readiness ${
          allInvestigationsComplete
            ? "nh-final-readiness-ready"
            : "nh-final-readiness-warning"
        }`}
      >

        <div className="nh-final-readiness-icon">
          {allInvestigationsComplete
            ? "✓"
            : "!"}
        </div>

        <div>

          <strong>
            {allInvestigationsComplete
              ? "ALL INVESTIGATIONS COMPLETE"
              : "CASE NOT READY FOR FINAL ASSESSMENT"}
          </strong>

          <p>
            {allInvestigationsComplete
              ? `${completedInvestigations.length} of ${investigations.length} investigations are complete. The case is ready for Team Lead assessment.`
              : investigations.length === 0
              ? "No investigations are currently associated with this case."
              : `${completedInvestigations.length} of ${investigations.length} investigations are complete. All investigations must be completed before this assessment can be filed.`}
          </p>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="nh-final-error">
          {error}
        </div>
      )}

      {/* =====================================================
          FORM
      ===================================================== */}

      <main className="nh-final-form">

        {/* ===================================================
            01 — IDENTIFICATION
        =================================================== */}

        <section className="nh-final-section">

          <FinalSectionHeading
            number="01"
            label="IDENTIFICATION"
            title="Report Information"
            description="Identify the Team Lead completing the final assessment and the location associated with the case."
          />

          <div className="nh-final-grid">

            <FinalField
              label="First Name"
              required
              value={form.firstName}
              editing={editing}
              onChange={(value) =>
                updateField(
                  "firstName",
                  value
                )
              }
            />

            <FinalField
              label="Last Name"
              required
              value={form.lastName}
              editing={editing}
              onChange={(value) =>
                updateField(
                  "lastName",
                  value
                )
              }
            />

            <FinalField
              label="Today's Date"
              type="date"
              required
              value={form.todaysDate}
              editing={editing}
              onChange={(value) =>
                updateField(
                  "todaysDate",
                  value
                )
              }
            />

            <FinalField
              label="Location's Name"
              required
              value={form.locationName}
              editing={editing}
              onChange={(value) =>
                updateField(
                  "locationName",
                  value
                )
              }
            />

            <FinalField
              label="Location's Address or Coordinates"
              required
              full
              value={
                form.locationAddress
              }
              editing={editing}
              onChange={(value) =>
                updateField(
                  "locationAddress",
                  value
                )
              }
            />

          </div>

        </section>

        {/* ===================================================
            02 — CASE INFORMATION
        =================================================== */}

        <section className="nh-final-section">

          <FinalSectionHeading
            number="02"
            label="CASE"
            title="Case Information"
            description="Summarize the case history and investigation activity."
          />

          <div className="nh-final-grid">

            <FinalField
              label="City"
              required
              value={form.city}
              editing={editing}
              onChange={(value) =>
                updateField(
                  "city",
                  value
                )
              }
            />

            <FinalField
              label="State"
              required
              value={form.state}
              editing={editing}
              onChange={(value) =>
                updateField(
                  "state",
                  value
                )
              }
            />

            <FinalField
              label="Team"
              required
              value={form.team}
              editing={editing}
              onChange={(value) =>
                updateField(
                  "team",
                  value
                )
              }
            />

            <FinalField
              label="Case Investigator(s)"
              required
              value={
                form.caseInvestigators
              }
              editing={editing}
              onChange={(value) =>
                updateField(
                  "caseInvestigators",
                  value
                )
              }
            />

            <FinalField
              label="Date Case Started"
              type="date"
              required
              value={
                form.dateCaseStarted
              }
              editing={editing}
              onChange={(value) =>
                updateField(
                  "dateCaseStarted",
                  value
                )
              }
            />

            <FinalField
              label="Date Case Ended"
              type="date"
              required
              value={
                form.dateCaseEnded
              }
              editing={editing}
              onChange={(value) =>
                updateField(
                  "dateCaseEnded",
                  value
                )
              }
            />

            <FinalField
              label="Number of On-Site Investigations"
              type="number"
              required
              value={
                form.numberOfOnSiteInvestigations
              }
              editing={editing}
              onChange={(value) =>
                updateField(
                  "numberOfOnSiteInvestigations",
                  value
                )
              }
            />

            <FinalSelect
              label="Case Status"
              required
              value={
                form.caseStatus
              }
              editing={editing}
              options={
                CASE_STATUS_OPTIONS
              }
              onChange={(value) =>
                updateField(
                  "caseStatus",
                  value
                )
              }
              placeholder="Select case status"
            />

          </div>

        </section>

        {/* ===================================================
            03 — LOCATION ASSESSMENT
        =================================================== */}

        <section className="nh-final-section">

          <FinalSectionHeading
            number="03"
            label="ASSESSMENT"
            title="Location Assessment"
            description="Record the Team Lead's final assessment of the location."
          />

          <FinalTextArea
            label="Location Assessment"
            required
            full
            rows={9}
            value={
              form.locationAssessment
            }
            editing={editing}
            onChange={(value) =>
              updateField(
                "locationAssessment",
                value
              )
            }
            placeholder={
              editing
                ? "Provide the final assessment of the location based on the completed investigations..."
                : ""
            }
          />

        </section>

        {/* ===================================================
            04 — EVIDENCE OVERVIEW
        =================================================== */}

        <section className="nh-final-section">

          <FinalSectionHeading
            number="04"
            label="EVIDENCE"
            title="Evidence Overview: (Most Active)"
            description="Select the evidence categories that were most active across the completed case investigations."
          />

          <div className="nh-final-check-grid">

            {EVIDENCE_OPTIONS.map(
              (option) => (
                <FinalCheckbox
                  key={option}
                  label={option}
                  checked={form.evidenceOverview.includes(
                    option
                  )}
                  editing={editing}
                  onChange={() =>
                    toggleArrayValue(
                      "evidenceOverview",
                      option
                    )
                  }
                />
              )
            )}

          </div>

        </section>

        {/* ===================================================
            05 — RISK ASSESSMENT
        =================================================== */}

        <section className="nh-final-section">

          <FinalSectionHeading
            number="05"
            label="RISK"
            title="Risk Assessment"
            description="Record the final risk assessment for the location."
          />

          <FinalTextArea
            label="Risk Assessment"
            required
            full
            rows={8}
            value={
              form.riskAssessment
            }
            editing={editing}
            onChange={(value) =>
              updateField(
                "riskAssessment",
                value
              )
            }
            placeholder={
              editing
                ? "Record the final risk assessment based on the completed case..."
                : ""
            }
          />

        </section>

        {/* ===================================================
            06 — RECOMMENDATION
        =================================================== */}

        <section className="nh-final-section">

          <FinalSectionHeading
            number="06"
            label="CLIENT"
            title="Recommendation to Client"
            description="Select the recommendations appropriate to the client's final case disposition."
          />

          <div className="nh-final-check-grid">

            <FinalCheckbox
              label="No Action Required"
              checked={form.recommendations.includes(
                "No Action Required"
              )}
              editing={editing}
              onChange={() =>
                toggleArrayValue(
                  "recommendations",
                  "No Action Required"
                )
              }
            />

            <FinalCheckbox
              label="Environmental Changes Recommended"
              checked={form.recommendations.includes(
                "Environmental Changes Recommended"
              )}
              editing={editing}
              onChange={() =>
                toggleArrayValue(
                  "recommendations",
                  "Environmental Changes Recommended"
                )
              }
            />

            <FinalCheckbox
              label="Monitoring / Documentation Suggested"
              checked={form.recommendations.includes(
                "Monitoring / Documentation Suggested"
              )}
              editing={editing}
              onChange={() =>
                toggleArrayValue(
                  "recommendations",
                  "Monitoring / Documentation Suggested"
                )
              }
            />

            <FinalCheckbox
              label="Spiritual / Religious Consultation (Optional)"
              checked={form.recommendations.includes(
                "Spiritual / Religious Consultation (Optional)"
              )}
              editing={editing}
              onChange={() =>
                toggleArrayValue(
                  "recommendations",
                  "Spiritual / Religious Consultation (Optional)"
                )
              }
            />

            <FinalCheckbox
              label="Follow-Up Investigation Offered"
              checked={form.recommendations.includes(
                "Follow-Up Investigation Offered"
              )}
              editing={editing}
              onChange={() =>
                toggleArrayValue(
                  "recommendations",
                  "Follow-Up Investigation Offered"
                )
              }
            />

            <FinalCheckbox
              label="Referral to External Specialist"
              checked={form.recommendations.includes(
                "Referral to External Specialist"
              )}
              editing={editing}
              onChange={() =>
                toggleArrayValue(
                  "recommendations",
                  "Referral to External Specialist"
                )
              }
            />

          </div>

        </section>

        {/* ===================================================
            07 — FINAL THOUGHTS
        =================================================== */}

        <section className="nh-final-section">

          <FinalSectionHeading
            number="07"
            label="FINAL DETERMINATION"
            title="Final Thoughts and Notes"
            description="Provide the Team Lead's final interpretation of the case and any further plan of action."
          />

          <FinalTextArea
            label="Final Thoughts and Notes"
            required
            full
            rows={14}
            value={
              form.finalThoughts
            }
            editing={editing}
            onChange={(value) =>
              updateField(
                "finalThoughts",
                value
              )
            }
            placeholder={
              editing
                ? "Summarize what you believe is occurring at the location based on the completed investigations, evidence, witness information, and the recommended plan of action..."
                : ""
            }
          />

        </section>

        {/* ===================================================
            CASE INVESTIGATION SUMMARY
        =================================================== */}

        <section className="nh-final-section nh-final-summary-section">

          <FinalSectionHeading
            number="08"
            label="SYSTEM RECORD"
            title="Investigation Completion Summary"
            description="System-generated summary of the investigations associated with this case."
          />

          <div className="nh-final-summary-grid">

            <div className="nh-final-summary-card">

              <span>
                TOTAL INVESTIGATIONS
              </span>

              <strong>
                {investigations.length}
              </strong>

            </div>

            <div className="nh-final-summary-card">

              <span>
                COMPLETED
              </span>

              <strong>
                {completedInvestigations.length}
              </strong>

            </div>

            <div className="nh-final-summary-card">

              <span>
                REMAINING
              </span>

              <strong>
                {incompleteInvestigations.length}
              </strong>

            </div>

          </div>

          {investigations.length > 0 && (
            <div className="nh-final-investigation-list">

              {investigations.map(
                (investigation, index) => {

                  const complete =
                    isInvestigationComplete(
                      investigation
                    );

                  return (
                    <div
                      key={
                        investigation.firestoreId ||
                        index
                      }
                      className="nh-final-investigation-row"
                    >

                      <div>

                        <strong>
                          {investigation.title ||
                            `Investigation #${
                              investigation.investigationNumber ||
                              index + 1
                            }`}
                        </strong>

                        <span>
                          {investigation.date ||
                            "No date recorded"}
                        </span>

                      </div>

                      <span
                        className={
                          complete
                            ? "nh-final-status-complete"
                            : "nh-final-status-open"
                        }
                      >
                        {complete
                          ? "Completed"
                          : investigation.status ||
                            "Incomplete"}
                      </span>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="nh-final-footer">

          <div className="nh-final-footer-info">

            <span>
              * Required field
            </span>

            <span>
              {isNew
                ? "New Final Assessment"
                : `Assessment: ${
                    form.assessmentId ||
                    assessmentId
                  }`}
            </span>

          </div>

          <div className="nh-final-footer-actions">

            <button
              type="button"
              className="nh-final-button nh-final-button-secondary"
              disabled={saving}
              onClick={() => {
                if (!isNew) {
                  setEditing(false);
                  setError("");
                } else {
                  navigate(
                    `/cases/${caseId}`
                  );
                }
              }}
            >
              Cancel
            </button>

            {editing && (
              <button
                type="button"
                className="nh-final-button nh-final-button-primary"
                disabled={
                  saving ||
                  (isNew &&
                    !allInvestigationsComplete)
                }
                onClick={
                  saveAssessment
                }
              >
                {saving
                  ? "Saving..."
                  : isNew
                  ? "Submit Final Assessment"
                  : "Save Changes"}
              </button>
            )}

          </div>

        </footer>

      </main>

    </div>
  );
}

/* ===========================================================
   SECTION HEADING
=========================================================== */

function FinalSectionHeading({
  number,
  label,
  title,
  description,
}) {
  return (
    <div className="nh-final-section-heading">

      <div className="nh-final-section-number">
        {number}
      </div>

      <div>

        <div className="nh-final-section-label">
          {label}
        </div>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}

/* ===========================================================
   FIELD
=========================================================== */

function FinalField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  full = false,
  editing,
}) {
  return (
    <div
      className={`nh-final-field ${
        full
          ? "nh-final-field-full"
          : ""
      }`}
    >

      <label>
        {label}

        {required && (
          <span className="nh-final-required">
            {" "}*
          </span>
        )}
      </label>

      <input
        type={type}
        value={value ?? ""}
        disabled={!editing}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </div>
  );
}

/* ===========================================================
   SELECT
=========================================================== */

function FinalSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  full = false,
  editing,
  placeholder,
}) {
  return (
    <div
      className={`nh-final-field ${
        full
          ? "nh-final-field-full"
          : ""
      }`}
    >

      <label>
        {label}

        {required && (
          <span className="nh-final-required">
            {" "}*
          </span>
        )}
      </label>

      <select
        value={value || ""}
        disabled={!editing}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >

        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}

      </select>

    </div>
  );
}

/* ===========================================================
   TEXT AREA
=========================================================== */

function FinalTextArea({
  label,
  value,
  onChange,
  rows = 7,
  required = false,
  full = false,
  editing,
  placeholder,
}) {
  return (
    <div
      className={`nh-final-field ${
        full
          ? "nh-final-field-full"
          : ""
      }`}
    >

      <label>
        {label}

        {required && (
          <span className="nh-final-required">
            {" "}*
          </span>
        )}
      </label>

      <textarea
        rows={rows}
        value={value || ""}
        disabled={!editing}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </div>
  );
}

/* ===========================================================
   CHECKBOX
=========================================================== */

function FinalCheckbox({
  label,
  checked,
  onChange,
  editing,
}) {
  return (
    <label
      className={`nh-final-checkbox ${
        !editing
          ? "nh-final-checkbox-disabled"
          : ""
      }`}
    >

      <input
        type="checkbox"
        checked={checked}
        disabled={!editing}
        onChange={onChange}
      />

      <span className="nh-final-checkbox-box">
        {checked ? "✓" : ""}
      </span>

      <span>
        {label}
      </span>

    </label>
  );
}

export default FinalAssessment;