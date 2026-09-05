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
  useSearchParams,
} from "react-router-dom";

import { db } from "../firebase/config";

const INCIDENT_TYPES = [
  "Injury / Medical Emergency",
  "Evacuation",
  "Threat / Safety Concern",
  "Property Damage",
  "Equipment Failure",
  "Suspected Possession",
  "Dangerous / Aggressive Behavior",
  "Fire / Smoke / Environmental Hazard",
  "Unauthorized Access",
  "Law Enforcement / Emergency Services",
  "Other",
];

const INVESTIGATION_STATUSES = [
  "Continued",
  "Suspended",
  "Terminated",
  "Rescheduled",
];

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  reportDate: new Date().toISOString().split("T")[0],

  caseNumber: "",
  investigationDate: "",
  investigationTeam: "",

  incidentDate: "",
  incidentTime: "",
  incidentLocation: "",
  incidentType: "",
  incidentTypeOther: "",

  membersInvolved: "",
  nonMembersInvolved: "",

  injuriesReported: "No",
  injuryDescription: "",

  incidentDescription: "",

  immediateActions: "",
  investigationSuspended: "No",
  locationEvacuated: "No",
  emergencyServicesContacted: "No",
  emergencyServices: "",
  emergencyResponse: "",

  investigationStatusFollowingIncident: "Continued",
  locationSafe: "Unknown",
  additionalSafetyMeasures: "",

  evidenceCollected: "No",
  evidenceReference: "",
  additionalDocumentation: "",

  followUpRequired: "No",
  followUpDescription: "",
  recommendedSafetyImprovements: "",

  reviewedBy: "",
  reviewDate: "",
  reviewStatus: "Pending Review",
  reviewerNotes: "",
};

