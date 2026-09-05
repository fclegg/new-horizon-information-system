import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../firebase/config";

/* =========================================================
   OFFICIAL INVESTIGATION REPORT FORM
   ========================================================= */

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  todaysDate: new Date().toISOString().slice(0, 10),

  locationName: "",
  addressOrCoordinates: "",
  city: "",
  state: "",

  investigationDate: "",
  startTime: "",
  endTime: "",

  spiritTypes: [],

  teamName: "",

  moonPhaseLuminance: "",

  membersPresent: "",

  detailedReport: "",
};

const SPIRIT_TYPES = [
  "Ghost",
  "Demon",
  "Fallen",
  "Angel",
];

/* =========================================================
   COMPONENT
   ========================================================= */

function InvestigationReport() {
  const { caseId, reportId } = useParams();
  const navigate = useNavigate();

  const isNew = !reportId || reportId === "new";

  /* =========================================================
     CASE / INVESTIGATION DATA
     ========================================================= */

  const [caseData, setCaseData] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [existingReports, setExistingReports] = useState([]);

  const [selectedInvestigationId, setSelectedInvestigationId] =
    useState("");

  /* =========================================================
     MEMBERS
     ========================================================= */

  const [members, setMembers] = useState([]);

  /* =========================================================
     FORM
     ========================================================= */

  const [form, setForm] = useState(EMPTY_FORM);

  /* =========================================================
     PAGE STATE
     ========================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD DATA
     ========================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      if (!caseId) {
        setError("No case ID was provided.");
        return;
      }

      /* -----------------------------------------------------
         LOAD CASE
         ----------------------------------------------------- */

      const caseSnapshot = await getDoc(
        doc(db, "cases", caseId)
      );

      if (!caseSnapshot.exists()) {
        setError("This case could not be found.");
        return;
      }

      const loadedCase = {
        firestoreId: caseSnapshot.id,
        ...caseSnapshot.data(),
      };

      setCaseData(loadedCase);

      /* -----------------------------------------------------
         LOAD INVESTIGATIONS
         ----------------------------------------------------- */

      const investigationsSnapshot = await getDocs(
        query(
          collection(db, "investigations"),
          where(
            "caseFirestoreId",
            "==",
            caseId
          )
        )
      );

      const loadedInvestigations =
        investigationsSnapshot.docs
          .map((item) => ({
            firestoreId: item.id,
            ...item.data(),
          }))
          .sort(
            (a, b) =>
              (a.investigationNumber || 0) -
              (b.investigationNumber || 0)
          );

      setInvestigations(
        loadedInvestigations
      );

      /* -----------------------------------------------------
         LOAD EXISTING REPORTS
         ----------------------------------------------------- */

      const reportsSnapshot = await getDocs(
        query(
          collection(db, "investigationReports"),
          where(
            "caseFirestoreId",
            "==",
            caseId
          )
        )
      );

      const loadedReports =
        reportsSnapshot.docs.map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        }));

      setExistingReports(
        loadedReports
      );

      /* -----------------------------------------------------
         LOAD MEMBERS
         ----------------------------------------------------- */

      try {
        const membersSnapshot =
          await getDocs(
            collection(db, "members")
          );

        const loadedMembers =
          membersSnapshot.docs.map(
            (item) => ({
              firestoreId: item.id,
              ...item.data(),
            })
          );

        setMembers(
          loadedMembers
        );
      } catch (memberError) {
        console.error(
          "Error loading members:",
          memberError
        );

        setMembers([]);
      }

      /* -----------------------------------------------------
         EXISTING REPORT
         ----------------------------------------------------- */

      if (!isNew) {
        const reportSnapshot =
          await getDoc(
            doc(
              db,
              "investigationReports",
              reportId
            )
          );

        if (!reportSnapshot.exists()) {
          setError(
            "This investigation report could not be found."
          );
          return;
        }

        const report =
          reportSnapshot.data();

        if (
          report.caseFirestoreId !==
          caseId
        ) {
          setError(
            "This report does not belong to this case."
          );
          return;
        }

        setForm({
          ...EMPTY_FORM,
          ...report,
          spiritTypes:
            report.spiritTypes || [],
        });

        setSelectedInvestigationId(
          report.investigationFirestoreId ||
            ""
        );
      }

      /* -----------------------------------------------------
         NEW REPORT
         ----------------------------------------------------- */

      else {
        const firstAvailable =
          loadedInvestigations.find(
            (investigation) =>
              !investigation.investigationReportId
          );

        if (firstAvailable) {
          setSelectedInvestigationId(
            firstAvailable.firestoreId
          );

          prefillFromInvestigation(
            firstAvailable,
            loadedCase
          );
        } else {
          setForm({
            ...EMPTY_FORM,

            locationName:
              loadedCase.locationName ||
              "",

            addressOrCoordinates:
              loadedCase.address ||
              "",

            city:
              loadedCase.city ||
              "",

            state:
              loadedCase.state ||
              "",
          });
        }
      }
    } catch (err) {
      console.error(
        "Error loading investigation report:",
        err
      );

      setError(
        "Unable to load the investigation report."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     PREFILL FROM INVESTIGATION
     ========================================================= */

  function prefillFromInvestigation(
    investigation,
    loadedCase = caseData
  ) {
    const personnelNames =
      (investigation.personnelIds || [])
        .map((memberId) =>
          members.find(
            (member) =>
              member.firestoreId ===
              memberId
          )
        )
        .filter(Boolean)
        .map(
          (member) =>
            member.name || ""
        )
        .filter(Boolean);

    setForm((previous) => ({
      ...previous,

      locationName:
        investigation.locationName ||
        loadedCase?.locationName ||
        "",

      addressOrCoordinates:
        investigation.addressOrCoordinates ||
        investigation.locationAddress ||
        loadedCase?.address ||
        "",

      city:
        investigation.city ||
        loadedCase?.city ||
        "",

      state:
        investigation.state ||
        loadedCase?.state ||
        "",

      investigationDate:
        investigation.date ||
        "",

      startTime:
        investigation.startTime ||
        "",

      endTime:
        investigation.endTime ||
        "",

      teamName:
        investigation.teamName ||
        "",

      membersPresent:
        previous.membersPresent ||
        personnelNames.join(", "),
    }));
  }

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    if (caseId) {
      loadData();
    }
  }, [caseId, reportId]);

  /* =========================================================
     UPDATE FORM FIELD
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
     SPIRIT TYPE SELECTION
     ========================================================= */

  function toggleSpiritType(type) {
    setForm((previous) => ({
      ...previous,

      spiritTypes:
        previous.spiritTypes.includes(
          type
        )
          ? previous.spiritTypes.filter(
              (item) =>
                item !== type
            )
          : [
              ...previous.spiritTypes,
              type,
            ],
    }));
  }

  /* =========================================================
     INVESTIGATION SELECTION
     ========================================================= */

  function handleInvestigationChange(
    value
  ) {
    setSelectedInvestigationId(
      value
    );

    const selected =
      investigations.find(
        (investigation) =>
          investigation.firestoreId ===
          value
      );

    if (selected) {
      prefillFromInvestigation(
        selected
      );
    }
  }

  /* =========================================================
     NEXT REPORT ID
     ========================================================= */

  async function getNextReportId() {
    const snapshot =
      await getDocs(
        collection(
          db,
          "investigationReports"
        )
      );

    let highest = 0;

    snapshot.docs.forEach(
      (item) => {
        const value =
          item.data()?.reportId ||
          "";

        const match =
          value.match(
            /IRP-(\d+)/i
          );

        if (match) {
          highest = Math.max(
            highest,
            Number(match[1])
          );
        }
      }
    );

    return `IRP-${String(
      highest + 1
    ).padStart(4, "0")}`;
  }

  /* =========================================================
     SUBMIT REPORT
     ========================================================= */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    /* -------------------------------------------------------
       REQUIRED INVESTIGATION
       ------------------------------------------------------- */

    if (!selectedInvestigationId) {
      alert(
        "Please select the investigation this report belongs to."
      );

      return;
    }

    /* -------------------------------------------------------
       REQUIRED SPIRIT TYPE
       ------------------------------------------------------- */

    if (
      form.spiritTypes.length === 0
    ) {
      alert(
        "Please select at least one spirit type."
      );

      return;
    }

    /* -------------------------------------------------------
       REQUIRED NARRATIVE
       ------------------------------------------------------- */

    if (
      !form.detailedReport.trim()
    ) {
      alert(
        "Please enter the detailed report of the investigation."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      /* -----------------------------------------------------
         FIND SELECTED INVESTIGATION
         ----------------------------------------------------- */

      const selectedInvestigation =
        investigations.find(
          (item) =>
            item.firestoreId ===
            selectedInvestigationId
        );

      if (!selectedInvestigation) {
        throw new Error(
          "Selected investigation could not be found."
        );
      }

      /* -----------------------------------------------------
         CREATE NEW REPORT
         ----------------------------------------------------- */

      if (isNew) {
        /* ---------------------------------------------------
           MAXIMUM FOUR REPORTS
           --------------------------------------------------- */

        if (
          existingReports.length >=
          4
        ) {
          alert(
            "A case may have a maximum of four investigation reports."
          );

          return;
        }

        /* ---------------------------------------------------
           ONE REPORT PER INVESTIGATION
           --------------------------------------------------- */

        const alreadyHasReport =
          existingReports.some(
            (report) =>
              report.investigationFirestoreId ===
              selectedInvestigationId
          );

        if (
          alreadyHasReport ||
          selectedInvestigation.investigationReportId
        ) {
          alert(
            "This investigation already has an investigation report."
          );

          return;
        }

        /* ---------------------------------------------------
           GENERATE REPORT NUMBER
           --------------------------------------------------- */

        const nextReportId =
          await getNextReportId();

        /* ---------------------------------------------------
           CREATE REPORT RECORD
           --------------------------------------------------- */

        const reportRecord = {
          reportId:
            nextReportId,

          recordType:
            "Investigation Report",

          formId:
            "FRM-002",

          caseFirestoreId:
            caseId,

          caseId:
            caseData?.id || "",

          investigationFirestoreId:
            selectedInvestigationId,

          investigationNumber:
            selectedInvestigation.investigationNumber ||
            null,

          /* -----------------------------------------------
             OFFICIAL FORM ANSWERS
             ----------------------------------------------- */

          firstName:
            form.firstName.trim(),

          lastName:
            form.lastName.trim(),

          todaysDate:
            form.todaysDate,

          locationName:
            form.locationName.trim(),

          addressOrCoordinates:
            form.addressOrCoordinates.trim(),

          city:
            form.city.trim(),

          state:
            form.state.trim(),

          investigationDate:
            form.investigationDate,

          startTime:
            form.startTime,

          endTime:
            form.endTime,

          spiritTypes:
            form.spiritTypes,

          teamName:
            form.teamName,

          moonPhaseLuminance:
            form.moonPhaseLuminance.trim(),

          membersPresent:
            form.membersPresent.trim(),

          detailedReport:
            form.detailedReport.trim(),

          status:
            "Submitted",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        };

        const reportRef =
          await addDoc(
            collection(
              db,
              "investigationReports"
            ),
            reportRecord
          );

        /* ---------------------------------------------------
           LINK REPORT TO INVESTIGATION
           --------------------------------------------------- */

        await updateDoc(
          doc(
            db,
            "investigations",
            selectedInvestigationId
          ),
          {
            investigationReportId:
              reportRef.id,

            investigationReportNumber:
              nextReportId,

            updatedAt:
              serverTimestamp(),
          }
        );

        /* ---------------------------------------------------
           LINK REPORT TO CASE
           --------------------------------------------------- */

        const reportIds =
          caseData?.investigationReportIds ||
          [];

        await updateDoc(
          doc(
            db,
            "cases",
            caseId
          ),
          {
            investigationReportIds:
              [
                ...reportIds,
                reportRef.id,
              ],

            investigationReportCount:
              reportIds.length + 1,

            updatedAt:
              serverTimestamp(),
          }
        );
      }

      /* -----------------------------------------------------
         UPDATE EXISTING REPORT
         ----------------------------------------------------- */

      else {
        await updateDoc(
          doc(
            db,
            "investigationReports",
            reportId
          ),
          {
            firstName:
              form.firstName.trim(),

            lastName:
              form.lastName.trim(),

            todaysDate:
              form.todaysDate,

            locationName:
              form.locationName.trim(),

            addressOrCoordinates:
              form.addressOrCoordinates.trim(),

            city:
              form.city.trim(),

            state:
              form.state.trim(),

            investigationDate:
              form.investigationDate,

            startTime:
              form.startTime,

            endTime:
              form.endTime,

            spiritTypes:
              form.spiritTypes,

            teamName:
              form.teamName,

            moonPhaseLuminance:
              form.moonPhaseLuminance.trim(),

            membersPresent:
              form.membersPresent.trim(),

            detailedReport:
              form.detailedReport.trim(),

            investigationFirestoreId:
              selectedInvestigationId,

            investigationNumber:
              selectedInvestigation.investigationNumber ||
              null,

            updatedAt:
              serverTimestamp(),
          }
        );
      }

      /* -----------------------------------------------------
         RETURN TO CASE
         ----------------------------------------------------- */

      navigate(
        `/cases/${caseId}`
      );
    } catch (err) {
      console.error(
        "Error saving investigation report:",
        err
      );

      setError(
        "Unable to save the investigation report."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING SCREEN
     ========================================================= */

  if (loading) {
    return (
      <div className="nh-page nh-witness-report-page">

        <div className="nh-case-detail-loading">
          Loading investigation report...
        </div>

      </div>
    );
  }

  /* =========================================================
     CASE NOT FOUND
     ========================================================= */

  if (error && !caseData) {
    return (
      <div className="nh-page nh-witness-report-page">

        <button
          type="button"
          className="nh-secondary-button"
          onClick={() =>
            navigate(
              `/cases`
            )
          }
        >
          ← Back to Cases
        </button>

        <div className="nh-error-message">
          {error}
        </div>

      </div>
    );
  }

  /* =========================================================
     AVAILABLE INVESTIGATIONS
     ========================================================= */

  const canCreate =
    existingReports.length < 4;

  const availableInvestigations =
    investigations.filter(
      (investigation) =>
        !investigation.investigationReportId ||
        investigation.firestoreId ===
          selectedInvestigationId
    );

  /* =========================================================
     TEAM OPTIONS
     ========================================================= */

  const teamOptions = [
    ...new Set(
      [
        ...members
          .map(
            (member) =>
              member.team
          )
          .filter(Boolean),

        ...investigations
          .map(
            (investigation) =>
              investigation.teamName
          )
          .filter(Boolean),

        form.teamName,
      ].filter(Boolean)
    ),
  ];

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="nh-page nh-witness-report-page">

      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="nh-page-header">

        <div>

          <div className="nh-command-label">
            FRM-002
          </div>

          <h1>
            Investigation Report
          </h1>

          <p>
            Official investigation documentation.
          </p>

        </div>

        <button
          type="button"
          className="nh-secondary-button"
          onClick={() =>
            navigate(
              `/cases/${caseId}`
            )
          }
        >
          ← Back to Case
        </button>

      </div>

      {/* ===================================================
          ERROR
          =================================================== */}

      {error && (
        <div className="nh-error-message">
          {error}
        </div>
      )}

      {/* ===================================================
          RECORD META
          =================================================== */}

      <div className="nh-witness-report-meta">

        <div>
          <span>
            Case
          </span>

          <strong>
            {caseData?.id ||
              caseId}
          </strong>
        </div>

        <div>
          <span>
            Reports
          </span>

          <strong>
            {existingReports.length} / 4
          </strong>
        </div>

        <div>
          <span>
            Record
          </span>

          <strong>
            {isNew
              ? "New"
              : form.reportId ||
                "Existing"}
          </strong>
        </div>

        <div>
          <span>
            Status
          </span>

          <strong>
            {isNew
              ? "Draft"
              : form.status ||
                "Submitted"}
          </strong>
        </div>

      </div>

      {/* ===================================================
          FORM
          =================================================== */}

      <form
        className="nh-witness-report-card"
        onSubmit={handleSubmit}
      >

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="nh-witness-report-header">

          <div className="nh-command-label">
            FIELD FORM
          </div>

          <h2>
            Investigation Report
          </h2>

          <p>
            Complete the official report for one investigation session.
          </p>

        </div>

        {/* =================================================
            NHIS SYSTEM LINK
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            NHIS Record Link
          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field nh-form-field-wide">

              <label>
                Investigation Record
              </label>

              <select
                value={
                  selectedInvestigationId
                }
                onChange={(event) =>
                  handleInvestigationChange(
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              >

                <option value="">
                  Select investigation
                </option>

                {availableInvestigations.map(
                  (investigation) => (
                    <option
                      key={
                        investigation.firestoreId
                      }
                      value={
                        investigation.firestoreId
                      }
                    >
                      Investigation #
                      {
                        investigation.investigationNumber
                      }

                      {" — "}

                      {
                        investigation.date ||
                        "Date not recorded"
                      }

                      {investigation.teamName
                        ? ` — ${investigation.teamName}`
                        : ""}
                    </option>
                  )
                )}

              </select>

              {availableInvestigations.length ===
                0 && (
                <small className="nh-form-help">
                  All investigation records already have reports, or no investigations have been created for this case.
                </small>
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            01 — INVESTIGATOR
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            Investigator
          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field">

              <label>
                Your First Name
              </label>

              <input
                type="text"
                value={
                  form.firstName
                }
                onChange={(event) =>
                  updateField(
                    "firstName",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

            <div className="nh-form-field">

              <label>
                Your Last Name
              </label>

              <input
                type="text"
                value={
                  form.lastName
                }
                onChange={(event) =>
                  updateField(
                    "lastName",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

            <div className="nh-form-field">

              <label>
                Today's Date
              </label>

              <input
                type="date"
                value={
                  form.todaysDate
                }
                onChange={(event) =>
                  updateField(
                    "todaysDate",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

          </div>

        </div>

        {/* =================================================
            02 — LOCATION
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            Location
          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field nh-form-field-wide">

              <label>
                Location Name
              </label>

              <input
                type="text"
                value={
                  form.locationName
                }
                onChange={(event) =>
                  updateField(
                    "locationName",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
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
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

            <div className="nh-form-field">

              <label>
                City
              </label>

              <input
                type="text"
                value={
                  form.city
                }
                onChange={(event) =>
                  updateField(
                    "city",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

            <div className="nh-form-field">

              <label>
                State
              </label>

              <input
                type="text"
                value={
                  form.state
                }
                onChange={(event) =>
                  updateField(
                    "state",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

          </div>

        </div>

        {/* =================================================
            03 — INVESTIGATION
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            Investigation
          </div>

          <div className="nh-form-grid">

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
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

            <div className="nh-form-field">

              <label>
                Start Time
              </label>

              <input
                type="time"
                value={
                  form.startTime
                }
                onChange={(event) =>
                  updateField(
                    "startTime",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

            <div className="nh-form-field">

              <label>
                End Time
              </label>

              <input
                type="time"
                value={
                  form.endTime
                }
                onChange={(event) =>
                  updateField(
                    "endTime",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              />

            </div>

          </div>

        </div>

        {/* =================================================
            04 — TYPES OF SPIRITS ENCOUNTERED
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            Types of Spirit(s) Encountered
          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field nh-form-field-wide">

              <label>
                Types of Spirit(s) Encountered
              </label>

              <div className="nh-checkbox-grid">

                {SPIRIT_TYPES.map(
                  (type) => (
                    <label
                      key={type}
                      className="nh-checkbox-option"
                    >

                      <input
                        type="checkbox"
                        checked={
                          form.spiritTypes.includes(
                            type
                          )
                        }
                        onChange={() =>
                          toggleSpiritType(
                            type
                          )
                        }
                        disabled={
                          !isNew &&
                          !editing
                        }
                      />

                      <span>
                        {type}
                      </span>

                    </label>
                  )
                )}

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            05 — TEAM
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            Team
          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field nh-form-field-wide">

              <label>
                Team Name
              </label>

              <select
                value={
                  form.teamName
                }
                onChange={(event) =>
                  updateField(
                    "teamName",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                required
              >

                <option value="">
                  Select team
                </option>

                {teamOptions.map(
                  (team) => (
                    <option
                      key={team}
                      value={team}
                    >
                      {team}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

        </div>

        {/* =================================================
            06 — MOON PHASE
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            Environmental / Astronomical
          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field nh-form-field-wide">

              <label>
                Moon Phase and Luminance
              </label>

              <input
                type="text"
                value={
                  form.moonPhaseLuminance
                }
                onChange={(event) =>
                  updateField(
                    "moonPhaseLuminance",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                placeholder="Example: Waning crescent. 36% to 38%"
                required
              />

            </div>

          </div>

        </div>

        {/* =================================================
            07 — MEMBERS PRESENT
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            Personnel
          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field nh-form-field-wide">

              <label>
                Members Present
              </label>

              <textarea
                value={
                  form.membersPresent
                }
                onChange={(event) =>
                  updateField(
                    "membersPresent",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                rows="5"
                placeholder="List all members present during the investigation."
                required
              />

              <small className="nh-form-help">
                Enter the members who were physically present during this investigation.
              </small>

            </div>

          </div>

        </div>

        {/* =================================================
            08 — DETAILED REPORT
            ================================================= */}

        <div className="nh-form-section">

          <div className="nh-form-section-title">
            Investigation Narrative
          </div>

          <div className="nh-form-grid">

            <div className="nh-form-field nh-form-field-wide">

              <label>
                Detailed Report of the Investigation
              </label>

              <textarea
                value={
                  form.detailedReport
                }
                onChange={(event) =>
                  updateField(
                    "detailedReport",
                    event.target.value
                  )
                }
                disabled={
                  !isNew &&
                  !editing
                }
                rows="16"
                placeholder="Provide a detailed report of the investigation, including observations, encounters, events, responses, and relevant findings."
                required
              />

            </div>

          </div>

        </div>

        {/* =================================================
            FOOTER
            ================================================= */}

        <div className="nh-witness-report-footer">

          <span className="nh-witness-report-required">
            * Required fields
          </span>

          {!isNew &&
          !editing ? (
            <button
              type="button"
              className="nh-primary-button"
              onClick={() =>
                setEditing(true)
              }
            >
              Edit Report
            </button>
          ) : (
            <button
              type="submit"
              className="nh-primary-button"
              disabled={
                saving ||
                (isNew &&
                  !canCreate)
              }
            >
              {saving
                ? "Saving..."
                : "Submit Investigation Report"}
            </button>
          )}

        </div>

      </form>

    </div>
  );
}

export default InvestigationReport;