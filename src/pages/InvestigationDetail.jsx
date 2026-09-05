import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../firebase/config";

function InvestigationDetail() {
  const navigate = useNavigate();
  const { investigationId } = useParams();

  const [investigation, setInvestigation] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  const [newNote, setNewNote] = useState("");

  const [editInvestigation, setEditInvestigation] = useState(null);

  /* =========================================================
     LOAD INVESTIGATION
     ========================================================= */

  const loadInvestigation = async () => {
    try {
      setLoading(true);
      setError("");

      const investigationRef = doc(
        db,
        "investigations",
        investigationId
      );

      const investigationSnapshot =
        await getDoc(investigationRef);

      if (!investigationSnapshot.exists()) {
        setInvestigation(null);
        setError(
          "Investigation record could not be found."
        );
        return;
      }

      const investigationData = {
        firestoreId: investigationSnapshot.id,
        ...investigationSnapshot.data(),
      };

      setInvestigation(investigationData);

      setEditInvestigation({
        investigationNumber:
          investigationData.investigationNumber || "",

        date:
          investigationData.date || "",

        startTime:
          investigationData.startTime || "",

        endTime:
          investigationData.endTime || "",

        team:
          investigationData.team ||
          investigationData.teamName ||
          "Investigation",

        leadInvestigator:
          investigationData.leadInvestigator || "",

        status:
          investigationData.status || "Scheduled",

        debrief:
          typeof investigationData.debrief === "string"
            ? investigationData.debrief
            : "",
      });

      /* =====================================================
         LOAD PARENT CASE
         ===================================================== */

      const parentCaseId =
        investigationData.caseFirestoreId ||
        investigationData.caseId;

      if (parentCaseId) {
        const caseRef = doc(
          db,
          "cases",
          parentCaseId
        );

        const caseSnapshot =
          await getDoc(caseRef);

        if (caseSnapshot.exists()) {
          setCaseData({
            firestoreId: caseSnapshot.id,
            ...caseSnapshot.data(),
          });
        }
      } else {
        setCaseData(null);
      }

      /* =====================================================
         LOAD MEMBERS
         ===================================================== */

      const membersSnapshot =
        await getDocs(
          collection(db, "members")
        );

      const loadedMembers =
        membersSnapshot.docs.map(
          (memberDoc) => ({
            firestoreId: memberDoc.id,
            ...memberDoc.data(),
          })
        );

      setMembers(loadedMembers);
    } catch (err) {
      console.error(
        "Error loading investigation:",
        err
      );

      setError(
        "Unable to load this investigation."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investigationId) {
      loadInvestigation();
    }
  }, [investigationId]);

  /* =========================================================
     FORMAT DATE
     ========================================================= */

  const formatDate = (value) => {
    if (!value) {
      return "N/A";
    }

    if (
      typeof value === "object" &&
      value?.toDate
    ) {
      return value
        .toDate()
        .toLocaleDateString();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  };

  /* =========================================================
     GET PARENT CASE ID
     ========================================================= */

  const getParentCaseId = () => {
    return (
      investigation?.caseFirestoreId ||
      investigation?.caseId ||
      caseData?.firestoreId ||
      null
    );
  };

  /* =========================================================
     IPO NAVIGATION
     ========================================================= */

  const handleIPO = () => {
    if (!investigation?.firestoreId) {
      return;
    }

    if (investigation.ipoId) {
      navigate(
        `/investigations/${investigation.firestoreId}/ipo/${investigation.ipoId}`
      );
    } else {
      navigate(
        `/investigations/${investigation.firestoreId}/ipo/new`
      );
    }
  };

  /* =========================================================
     PROPERTY ACCESS NAVIGATION
     ========================================================= */

  const handlePropertyAccess = () => {
    /*
      Property Access has not yet been given its own
      form page/route in the current system.

      If a propertyAccessId exists in the future,
      this handler will open the existing record.

      Otherwise, send the user to the Forms registry
      rather than accidentally opening an Incident Report.
    */

    if (investigation?.propertyAccessId) {
      navigate(
        `/cases/${getParentCaseId()}/property-access/${investigation.propertyAccessId}`
      );
      return;
    }

    navigate("/forms");
  };

  /* =========================================================
     WITNESS REPORT NAVIGATION
     ========================================================= */

  const handleWitnessReports = () => {
    const parentCaseId = getParentCaseId();

    if (!parentCaseId) {
      setError(
        "This investigation is not linked to a case."
      );
      return;
    }

    /*
      If the investigation has directly linked witness
      reports, open the first linked report.

      Otherwise, create a new witness report from the
      parent case.
    */

    if (
      Array.isArray(
        investigation?.witnessReportIds
      ) &&
      investigation.witnessReportIds.length > 0
    ) {
      navigate(
        `/cases/${parentCaseId}/witness-reports/${investigation.witnessReportIds[0]}`
      );
      return;
    }

    navigate(
      `/cases/${parentCaseId}/witness-reports/new?investigationId=${investigation.firestoreId}`
    );
  };

  /* =========================================================
     INCIDENT REPORT NAVIGATION
     ========================================================= */

  const handleIncidentReport = () => {
    const parentCaseId = getParentCaseId();

    if (!parentCaseId) {
      setError(
        "This investigation is not linked to a case."
      );
      return;
    }

    if (
      Array.isArray(
        investigation?.incidentReportIds
      ) &&
      investigation.incidentReportIds.length > 0
    ) {
      navigate(
        `/cases/${parentCaseId}/incident-reports/${investigation.incidentReportIds[0]}?investigationId=${investigation.firestoreId}`
      );
      return;
    }

    navigate(
      `/cases/${parentCaseId}/incident-reports/new?investigationId=${investigation.firestoreId}`
    );
  };

  /* =========================================================
     INVESTIGATION REPORT NAVIGATION
     ========================================================= */

  const handleInvestigationReport = () => {
    if (!investigation?.firestoreId) {
      return;
    }

    const parentCaseId = getParentCaseId();

    if (!parentCaseId) {
      setError(
        "This investigation is not linked to a case."
      );
      return;
    }

    if (
      investigation.investigationReportId
    ) {
      navigate(
        `/cases/${parentCaseId}/investigation-reports/${investigation.investigationReportId}`
      );
    } else {
      navigate(
        `/cases/${parentCaseId}/investigation-reports/new?investigationId=${investigation.firestoreId}`
      );
    }
  };

  /* =========================================================
     SAVE INVESTIGATION
     ========================================================= */

  const handleSaveInvestigation = async () => {
    if (!editInvestigation?.date) {
      setError(
        "Investigation date is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const investigationRef = doc(
        db,
        "investigations",
        investigationId
      );

      const updatedRecord = {
        investigationNumber:
          editInvestigation.investigationNumber,

        date:
          editInvestigation.date,

        startTime:
          editInvestigation.startTime,

        endTime:
          editInvestigation.endTime,

        team:
          editInvestigation.team,

        leadInvestigator:
          editInvestigation.leadInvestigator,

        status:
          editInvestigation.status,

        debrief:
          editInvestigation.debrief,

        updatedAt:
          serverTimestamp(),
      };

      await updateDoc(
        investigationRef,
        updatedRecord
      );

      setInvestigation((current) => ({
        ...current,
        ...updatedRecord,
        updatedAt: new Date(),
      }));

      setShowEdit(false);
    } catch (err) {
      console.error(
        "Error saving investigation:",
        err
      );

      setError(
        "Unable to save investigation changes."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     ADD INVESTIGATION NOTE
     ========================================================= */

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const noteText = newNote.trim();

      const noteRecord = {
        investigationId,

        text:
          noteText,

        createdAt:
          serverTimestamp(),
      };

      const noteRef = await addDoc(
        collection(
          db,
          "investigationNotes"
        ),
        noteRecord
      );

      const currentNotes =
        Array.isArray(
          investigation.notes
        )
          ? investigation.notes
          : [];

      const updatedNotes = [
        ...currentNotes,
        {
          id: noteRef.id,
          text: noteText,
          createdAt: new Date(),
        },
      ];

      await updateDoc(
        doc(
          db,
          "investigations",
          investigationId
        ),
        {
          notes: updatedNotes,
          updatedAt: serverTimestamp(),
        }
      );

      setInvestigation((current) => ({
        ...current,
        notes: updatedNotes,
      }));

      setNewNote("");
      setShowAddNote(false);
    } catch (err) {
      console.error(
        "Error adding note:",
        err
      );

      setError(
        "Unable to add investigation note."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     GET ASSIGNED PERSONNEL
     ========================================================= */

  const assignedMemberIds =
    Array.isArray(
      investigation?.memberIds
    )
      ? investigation.memberIds
      : Array.isArray(
          investigation?.personnelIds
        )
        ? investigation.personnelIds
        : [];

  const assignedMembers =
    members.filter((member) =>
      assignedMemberIds.includes(
        member.firestoreId
      )
    );

  /* =========================================================
     COUNTS
     ========================================================= */

  const evidenceCount =
    Array.isArray(
      investigation?.evidenceIds
    )
      ? investigation.evidenceIds.length
      : 0;

  const witnessReportCount =
    Array.isArray(
      investigation?.witnessReportIds
    )
      ? investigation.witnessReportIds.length
      : 0;

  const incidentReportCount =
    Array.isArray(
      investigation?.incidentReportIds
    )
      ? investigation.incidentReportIds.length
      : 0;

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="nh-page">
        <div className="nh-loading-state">
          Loading investigation record...
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
     ========================================================= */

  if (!investigation) {
    return (
      <div className="nh-page">

        <div className="nh-page-header">

          <div>

            <div className="nh-command-label">
              INVESTIGATION DATABASE
            </div>

            <h1 className="nh-page-title">
              Investigation Not Found
            </h1>

            <p className="nh-page-subtitle">
              The requested investigation record could not
              be located.
            </p>

          </div>

          <button
            className="nh-button nh-button-secondary"
            onClick={() =>
              navigate("/cases")
            }
          >
            ← Cases
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
    <div className="nh-page nh-investigation-detail-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="nh-page-header">

        <div>

          <div className="nh-command-label">
            INVESTIGATION RECORD
          </div>

          <h1 className="nh-page-title">
            {investigation.investigationNumber ||
              "Investigation"}
          </h1>

          <p className="nh-page-subtitle">
            {caseData?.name ||
              "Unassigned Case"}
          </p>

        </div>

        <div className="nh-member-profile-actions">

          {caseData && (
            <button
              className="nh-button nh-button-secondary"
              onClick={() =>
                navigate(
                  `/cases/${caseData.firestoreId}`
                )
              }
            >
              ← Case File
            </button>
          )}

          <button
            className="nh-button nh-button-primary"
            onClick={() => {
              setError("");
              setShowEdit(true);
            }}
          >
            Edit Investigation
          </button>

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
          STATUS BAR
          ===================================================== */}

      <div className="nh-member-profile-status-bar">

        <div>

          <span>
            STATUS
          </span>

          <strong>
            {investigation.status ||
              "Scheduled"}
          </strong>

        </div>

        <div>

          <span>
            DATE
          </span>

          <strong>
            {formatDate(
              investigation.date
            )}
          </strong>

        </div>

        <div>

          <span>
            START / END
          </span>

          <strong>
            {investigation.startTime ||
              "--:--"}
            {" — "}
            {investigation.endTime ||
              "--:--"}
          </strong>

        </div>

        <div>

          <span>
            TEAM
          </span>

          <strong>
            {investigation.team ||
              investigation.teamName ||
              "N/A"}
          </strong>

        </div>

      </div>

      {/* =====================================================
          INVESTIGATION OVERVIEW
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              OVERVIEW
            </div>

            <h2>
              Investigation Information
            </h2>

            <p>
              Core information for this investigation.
            </p>

          </div>

        </div>

        <div className="nh-profile-grid">

          <div className="nh-profile-field">

            <span>
              INVESTIGATION NUMBER
            </span>

            <strong>
              {investigation.investigationNumber ||
                "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              CASE
            </span>

            <strong>
              {caseData?.name ||
                "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              LEAD INVESTIGATOR
            </span>

            <strong>
              {investigation.leadInvestigator ||
                "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              TEAM
            </span>

            <strong>
              {investigation.team ||
                investigation.teamName ||
                "N/A"}
            </strong>

          </div>

        </div>

      </section>

      {/* =====================================================
          PERSONNEL
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              PERSONNEL
            </div>

            <h2>
              Investigation Team
            </h2>

            <p>
              Personnel assigned to this investigation.
            </p>

          </div>

        </div>

        {assignedMembers.length > 0 ? (

          <div className="nh-related-record-list">

            {assignedMembers.map(
              (member) => (

                <button
                  key={member.firestoreId}
                  className="nh-related-record"
                  onClick={() =>
                    navigate(
                      `/members/${member.firestoreId}`
                    )
                  }
                >

                  <div>

                    <div className="nh-list-title">
                      {member.name}
                    </div>

                    <div className="nh-list-meta">
                      {member.memberId}
                      {" • "}
                      {member.position ||
                        "Investigator"}
                    </div>

                  </div>

                  <div className="nh-related-record-arrow">
                    →
                  </div>

                </button>

              )
            )}

          </div>

        ) : (

          <div className="nh-empty-state">
            No personnel have been assigned to this investigation yet.
          </div>

        )}

      </section>

      {/* =====================================================
          INVESTIGATION PLAN
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              PLANNING
            </div>

            <h2>
              Investigation Plan Outline
            </h2>

            <p>
              IPO associated with this investigation.
            </p>

          </div>

        </div>

        <div className="nh-workflow-grid">

          <button
            type="button"
            className="nh-workflow-card nh-workflow-card-clickable"
            onClick={handleIPO}
          >

            <span className="nh-workflow-number">
              IPO
            </span>

            <strong>
              Investigation Plan Outline
            </strong>

            <small>
              {investigation.ipoId
                ? "View or edit the submitted investigation plan."
                : "Create the Investigation Plan Outline for this investigation."}
            </small>

            <span className="nh-workflow-status">
              {investigation.ipoId
                ? "SUBMITTED →"
                : "NOT SUBMITTED →"}
            </span>

          </button>

        </div>

      </section>

      {/* =====================================================
          PROPERTY ACCESS
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              PROPERTY
            </div>

            <h2>
              Property Access
            </h2>

            <p>
              Authorization to enter and investigate the property.
            </p>

          </div>

        </div>

        <div className="nh-workflow-grid">

          <button
            type="button"
            className="nh-workflow-card nh-workflow-card-clickable"
            onClick={handlePropertyAccess}
          >

            <span className="nh-workflow-number">
              FORM
            </span>

            <strong>
              Property Access Form
            </strong>

            <small>
              {investigation.propertyAccessId
                ? "View or edit the property access record."
                : "Open the Forms registry to access the Property Access form."}
            </small>

            <span className="nh-workflow-status">
              {investigation.propertyAccessId
                ? "SUBMITTED →"
                : "OPEN FORMS →"}
            </span>

          </button>

        </div>

      </section>

      {/* =====================================================
          NOTES
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              FIELD NOTES
            </div>

            <h2>
              Investigation Notes
            </h2>

            <p>
              Working notes recorded during the investigation.
            </p>

          </div>

          <button
            className="nh-button nh-button-secondary"
            onClick={() => {
              setNewNote("");
              setShowAddNote(true);
            }}
          >
            + Add Note
          </button>

        </div>

        {Array.isArray(
          investigation.notes
        ) &&
        investigation.notes.length > 0 ? (

          <div className="nh-note-list">

            {investigation.notes.map(
              (note, index) => (

                <div
                  className="nh-investigation-note"
                  key={
                    note.id ||
                    index
                  }
                >

                  <div className="nh-note-number">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div>

                    <div className="nh-note-text">
                      {typeof note ===
                      "string"
                        ? note
                        : note.text}
                    </div>

                    {typeof note !==
                      "string" &&
                      note.createdAt && (
                        <div className="nh-list-meta">
                          {formatDate(
                            note.createdAt
                          )}
                        </div>
                      )}

                  </div>

                </div>

              )
            )}

          </div>

        ) : (

          <div className="nh-empty-state">
            No investigation notes have been recorded.
          </div>

        )}

      </section>

      {/* =====================================================
          EVIDENCE
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              EVIDENCE
            </div>

            <h2>
              Evidence
            </h2>

            <p>
              Recorded media and evidence associated with this investigation.
            </p>

          </div>

          <span className="nh-member-count">
            {evidenceCount} records
          </span>

        </div>

        <div className="nh-workflow-grid">

          <button
            type="button"
            className="nh-workflow-card nh-workflow-card-clickable"
            onClick={() =>
              navigate(
                `/investigations/${investigation.firestoreId}/evidence/new`
              )
            }
          >

            <span className="nh-workflow-number">
              {String(
                evidenceCount
              ).padStart(
                2,
                "0"
              )}
            </span>

            <strong>
              Submit Evidence
            </strong>

            <small>
              Upload recorded media and file evidence collected during this investigation.
            </small>

            <span className="nh-workflow-status">
              SUBMIT EVIDENCE →
            </span>

          </button>

        </div>

      </section>

      {/* =====================================================
          WITNESS REPORTS
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              WITNESSES
            </div>

            <h2>
              Witness Reports
            </h2>

            <p>
              Witness statements and reports associated with the investigation.
            </p>

          </div>

          <span className="nh-member-count">
            {witnessReportCount} reports
          </span>

        </div>

        <div className="nh-workflow-grid">

          <button
            type="button"
            className="nh-workflow-card nh-workflow-card-clickable"
            onClick={handleWitnessReports}
          >

            <span className="nh-workflow-number">
              {String(
                witnessReportCount
              ).padStart(2, "0")}
            </span>

            <strong>
              Witness Reports
            </strong>

            <small>
              {witnessReportCount > 0
                ? "Open the witness report records associated with this investigation."
                : "Create a witness report for this investigation."}
            </small>

            <span className="nh-workflow-status">
              {witnessReportCount > 0
                ? "OPEN REPORT →"
                : "CREATE REPORT →"}
            </span>

          </button>

        </div>

      </section>

      {/* =====================================================
          INCIDENT REPORT
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              INCIDENTS
            </div>

            <h2>
              Incident Report
            </h2>

            <p>
              Used only when a serious incident requires documentation.
            </p>

          </div>

          <span className="nh-member-count">
            {incidentReportCount} reports
          </span>

        </div>

        <div className="nh-workflow-grid">

          <button
            type="button"
            className="nh-workflow-card nh-workflow-card-clickable"
            onClick={handleIncidentReport}
          >

            <span className="nh-workflow-number">
              {String(
                incidentReportCount
              ).padStart(2, "0")}
            </span>

            <strong>
              Incident Reports
            </strong>

            <small>
              {incidentReportCount > 0
                ? "Open the incident report associated with this investigation."
                : "No incident report is required unless a serious incident occurred."}
            </small>

            <span className="nh-workflow-status">
              {incidentReportCount > 0
                ? "OPEN REPORT →"
                : "REPORT INCIDENT →"}
            </span>

          </button>

        </div>

      </section>

      {/* =====================================================
          INVESTIGATION REPORT
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              DOCUMENTATION
            </div>

            <h2>
              Investigation Report
            </h2>

            <p>
              Official report generated after the investigation.
            </p>

          </div>

        </div>

        <div className="nh-workflow-grid">

          <button
            type="button"
            className="nh-workflow-card nh-workflow-card-clickable"
            onClick={handleInvestigationReport}
          >

            <span className="nh-workflow-number">
              REPORT
            </span>

            <strong>
              Investigation Report
            </strong>

            <small>
              {investigation.investigationReportId
                ? "View or edit the submitted investigation report."
                : "Create the official investigation report."}
            </small>

            <span className="nh-workflow-status">
              {investigation.investigationReportId
                ? "SUBMITTED →"
                : "NOT SUBMITTED →"}
            </span>

          </button>

        </div>

      </section>

      {/* =====================================================
          TIMELINE
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              CHRONOLOGY
            </div>

            <h2>
              Investigation Timeline
            </h2>

            <p>
              Chronological record of investigation activity.
            </p>

          </div>

        </div>

        <div className="nh-timeline">

          <div className="nh-timeline-item">

            <div className="nh-timeline-marker" />

            <div>

              <strong>
                Investigation Record Created
              </strong>

              <p>
                {formatDate(
                  investigation.createdAt
                )}
              </p>

            </div>

          </div>

          <div className="nh-timeline-item">

            <div className="nh-timeline-marker" />

            <div>

              <strong>
                Investigation Date
              </strong>

              <p>
                {formatDate(
                  investigation.date
                )}
              </p>

            </div>

          </div>

          {investigation.ipoId && (
            <div className="nh-timeline-item">

              <div className="nh-timeline-marker" />

              <div>

                <strong>
                  Investigation Plan Submitted
                </strong>

                <p>
                  IPO record linked to this investigation.
                </p>

              </div>

            </div>
          )}

          {investigation.investigationReportId && (
            <div className="nh-timeline-item">

              <div className="nh-timeline-marker" />

              <div>

                <strong>
                  Investigation Report Submitted
                </strong>

                <p>
                  Official investigation report linked to this investigation.
                </p>

              </div>

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          DEBRIEF
          ===================================================== */}

      <section className="nh-investigation-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              DEBRIEF
            </div>

            <h2>
              Investigation Debrief
            </h2>

            <p>
              Post-investigation summary and debrief information.
            </p>

          </div>

        </div>

        <div className="nh-member-profile-text">

          {investigation.debrief ||
            "No debrief has been recorded yet."}

        </div>

      </section>

      {/* =====================================================
          EDIT MODAL
          ===================================================== */}

      {showEdit &&
        editInvestigation && (
          <div
            className="nh-modal-overlay"
            onClick={() =>
              setShowEdit(false)
            }
          >

            <div
              className="nh-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="nh-modal-header">

                <div>

                  <div className="nh-command-label">
                    INVESTIGATION MANAGEMENT
                  </div>

                  <h2>
                    Edit Investigation
                  </h2>

                </div>

                <button
                  className="nh-modal-close"
                  onClick={() =>
                    setShowEdit(false)
                  }
                >
                  ×
                </button>

              </div>

              <div className="nh-modal-body">

                <div className="nh-form-grid">

                  <div className="nh-form-group">

                    <label>
                      Investigation Number
                    </label>

                    <input
                      type="text"
                      value={
                        editInvestigation.investigationNumber
                      }
                      onChange={(e) =>
                        setEditInvestigation({
                          ...editInvestigation,
                          investigationNumber:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="nh-form-group">

                    <label>
                      Status
                    </label>

                    <select
                      value={
                        editInvestigation.status
                      }
                      onChange={(e) =>
                        setEditInvestigation({
                          ...editInvestigation,
                          status:
                            e.target.value,
                        })
                      }
                    >

                      <option value="Scheduled">
                        Scheduled
                      </option>

                      <option value="Active">
                        Active
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                      <option value="Cancelled">
                        Cancelled
                      </option>

                    </select>

                  </div>

                  <div className="nh-form-group">

                    <label>
                      Date
                    </label>

                    <input
                      type="date"
                      value={
                        editInvestigation.date
                      }
                      onChange={(e) =>
                        setEditInvestigation({
                          ...editInvestigation,
                          date:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="nh-form-group">

                    <label>
                      Team
                    </label>

                    <select
                      value={
                        editInvestigation.team
                      }
                      onChange={(e) =>
                        setEditInvestigation({
                          ...editInvestigation,
                          team:
                            e.target.value,
                        })
                      }
                    >

                      <option value="Investigation">
                        Investigation
                      </option>

                      <option value="Administration">
                        Administration
                      </option>

                    </select>

                  </div>

                  <div className="nh-form-group">

                    <label>
                      Start Time
                    </label>

                    <input
                      type="time"
                      value={
                        editInvestigation.startTime
                      }
                      onChange={(e) =>
                        setEditInvestigation({
                          ...editInvestigation,
                          startTime:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="nh-form-group">

                    <label>
                      End Time
                    </label>

                    <input
                      type="time"
                      value={
                        editInvestigation.endTime
                      }
                      onChange={(e) =>
                        setEditInvestigation({
                          ...editInvestigation,
                          endTime:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="nh-form-group nh-form-group-wide">

                    <label>
                      Lead Investigator
                    </label>

                    <input
                      type="text"
                      value={
                        editInvestigation.leadInvestigator
                      }
                      onChange={(e) =>
                        setEditInvestigation({
                          ...editInvestigation,
                          leadInvestigator:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="nh-form-group nh-form-group-wide">

                    <label>
                      Debrief
                    </label>

                    <textarea
                      rows="5"
                      value={
                        editInvestigation.debrief
                      }
                      onChange={(e) =>
                        setEditInvestigation({
                          ...editInvestigation,
                          debrief:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                </div>

              </div>

              <div className="nh-modal-footer">

                <button
                  className="nh-button nh-button-secondary"
                  onClick={() =>
                    setShowEdit(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="nh-button nh-button-primary"
                  onClick={
                    handleSaveInvestigation
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* =====================================================
          ADD NOTE MODAL
          ===================================================== */}

      {showAddNote && (
        <div
          className="nh-modal-overlay"
          onClick={() =>
            setShowAddNote(false)
          }
        >

          <div
            className="nh-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="nh-modal-header">

              <div>

                <div className="nh-command-label">
                  FIELD NOTES
                </div>

                <h2>
                  Add Investigation Note
                </h2>

              </div>

              <button
                className="nh-modal-close"
                onClick={() =>
                  setShowAddNote(false)
                }
              >
                ×
              </button>

            </div>

            <div className="nh-modal-body">

              <div className="nh-form-group">

                <label>
                  Note
                </label>

                <textarea
                  rows="8"
                  value={newNote}
                  onChange={(e) =>
                    setNewNote(
                      e.target.value
                    )
                  }
                  placeholder="Enter investigation notes..."
                  autoFocus
                />

              </div>

            </div>

            <div className="nh-modal-footer">

              <button
                className="nh-button nh-button-secondary"
                onClick={() =>
                  setShowAddNote(false)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="nh-button nh-button-primary"
                onClick={
                  handleAddNote
                }
                disabled={
                  saving ||
                  !newNote.trim()
                }
              >
                {saving
                  ? "Saving..."
                  : "Add Note"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default InvestigationDetail;