function IncidentReport() {
  const navigate = useNavigate();
  const { caseId, reportId } = useParams();
  const [searchParams] = useSearchParams();

  const investigationId =
    searchParams.get("investigationId") ||
    searchParams.get("investigation") ||
    "";

  const isNew = !reportId || reportId === "new";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [caseData, setCaseData] = useState(null);
  const [investigation, setInvestigation] = useState(null);

  const [editing, setEditing] = useState(isNew);

  const [form, setForm] = useState(INITIAL_FORM);

  const [error, setError] = useState("");

  /* =========================================================
     UPDATE FIELD
  ========================================================= */

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        let loadedCase = null;
        let loadedInvestigation = null;
        let loadedReport = null;

        /* -----------------------------------------------------
           CASE
        ----------------------------------------------------- */

        if (caseId) {
          const caseSnapshot = await getDoc(
            doc(db, "cases", caseId)
          );

          if (caseSnapshot.exists()) {
            loadedCase = {
              firestoreId: caseSnapshot.id,
              ...caseSnapshot.data(),
            };

            setCaseData(loadedCase);
          }
        }

        /* -----------------------------------------------------
           INVESTIGATION
        ----------------------------------------------------- */

        if (investigationId) {
          const investigationSnapshot =
            await getDoc(
              doc(
                db,
                "investigations",
                investigationId
              )
            );

          if (investigationSnapshot.exists()) {
            loadedInvestigation = {
              firestoreId:
                investigationSnapshot.id,
              ...investigationSnapshot.data(),
            };

            setInvestigation(
              loadedInvestigation
            );
          }
        }

        /* -----------------------------------------------------
           EXISTING INCIDENT REPORT
        ----------------------------------------------------- */

        if (!isNew && reportId) {
          const reportSnapshot = await getDoc(
            doc(
              db,
              "incidentReports",
              reportId
            )
          );

          if (!reportSnapshot.exists()) {
            setError(
              "The requested incident report could not be found."
            );
            return;
          }

          loadedReport = reportSnapshot.data();
        }

        /* -----------------------------------------------------
           PREFILL
        ----------------------------------------------------- */

        setForm((previous) => ({
          ...previous,

          ...(loadedCase
            ? {
                caseNumber:
                  loadedCase.caseNumber ||
                  loadedCase.caseId ||
                  previous.caseNumber,

                incidentLocation:
                  loadedCase.locationName ||
                  loadedCase.location ||
                  previous.incidentLocation,
              }
            : {}),

          ...(loadedInvestigation
            ? {
                investigationDate:
                  loadedInvestigation.date ||
                  loadedInvestigation.investigationDate ||
                  previous.investigationDate,

                investigationTeam:
                  loadedInvestigation.teamName ||
                  loadedInvestigation.team ||
                  previous.investigationTeam,
              }
            : {}),

          ...(loadedReport || {}),
        }));
      } catch (err) {
        console.error(
          "Error loading incident report:",
          err
        );

        setError(
          "Unable to load the incident report."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [
    caseId,
    investigationId,
    reportId,
    isNew,
  ]);

  /* =========================================================
     GENERATE INCIDENT ID
  ========================================================= */

  async function generateIncidentId() {
    const snapshot = await getDocs(
      collection(db, "incidentReports")
    );

    let highestNumber = 0;

    snapshot.forEach((item) => {
      const data = item.data();

      const match = String(
        data.incidentId || ""
      ).match(/^INC-(\d+)$/);

      if (match) {
        highestNumber = Math.max(
          highestNumber,
          Number(match[1])
        );
      }
    });

    return `INC-${String(
      highestNumber + 1
    ).padStart(4, "0")}`;
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function navigateBack() {
    if (investigationId) {
      navigate(
        `/investigations/${investigationId}`
      );
      return;
    }

    if (caseId) {
      navigate(`/cases/${caseId}`);
      return;
    }

    navigate("/forms");
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function saveReport() {
    setError("");

    if (!form.firstName.trim()) {
      setError("First Name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      setError("Last Name is required.");
      return;
    }

    if (!form.reportDate) {
      setError("Today's Date is required.");
      return;
    }

    if (!form.caseNumber.trim()) {
      setError(
        "Investigation / Case Number is required."
      );
      return;
    }

    if (!form.incidentDate) {
      setError("Incident Date is required.");
      return;
    }

    if (!form.incidentType) {
      setError("Incident Type is required.");
      return;
    }

    if (
      form.incidentType === "Other" &&
      !form.incidentTypeOther.trim()
    ) {
      setError(
        "Please describe the other incident type."
      );
      return;
    }

    if (
      !form.incidentDescription.trim()
    ) {
      setError(
        "Detailed Description of the Incident is required."
      );
      return;
    }

    if (
      form.injuriesReported === "Yes" &&
      !form.injuryDescription.trim()
    ) {
      setError(
        "Please describe the injuries reported."
      );
      return;
    }

    if (
      form.emergencyServicesContacted ===
        "Yes" &&
      !form.emergencyServices.trim()
    ) {
      setError(
        "Please specify the emergency services contacted."
      );
      return;
    }

    if (
      form.followUpRequired === "Yes" &&
      !form.followUpDescription.trim()
    ) {
      setError(
        "Please describe the required follow-up."
      );
      return;
    }

    try {
      setSaving(true);

      /* =====================================================
         CREATE
      ===================================================== */

      if (isNew) {
        const incidentId =
          await generateIncidentId();

        const reportData = {
          ...form,

          incidentId,

          caseFirestoreId:
            caseId || "",

          caseId:
            caseData?.caseNumber ||
            form.caseNumber ||
            "",

          investigationFirestoreId:
            investigationId || "",

          investigationId:
            investigation?.id ||
            investigation?.investigationId ||
            investigation?.title ||
            "",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          reviewStatus:
            "Pending Review",
        };

        const reportReference =
          await addDoc(
            collection(
              db,
              "incidentReports"
            ),
            reportData
          );

        /* -----------------------------------------------------
           LINK TO CASE
        ----------------------------------------------------- */

        if (caseId) {
          const caseReference = doc(
            db,
            "cases",
            caseId
          );

          const caseSnapshot =
            await getDoc(caseReference);

          if (caseSnapshot.exists()) {
            const current =
              caseSnapshot.data();

            const existingIds =
              Array.isArray(
                current.incidentReportIds
              )
                ? current.incidentReportIds
                : [];

            const updatedIds = [
              ...new Set([
                ...existingIds,
                reportReference.id,
              ]),
            ];

            await updateDoc(
              caseReference,
              {
                incidentReportIds:
                  updatedIds,

                incidentReportCount:
                  updatedIds.length,

                updatedAt:
                  serverTimestamp(),
              }
            );
          }
        }

        /* -----------------------------------------------------
           LINK TO INVESTIGATION
        ----------------------------------------------------- */

        if (investigationId) {
          const investigationReference =
            doc(
              db,
              "investigations",
              investigationId
            );

          const investigationSnapshot =
            await getDoc(
              investigationReference
            );

          if (
            investigationSnapshot.exists()
          ) {
            const current =
              investigationSnapshot.data();

            const existingIds =
              Array.isArray(
                current.incidentReportIds
              )
                ? current.incidentReportIds
                : [];

            const updatedIds = [
              ...new Set([
                ...existingIds,
                reportReference.id,
              ]),
            ];

            await updateDoc(
              investigationReference,
              {
                incidentReportIds:
                  updatedIds,

                incidentReportCount:
                  updatedIds.length,

                updatedAt:
                  serverTimestamp(),
              }
            );
          }
        }

        navigateBack();
        return;
      }

      /* =====================================================
         UPDATE
      ===================================================== */

      await updateDoc(
        doc(
          db,
          "incidentReports",
          reportId
        ),
        {
          ...form,
          updatedAt:
            serverTimestamp(),
        }
      );

      setEditing(false);

      const refreshedSnapshot =
        await getDoc(
          doc(
            db,
            "incidentReports",
            reportId
          )
        );

      if (refreshedSnapshot.exists()) {
        setForm((previous) => ({
          ...previous,
          ...refreshedSnapshot.data(),
        }));
      }
    } catch (err) {
      console.error(
        "Error saving incident report:",
        err
      );

      setError(
        "Unable to save the incident report. Check the console for details."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DISPLAY VALUES
  ========================================================= */

  const incidentTypeDisplay =
    form.incidentType === "Other"
      ? form.incidentTypeOther ||
        "Other"
      : form.incidentType ||
        "Not specified";

  const caseDisplay =
    form.caseNumber ||
    caseData?.caseNumber ||
    "N/A";

  const investigationDisplay =
    investigation?.title ||
    investigation?.investigationId ||
    investigation?.id ||
    "N/A";

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="nh-page nh-incident-page">

        <div className="nh-incident-loading">

          <div className="nh-incident-eyebrow">
            INCIDENT DATABASE
          </div>

          <h1>
            Loading Incident Report
          </h1>

          <p>
            Retrieving official incident record...
          </p>

        </div>

      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="nh-page nh-incident-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="nh-incident-header">

        <div className="nh-incident-header-left">

          <div className="nh-incident-eyebrow">
            FRM-009 · INCIDENT REPORT
          </div>

          <h1>
            {isNew
              ? "New Incident Report"
              : form.incidentId ||
                "Incident Report"}
          </h1>

          <p>
            Formal documentation of a significant
            incident occurring during New Horizon
            operations.
          </p>

        </div>

        <div className="nh-incident-header-actions">

          {!isNew && !editing && (
            <button
              type="button"
              className="nh-incident-button nh-incident-button-primary"
              onClick={() => {
                setError("");
                setEditing(true);
              }}
            >
              Edit Report
            </button>
          )}

          <button
            type="button"
            className="nh-incident-button nh-incident-button-secondary"
            onClick={navigateBack}
          >
            ← Back
          </button>

        </div>

      </header>

      {/* =====================================================
          WARNING
      ===================================================== */}

      <div className="nh-incident-warning">

        <div className="nh-incident-warning-mark">
          !
        </div>

        <div>

          <strong>
            IMPORTANT
          </strong>

          <p>
            Use this form only for significant
            incidents requiring formal documentation.
            Minor investigative events should be
            documented in the appropriate investigation
            records.
          </p>

        </div>

      </div>

      {/* =====================================================
          RECORD METADATA
      ===================================================== */}

      <div className="nh-incident-meta">

        <div className="nh-incident-meta-item">

          <span>
            REPORT ID
          </span>

          <strong>
            {form.incidentId ||
              "PENDING"}
          </strong>

        </div>

        <div className="nh-incident-meta-item">

          <span>
            CASE
          </span>

          <strong>
            {caseDisplay}
          </strong>

        </div>

        <div className="nh-incident-meta-item">

          <span>
            INVESTIGATION
          </span>

          <strong>
            {investigationDisplay}
          </strong>

        </div>

        <div className="nh-incident-meta-item">

          <span>
            REVIEW STATUS
          </span>

          <strong>
            {form.reviewStatus}
          </strong>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="nh-incident-error">
          {error}
        </div>
      )}

      {/* =====================================================
          FORM
      ===================================================== */}

      <main className="nh-incident-form">

        {/* ===================================================
            01
        =================================================== */}

        <section className="nh-incident-section">

          <div className="nh-incident-section-heading">

            <div className="nh-incident-section-number">
              01
            </div>

            <div>

              <div className="nh-incident-section-label">
                REPORTING
              </div>

              <h2>
                Reporting Information
              </h2>

              <p>
                Identify the individual submitting the
                report and the investigation involved.
              </p>

            </div>

          </div>

          <div className="nh-incident-grid">

            <IncidentField
              label="Your First Name"
              required
              editing={editing}
              value={form.firstName}
              onChange={(value) =>
                updateField(
                  "firstName",
                  value
                )
              }
            />

            <IncidentField
              label="Your Last Name"
              required
              editing={editing}
              value={form.lastName}
              onChange={(value) =>
                updateField(
                  "lastName",
                  value
                )
              }
            />

            <IncidentField
              label="Today's Date"
              type="date"
              required
              editing={editing}
              value={form.reportDate}
              onChange={(value) =>
                updateField(
                  "reportDate",
                  value
                )
              }
            />

            <IncidentField
              label="Investigation / Case Number"
              required
              editing={editing}
              value={form.caseNumber}
              onChange={(value) =>
                updateField(
                  "caseNumber",
                  value
                )
              }
            />

            <IncidentField
              label="Investigation Date"
              type="date"
              editing={editing}
              value={form.investigationDate}
              onChange={(value) =>
                updateField(
                  "investigationDate",
                  value
                )
              }
            />

            <IncidentField
              label="Investigation Team"
              editing={editing}
              value={form.investigationTeam}
              onChange={(value) =>
                updateField(
                  "investigationTeam",
                  value
                )
              }
            />

          </div>

        </section>

        {/* ===================================================
            02
        =================================================== */}

        <section className="nh-incident-section">

          <IncidentSectionHeading
            number="02"
            label="INCIDENT"
            title="Incident Information"
            description="Record when, where, and what type of incident occurred."
          />

          <div className="nh-incident-grid">

            <IncidentField
              label="Incident Date"
              type="date"
              required
              editing={editing}
              value={form.incidentDate}
              onChange={(value) =>
                updateField(
                  "incidentDate",
                  value
                )
              }
            />

            <IncidentField
              label="Incident Time"
              type="time"
              editing={editing}
              value={form.incidentTime}
              onChange={(value) =>
                updateField(
                  "incidentTime",
                  value
                )
              }
            />

            <IncidentField
              label="Incident Location"
              full
              editing={editing}
              value={form.incidentLocation}
              onChange={(value) =>
                updateField(
                  "incidentLocation",
                  value
                )
              }
            />

            <IncidentSelect
              label="Incident Type"
              required
              editing={editing}
              value={form.incidentType}
              onChange={(value) =>
                updateField(
                  "incidentType",
                  value
                )
              }
              options={INCIDENT_TYPES}
              placeholder="Select incident type"
            />

            {form.incidentType ===
              "Other" && (
              <IncidentField
                label="Other Incident Type"
                required
                editing={editing}
                value={
                  form.incidentTypeOther
                }
                onChange={(value) =>
                  updateField(
                    "incidentTypeOther",
                    value
                  )
                }
              />
            )}

          </div>

          <div className="nh-incident-classification">

            <span>
              INCIDENT CLASSIFICATION
            </span>

            <strong>
              {incidentTypeDisplay}
            </strong>

          </div>

        </section>

        {/* ===================================================
            03
        =================================================== */}

        <section className="nh-incident-section">

          <IncidentSectionHeading
            number="03"
            label="PERSONNEL"
            title="People Involved"
            description="Identify members, witnesses, and injuries associated with the incident."
          />

          <div className="nh-incident-grid">

            <IncidentTextArea
              label="Members Involved"
              full
              editing={editing}
              value={form.membersInvolved}
              onChange={(value) =>
                updateField(
                  "membersInvolved",
                  value
                )
              }
              rows={5}
            />

            <IncidentTextArea
              label="Non-Members / Witnesses Involved"
              full
              editing={editing}
              value={
                form.nonMembersInvolved
              }
              onChange={(value) =>
                updateField(
                  "nonMembersInvolved",
                  value
                )
              }
              rows={5}
            />

            <IncidentSelect
              label="Were Any Injuries Reported?"
              editing={editing}
              value={
                form.injuriesReported
              }
              onChange={(value) =>
                updateField(
                  "injuriesReported",
                  value
                )
              }
              options={["No", "Yes"]}
            />

            {form.injuriesReported ===
              "Yes" && (
              <IncidentTextArea
                label="Describe the Injuries"
                required
                full
                editing={editing}
                value={
                  form.injuryDescription
                }
                onChange={(value) =>
                  updateField(
                    "injuryDescription",
                    value
                  )
                }
                rows={6}
              />
            )}

          </div>

        </section>

        {/* ===================================================
            04
        =================================================== */}

        <section className="nh-incident-section">

          <IncidentSectionHeading
            number="04"
            label="ACCOUNT"
            title="Incident Description"
            description="Provide a detailed factual account of the incident."
          />

          <IncidentTextArea
            label="Detailed Description of the Incident"
            required
            full
            editing={editing}
            value={
              form.incidentDescription
            }
            onChange={(value) =>
              updateField(
                "incidentDescription",
                value
              )
            }
            rows={12}
            placeholder={
              editing
                ? "Provide a detailed factual account of what occurred..."
                : ""
            }
          />

        </section>

        {/* ===================================================
            05
        =================================================== */}

        <section className="nh-incident-section">

          <IncidentSectionHeading
            number="05"
            label="RESPONSE"
            title="Response"
            description="Document actions taken in response to the incident."
          />

          <div className="nh-incident-grid">

            <IncidentTextArea
              label="Immediate Actions Taken"
              full
              editing={editing}
              value={
                form.immediateActions
              }
              onChange={(value) =>
                updateField(
                  "immediateActions",
                  value
                )
              }
              rows={6}
            />

            <IncidentSelect
              label="Was the Investigation Suspended?"
              editing={editing}
              value={
                form.investigationSuspended
              }
              onChange={(value) =>
                updateField(
                  "investigationSuspended",
                  value
                )
              }
              options={["No", "Yes"]}
            />

            <IncidentSelect
              label="Was the Location Evacuated?"
              editing={editing}
              value={
                form.locationEvacuated
              }
              onChange={(value) =>
                updateField(
                  "locationEvacuated",
                  value
                )
              }
              options={["No", "Yes"]}
            />

            <IncidentSelect
              label="Were Emergency Services Contacted?"
              editing={editing}
              value={
                form.emergencyServicesContacted
              }
              onChange={(value) =>
                updateField(
                  "emergencyServicesContacted",
                  value
                )
              }
              options={["No", "Yes"]}
            />

            {form.emergencyServicesContacted ===
              "Yes" && (
              <>
                <IncidentField
                  label="Emergency Services Contacted"
                  required
                  editing={editing}
                  value={
                    form.emergencyServices
                  }
                  onChange={(value) =>
                    updateField(
                      "emergencyServices",
                      value
                    )
                  }
                />

                <IncidentTextArea
                  label="Describe the Response to the Incident"
                  full
                  editing={editing}
                  value={
                    form.emergencyResponse
                  }
                  onChange={(value) =>
                    updateField(
                      "emergencyResponse",
                      value
                    )
                  }
                  rows={6}
                />
              </>
            )}

          </div>

        </section>

        {/* ===================================================
            06
        =================================================== */}

        <section className="nh-incident-section">

          <IncidentSectionHeading
            number="06"
            label="STATUS"
            title="Investigation Status"
            description="Record the operational status following the incident."
          />

          <div className="nh-incident-grid">

            <IncidentSelect
              label="Investigation Status Following Incident"
              editing={editing}
              value={
                form.investigationStatusFollowingIncident
              }
              onChange={(value) =>
                updateField(
                  "investigationStatusFollowingIncident",
                  value
                )
              }
              options={
                INVESTIGATION_STATUSES
              }
            />

            <IncidentSelect
              label="Was the Location Determined to Be Safe for Continued Investigation?"
              editing={editing}
              value={
                form.locationSafe
              }
              onChange={(value) =>
                updateField(
                  "locationSafe",
                  value
                )
              }
              options={[
                "Yes",
                "No",
                "Unknown",
              ]}
            />

            <IncidentTextArea
              label="Additional Safety Measures Taken"
              full
              editing={editing}
              value={
                form.additionalSafetyMeasures
              }
              onChange={(value) =>
                updateField(
                  "additionalSafetyMeasures",
                  value
                )
              }
              rows={6}
            />

          </div>

        </section>

        {/* ===================================================
            07
        =================================================== */}

        <section className="nh-incident-section">

          <IncidentSectionHeading
            number="07"
            label="EVIDENCE"
            title="Evidence & Documentation"
            description="Reference evidence or documentation associated with the incident."
          />

          <div className="nh-incident-grid">

            <IncidentSelect
              label="Was Evidence Collected or Recorded in Relation to the Incident?"
              editing={editing}
              value={
                form.evidenceCollected
              }
              onChange={(value) =>
                updateField(
                  "evidenceCollected",
                  value
                )
              }
              options={["No", "Yes"]}
            />

            <IncidentTextArea
              label="Evidence / Media Reference"
              full
              editing={editing}
              value={
                form.evidenceReference
              }
              onChange={(value) =>
                updateField(
                  "evidenceReference",
                  value
                )
              }
              rows={5}
            />

            <IncidentTextArea
              label="Additional Documentation"
              full
              editing={editing}
              value={
                form.additionalDocumentation
              }
              onChange={(value) =>
                updateField(
                  "additionalDocumentation",
                  value
                )
              }
              rows={5}
            />

          </div>

        </section>

        {/* ===================================================
            08
        =================================================== */}

        <section className="nh-incident-section">

          <IncidentSectionHeading
            number="08"
            label="FOLLOW-UP"
            title="Follow-Up"
            description="Document required follow-up and recommended safety improvements."
          />

          <div className="nh-incident-grid">

            <IncidentSelect
              label="Follow-Up Required?"
              editing={editing}
              value={
                form.followUpRequired
              }
              onChange={(value) =>
                updateField(
                  "followUpRequired",
                  value
                )
              }
              options={["No", "Yes"]}
            />

            {form.followUpRequired ===
              "Yes" && (
              <IncidentTextArea
                label="Describe Required Follow-Up"
                required
                full
                editing={editing}
                value={
                  form.followUpDescription
                }
                onChange={(value) =>
                  updateField(
                    "followUpDescription",
                    value
                  )
                }
                rows={6}
              />
            )}

            <IncidentTextArea
              label="Recommended Safety Improvements"
              full
              editing={editing}
              value={
                form.recommendedSafetyImprovements
              }
              onChange={(value) =>
                updateField(
                  "recommendedSafetyImprovements",
                  value
                )
              }
              rows={6}
            />

          </div>

        </section>

        {/* ===================================================
            09
        =================================================== */}

        <section className="nh-incident-section">

          <IncidentSectionHeading
            number="09"
            label="ADMINISTRATION"
            title="Report Review"
            description="Administrative review and disposition of the incident report."
          />

          <div className="nh-incident-grid">

            <IncidentField
              label="Reviewed By"
              editing={editing}
              value={form.reviewedBy}
              onChange={(value) =>
                updateField(
                  "reviewedBy",
                  value
                )
              }
            />

            <IncidentField
              label="Review Date"
              type="date"
              editing={editing}
              value={form.reviewDate}
              onChange={(value) =>
                updateField(
                  "reviewDate",
                  value
                )
              }
            />

            <IncidentSelect
              label="Review Status"
              editing={editing}
              value={form.reviewStatus}
              onChange={(value) =>
                updateField(
                  "reviewStatus",
                  value
                )
              }
              options={[
                "Pending Review",
                "Reviewed",
                "Action Required",
                "Closed",
              ]}
            />

            <IncidentTextArea
              label="Reviewer Notes"
              full
              editing={editing}
              value={
                form.reviewerNotes
              }
              onChange={(value) =>
                updateField(
                  "reviewerNotes",
                  value
                )
              }
              rows={6}
            />

          </div>

        </section>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="nh-incident-footer">

          <div className="nh-incident-footer-info">

            <span>
              * Required field
            </span>

            {!isNew && (
              <span>
                Report ID:{" "}
                <strong>
                  {form.incidentId ||
                    "N/A"}
                </strong>
              </span>
            )}

          </div>

          <div className="nh-incident-footer-actions">

            <button
              type="button"
              className="nh-incident-button nh-incident-button-secondary"
              onClick={() => {
                if (!isNew) {
                  setEditing(false);
                  setError("");
                } else {
                  navigateBack();
                }
              }}
              disabled={saving}
            >
              Cancel
            </button>

            {editing && (
              <button
                type="button"
                className="nh-incident-button nh-incident-button-primary"
                onClick={saveReport}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : isNew
                  ? "Submit Incident Report"
                  : "Save Changes"}
              </button>
            )}

          </div>

        </footer>

      </main>

      {!isNew && (
        <div className="nh-incident-admin-note">

          <div>
            ADMINISTRATIVE RECORD
          </div>

          <p>
            This report is maintained as part of the
            New Horizon operational record and may be
            referenced by the associated case,
            investigation, evidence, and personnel
            records.
          </p>

        </div>
      )}

    </div>
  );
}

/* ===========================================================
   SECTION HEADING
=========================================================== */

function IncidentSectionHeading({
  number,
  label,
  title,
  description,
}) {
  return (
    <div className="nh-incident-section-heading">

      <div className="nh-incident-section-number">
        {number}
      </div>

      <div>

        <div className="nh-incident-section-label">
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
   TEXT FIELD
=========================================================== */

function IncidentField({
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
      className={`nh-incident-field ${
        full
          ? "nh-incident-field-full"
          : ""
      }`}
    >

      <label>
        {label}
        {required && (
          <span className="nh-incident-required">
            {" "}*
          </span>
        )}
      </label>

      <input
        type={type}
        value={value || ""}
        disabled={!editing}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

    </div>
  );
}

/* ===========================================================
   SELECT
=========================================================== */

function IncidentSelect({
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
      className={`nh-incident-field ${
        full
          ? "nh-incident-field-full"
          : ""
      }`}
    >

      <label>
        {label}
        {required && (
          <span className="nh-incident-required">
            {" "}*
          </span>
        )}
      </label>

      <select
        value={value || ""}
        disabled={!editing}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >

        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </div>
  );
}

/* ===========================================================
   TEXT AREA
=========================================================== */

function IncidentTextArea({
  label,
  value,
  onChange,
  rows = 6,
  required = false,
  full = false,
  editing,
  placeholder,
}) {
  return (
    <div
      className={`nh-incident-field ${
        full
          ? "nh-incident-field-full"
          : ""
      }`}
    >

      <label>
        {label}
        {required && (
          <span className="nh-incident-required">
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
          onChange(event.target.value)
        }
      />

    </div>
  );
}

export default IncidentReport;