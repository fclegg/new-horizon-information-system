import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../firebase/config";

function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  /* =========================================================
     EDIT CASE
     ========================================================= */

  const [showEdit, setShowEdit] = useState(false);
  const [editCase, setEditCase] = useState({});

  /* =========================================================
     INVESTIGATIONS
     ========================================================= */

  const [showInvestigationModal, setShowInvestigationModal] =
    useState(false);

  const [investigations, setInvestigations] = useState([]);
  const [loadingInvestigations, setLoadingInvestigations] =
    useState(false);

  /* =========================================================
     MEMBERS
     ========================================================= */

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  /* =========================================================
     WITNESS REPORTS
     ========================================================= */

  const [witnessReports, setWitnessReports] = useState([]);
  const [loadingWitnessReports, setLoadingWitnessReports] =
    useState(false);

  /* =========================================================
     LOCATION HISTORY
     ========================================================= */

  const [locationHistories, setLocationHistories] = useState([]);
  const [loadingLocationHistories, setLoadingLocationHistories] =
    useState(false);

  /* =========================================================
     FINAL ASSESSMENT
     ========================================================= */

  const [finalAssessment, setFinalAssessment] =
    useState(null);

  const [loadingFinalAssessment, setLoadingFinalAssessment] =
    useState(false);

  /* =========================================================
     PROPERTY OWNER CONTACT
     ========================================================= */

  const [showContactModal, setShowContactModal] =
    useState(false);

  const [ownerContact, setOwnerContact] = useState({
    name: "",
    phone: "",
    email: "",
    preferredContact: "",
    notes: "",
  });

  /* =========================================================
     NEW INVESTIGATION
     ========================================================= */

  const [newInvestigation, setNewInvestigation] = useState({
    date: "",
    startTime: "",
    endTime: "",
    status: "Planned",
    teamName: "",
    description: "",
    personnelIds: [],
  });

  /* =========================================================
     LOAD CASE
     ========================================================= */

  async function loadCase() {
    try {
      setLoading(true);
      setError("");

      if (!caseId) {
        setError("No case ID was provided.");
        return;
      }

      console.log("Loading Firestore case:", caseId);

      const caseRef = doc(db, "cases", caseId);
      const snapshot = await getDoc(caseRef);

      if (!snapshot.exists()) {
        setError("This case could not be found.");
        return;
      }

      const data = {
        firestoreId: snapshot.id,
        ...snapshot.data(),
      };

      console.log("Loaded case:", data);

      setCaseData(data);
      setEditCase(data);

      if (data.propertyOwnerContact) {
        setOwnerContact({
          name: data.propertyOwnerContact.name || "",
          phone: data.propertyOwnerContact.phone || "",
          email: data.propertyOwnerContact.email || "",
          preferredContact:
            data.propertyOwnerContact.preferredContact || "",
          notes: data.propertyOwnerContact.notes || "",
        });
      }
    } catch (err) {
      console.error("Error loading case:", err);
      setError("Unable to load this case.");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD INVESTIGATIONS
     ========================================================= */

  async function loadInvestigations() {
    if (!caseData?.firestoreId) return;

    try {
      setLoadingInvestigations(true);

      const investigationsQuery = query(
        collection(db, "investigations"),
        where(
          "caseFirestoreId",
          "==",
          caseData.firestoreId
        )
      );

      const snapshot = await getDocs(
        investigationsQuery
      );

      const loadedInvestigations = snapshot.docs.map(
        (investigationDoc) => ({
          firestoreId: investigationDoc.id,
          ...investigationDoc.data(),
        })
      );

      loadedInvestigations.sort(
        (a, b) =>
          (a.investigationNumber || 0) -
          (b.investigationNumber || 0)
      );

      setInvestigations(loadedInvestigations);

      console.log(
        "Loaded investigations:",
        loadedInvestigations
      );
    } catch (err) {
      console.error(
        "Error loading investigations:",
        err
      );

      setInvestigations([]);
    } finally {
      setLoadingInvestigations(false);
    }
  }

  /* =========================================================
     LOAD MEMBERS
     ========================================================= */

  async function loadMembers() {
    try {
      setLoadingMembers(true);

      const snapshot = await getDocs(
        collection(db, "members")
      );

      const loadedMembers = snapshot.docs.map(
        (memberDoc) => ({
          firestoreId: memberDoc.id,
          ...memberDoc.data(),
        })
      );

      setMembers(loadedMembers);

      console.log(
        "Loaded members:",
        loadedMembers
      );
    } catch (err) {
      console.error(
        "Error loading members:",
        err
      );

      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }

  /* =========================================================
     LOAD WITNESS REPORTS
     ========================================================= */

  async function loadWitnessReports() {
    if (!caseData?.firestoreId) return;

    try {
      setLoadingWitnessReports(true);

      const witnessQuery = query(
        collection(db, "witnessReports"),
        where(
          "caseFirestoreId",
          "==",
          caseData.firestoreId
        )
      );

      const snapshot = await getDocs(witnessQuery);

      const loadedReports = snapshot.docs.map((reportDoc) => ({
        firestoreId: reportDoc.id,
        ...reportDoc.data(),
      }));

      loadedReports.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setWitnessReports(loadedReports);
    } catch (err) {
      console.error("Error loading witness reports:", err);
      setWitnessReports([]);
    } finally {
      setLoadingWitnessReports(false);
    }
  }

  /* =========================================================
     LOAD LOCATION HISTORY
     ========================================================= */

  async function loadLocationHistories() {
    if (!caseData?.firestoreId) return;

    try {
      setLoadingLocationHistories(true);

      const historyQuery = query(
        collection(db, "locationHistories"),
        where(
          "caseFirestoreId",
          "==",
          caseData.firestoreId
        )
      );

      const snapshot = await getDocs(historyQuery);

      const loadedHistories = snapshot.docs.map((historyDoc) => ({
        firestoreId: historyDoc.id,
        ...historyDoc.data(),
      }));

      loadedHistories.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setLocationHistories(loadedHistories);
    } catch (err) {
      console.error("Error loading location history:", err);
      setLocationHistories([]);
    } finally {
      setLoadingLocationHistories(false);
    }
  }

  /* =========================================================
     LOAD FINAL ASSESSMENT
     ========================================================= */

  async function loadFinalAssessment() {
    if (!caseData?.firestoreId) return;

    try {
      setLoadingFinalAssessment(true);

      /* Prefer the direct case reference. */
      if (caseData.finalAssessmentId) {
        const assessmentSnapshot = await getDoc(
          doc(
            db,
            "finalAssessments",
            caseData.finalAssessmentId
          )
        );

        if (assessmentSnapshot.exists()) {
          setFinalAssessment({
            firestoreId: assessmentSnapshot.id,
            ...assessmentSnapshot.data(),
          });
          return;
        }
      }

      /*
        Fallback for assessments that were created before
        finalAssessmentId was written onto the case record.
      */
      const assessmentQuery = query(
        collection(db, "finalAssessments"),
        where(
          "caseFirestoreId",
          "==",
          caseData.firestoreId
        )
      );

      const snapshot = await getDocs(assessmentQuery);

      const assessments = snapshot.docs
        .map((assessmentDoc) => ({
          firestoreId: assessmentDoc.id,
          ...assessmentDoc.data(),
        }))
        .sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() ||
            a.createdAt?.toMillis?.() ||
            0;
          const bTime = b.updatedAt?.toMillis?.() ||
            b.createdAt?.toMillis?.() ||
            0;

          return bTime - aTime;
        });

      setFinalAssessment(assessments[0] || null);

      /* Repair the case link when a matching assessment exists. */
      if (assessments[0] && !caseData.finalAssessmentId) {
        await updateDoc(
          doc(db, "cases", caseData.firestoreId),
          {
            finalAssessmentId: assessments[0].firestoreId,
            finalAssessmentStatus: "Filed",
            updatedAt: serverTimestamp(),
          }
        );

        setCaseData((previous) => ({
          ...previous,
          finalAssessmentId:
            assessments[0].firestoreId,
          finalAssessmentStatus: "Filed",
        }));
      }
    } catch (err) {
      console.error(
        "Error loading final assessment:",
        err
      );
      setFinalAssessment(null);
    } finally {
      setLoadingFinalAssessment(false);
    }
  }

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    loadCase();
    loadMembers();
  }, [caseId]);

  useEffect(() => {
    if (caseData?.firestoreId) {
      loadInvestigations();
      loadWitnessReports();
      loadLocationHistories();
      loadFinalAssessment();
    }
  }, [caseData?.firestoreId]);

  /* =========================================================
     DATE FORMATTER
     ========================================================= */

  function formatTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }

    return "N/A";
  }

  /* =========================================================
     EDIT FIELD
     ========================================================= */

  function updateEditField(field, value) {
    setEditCase((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

    /* =========================================================
     SAVE CASE EDIT
     ========================================================= */

  async function handleSaveEdit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const caseRef = doc(
        db,
        "cases",
        caseData.firestoreId
      );

      await updateDoc(caseRef, {
        name: editCase.name?.trim() || "",
        status: editCase.status || "Active",
        priority: editCase.priority || "Normal",

        locationType:
          editCase.locationType || "",

        locationName:
          editCase.locationName?.trim() || "",

        address:
          editCase.address?.trim() || "",

        city:
          editCase.city?.trim() || "",

        state:
          editCase.state || "",

        clientName:
          editCase.clientName?.trim() || "",

        leadInvestigator:
          editCase.leadInvestigator?.trim() || "",

        investigationDate:
          editCase.investigationDate || null,

        description:
          editCase.description?.trim() || "",

        updatedAt: serverTimestamp(),
      });

      await loadCase();

      setShowEdit(false);
    } catch (err) {
      console.error(
        "Error updating case:",
        err
      );

      setError(
        "Unable to update this case."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     ARCHIVE CASE
     ========================================================= */

  async function handleArchive() {
    const confirmed = window.confirm(
      "Archive this case?\n\nThe case will remain in Firestore but will be marked as archived."
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      await updateDoc(
        doc(db, "cases", caseData.firestoreId),
        {
          status: "Archived",
          archived: true,
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      await loadCase();
    } catch (err) {
      console.error(
        "Error archiving case:",
        err
      );

      setError(
        "Unable to archive this case."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE CASE
     ========================================================= */

  async function handleDelete() {
    const confirmed = window.confirm(
      "DELETE THIS CASE?\n\nThis permanently removes the case record from Firestore.\n\nThis action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      await deleteDoc(
        doc(db, "cases", caseData.firestoreId)
      );

      navigate("/cases");
    } catch (err) {
      console.error(
        "Error deleting case:",
        err
      );

      setError(
        "Unable to delete this case."
      );

      setSaving(false);
    }
  }

  /* =========================================================
     SAVE PROPERTY OWNER CONTACT
     ========================================================= */

  async function handleSaveOwnerContact(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const contactRecord = {
        name:
          ownerContact.name.trim(),

        phone:
          ownerContact.phone.trim(),

        email:
          ownerContact.email.trim(),

        preferredContact:
          ownerContact.preferredContact,

        notes:
          ownerContact.notes.trim(),

        updatedAt:
          serverTimestamp(),
      };

      await updateDoc(
        doc(
          db,
          "cases",
          caseData.firestoreId
        ),
        {
          propertyOwnerContact:
            contactRecord,

          updatedAt:
            serverTimestamp(),
        }
      );

      await loadCase();

      setShowContactModal(false);
    } catch (err) {
      console.error(
        "Error saving property owner contact:",
        err
      );

      setError(
        "Unable to save the property owner contact."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     CREATE INVESTIGATION
     ========================================================= */

  async function createInvestigation() {
    if (!caseData?.firestoreId) {
      return;
    }

    if (!newInvestigation.date) {
      alert(
        "Please select an investigation date."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      /* -----------------------------------------------------
         FIND EXISTING INVESTIGATIONS
         ----------------------------------------------------- */

      const existingQuery = query(
        collection(db, "investigations"),
        where(
          "caseFirestoreId",
          "==",
          caseData.firestoreId
        )
      );

      const existingSnapshot =
        await getDocs(existingQuery);

      const investigationNumber =
        existingSnapshot.size + 1;

      const investigationId =
        `INV-${String(
          investigationNumber
        ).padStart(4, "0")}`;

      /* -----------------------------------------------------
         CREATE INVESTIGATION RECORD
         ----------------------------------------------------- */

      const investigationRecord = {
        id: investigationId,

        investigationNumber:

          investigationNumber,

        title:
          `Investigation #${investigationNumber}`,

        caseFirestoreId:
          caseData.firestoreId,

        caseId:
          caseData.id || "",

        date:
          newInvestigation.date,

        startTime:
          newInvestigation.startTime,

        endTime:
          newInvestigation.endTime,

        status:
          newInvestigation.status,

        teamName:
          newInvestigation.teamName.trim(),

        description:
          newInvestigation.description.trim(),

        personnelIds:
          newInvestigation.personnelIds,

        evidenceIds: [],

        formSubmissionIds: [],

        incidentReportIds: [],

        ipoStatus:
          "Not Submitted",

        investigationReportId:
          null,

        finalAssessmentId:
          null,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      const investigationRef =
        await addDoc(
          collection(
            db,
            "investigations"
          ),
          investigationRecord
        );

      /* -----------------------------------------------------
         UPDATE PARENT CASE
         ----------------------------------------------------- */

      const existingInvestigationIds =
        caseData.investigationIds || [];

      const updatedInvestigationIds = [
        ...existingInvestigationIds,
        investigationRef.id,
      ];

      /* -----------------------------------------------------
         ADD PERSONNEL TO CASE
         ----------------------------------------------------- */

      const existingMemberIds =
        caseData.memberIds || [];

      const combinedMemberIds = [
        ...new Set([
          ...existingMemberIds,
          ...newInvestigation.personnelIds,
        ]),
      ];

      await updateDoc(
        doc(
          db,
          "cases",
          caseData.firestoreId
        ),
        {
          investigationIds:
            updatedInvestigationIds,

          investigationCount:
            updatedInvestigationIds.length,

          memberIds:
            combinedMemberIds,

          updatedAt:
            serverTimestamp(),
        }
      );

      /* -----------------------------------------------------
         RESET INVESTIGATION FORM
         ----------------------------------------------------- */

      setNewInvestigation({
        date: "",
        startTime: "",
        endTime: "",
        status: "Planned",
        teamName: "",
        description: "",
        personnelIds: [],
      });

      setShowInvestigationModal(false);

      await loadCase();
      await loadInvestigations();

      console.log(
        "Investigation created:",
        investigationRef.id
      );
    } catch (err) {
      console.error(
        "Error creating investigation:",
        err
      );

      setError(
        "Unable to create the investigation."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     PERSONNEL SELECTION
     ========================================================= */

  function togglePersonnel(memberId) {
    setNewInvestigation((previous) => {
      const currentlySelected =
        previous.personnelIds.includes(
          memberId
        );

      return {
        ...previous,

        personnelIds:
          currentlySelected
            ? previous.personnelIds.filter(
                (id) =>
                  id !== memberId
              )
            : [
                ...previous.personnelIds,
                memberId,
              ],
      };
    });
  }

  /* =========================================================
     LOADING SCREEN
     ========================================================= */

  if (loading) {
    return (
      <div className="nh-page nh-case-detail-page">

        <div className="nh-case-detail-loading">
          Loading case file...
        </div>

      </div>
    );
  }

  /* =========================================================
     CASE NOT FOUND
     ========================================================= */

  if (!caseData) {
    return (
      <div className="nh-page nh-case-detail-page">

        <button
          className="nh-back-button"
          onClick={() =>
            navigate("/cases")
          }
        >
          ← Back to Cases
        </button>

        <div className="nh-card nh-case-detail-error">

          <h2>
            Case Not Found
          </h2>

          <p>
            {error ||
              "This case does not exist."}
          </p>

        </div>

      </div>
    );
  }

    /* =========================================================
     MAIN CASE FILE
     ========================================================= */

  return (
    <div className="nh-page nh-case-detail-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="nh-case-detail-header">

        <div>

          <button
            className="nh-back-button"
            onClick={() => navigate("/cases")}
          >
            ← Back to Cases
          </button>

          <div className="nh-command-label">
            CASE FILE
          </div>

          <h1 className="nh-page-title">
            {caseData.name}
          </h1>

          <div className="nh-case-detail-id">
            {caseData.id || "NO CASE NUMBER"}
          </div>

        </div>

        <div className="nh-case-detail-actions">

          <button
            className="nh-secondary-button"
            onClick={() => setShowEdit(true)}
            disabled={saving}
          >
            Edit Case
          </button>

          <button
            className="nh-secondary-button"
            onClick={handleArchive}
            disabled={
              saving || caseData.archived
            }
          >
            {caseData.archived
              ? "Archived"
              : "Archive"}
          </button>

          <button
            className="nh-danger-button"
            onClick={handleDelete}
            disabled={saving}
          >
            Delete
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

      <div className="nh-case-file-status-bar">

        <div>

          <span className="nh-case-file-label">
            STATUS
          </span>

          <span
            className={`nh-case-status nh-case-status-${(
              caseData.status || "Active"
            ).toLowerCase()}`}
          >
            <span className="nh-status-dot-small"></span>

            {caseData.status || "Active"}
          </span>

        </div>

        <div>

          <span className="nh-case-file-label">
            PRIORITY
          </span>

          <strong>
            {caseData.priority || "Normal"}
          </strong>

        </div>

        <div>

          <span className="nh-case-file-label">
            INVESTIGATIONS
          </span>

          <strong>
            {investigations.length}
          </strong>

        </div>

      </div>

      {/* =====================================================
          01 — CASE OVERVIEW
          ===================================================== */}

      <section className="nh-case-file-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              01
            </div>

            <h2>
              Case Overview
            </h2>

          </div>

        </div>

        <div className="nh-case-file-grid">

          <div className="nh-case-file-field">

            <span>
              Case Number
            </span>

            <strong>
              {caseData.id || "N/A"}
            </strong>

          </div>

          <div className="nh-case-file-field">

            <span>
              Case Name
            </span>

            <strong>
              {caseData.name || "N/A"}
            </strong>

          </div>

          <div className="nh-case-file-field">

            <span>
              Lead Investigator
            </span>

            <strong>
              {caseData.leadInvestigator ||
                "Unassigned"}
            </strong>

          </div>

          <div className="nh-case-file-field">

            <span>
              Primary Investigation Date
            </span>

            <strong>
              {caseData.investigationDate ||
                "Unscheduled"}
            </strong>

          </div>

          <div className="nh-case-file-field nh-case-file-field-wide">

            <span>
              Description
            </span>

            <p>
              {caseData.description ||
                "No case description has been recorded."}
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          02 — LOCATION
          ===================================================== */}

      <section className="nh-case-file-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              02
            </div>

            <h2>
              Location
            </h2>

          </div>

        </div>

        <div className="nh-case-file-grid">

          <div className="nh-case-file-field">

            <span>
              Location Type
            </span>

            <strong>
              {caseData.locationType || "N/A"}
            </strong>

          </div>

          <div className="nh-case-file-field">

            <span>
              Location Name
            </span>

            <strong>
              {caseData.locationName || "N/A"}
            </strong>

          </div>

          <div className="nh-case-file-field nh-case-file-field-wide">

            <span>
              Address
            </span>

            <strong>
              {caseData.address || "N/A"}
            </strong>

            <div className="nh-case-file-muted">

              {caseData.city || ""}

              {caseData.city && caseData.state
                ? ", "
                : ""}

              {caseData.state || ""}

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          03 — CLIENT / PROPERTY OWNER
          ===================================================== */}

      <section className="nh-case-file-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              03
            </div>

            <h2>
              Client / Property Owner
            </h2>

            <p>
              Case-specific property owner contact information.
            </p>

          </div>

          <button
            className="nh-primary-button"
            onClick={() =>
              setShowContactModal(true)
            }
          >
            {caseData.propertyOwnerContact
              ? "Edit Contact"
              : "+ Add Contact"}
          </button>

        </div>

        <div className="nh-case-file-grid">

          <div className="nh-case-file-field">

            <span>
              Property Owner
            </span>

            <strong>
              {caseData.clientName || "N/A"}
            </strong>

          </div>

          <div className="nh-case-file-field">

            <span>
              Contact Record
            </span>

            <strong>
              {caseData.propertyOwnerContact
                ? "On File"
                : "Not Recorded"}
            </strong>

          </div>

          {caseData.propertyOwnerContact && (
            <>

              <div className="nh-case-file-field">

                <span>
                  Phone
                </span>

                <strong>
                  {caseData.propertyOwnerContact.phone ||
                    "N/A"}
                </strong>

              </div>

              <div className="nh-case-file-field">

                <span>
                  Email
                </span>

                <strong>
                  {caseData.propertyOwnerContact.email ||
                    "N/A"}
                </strong>

              </div>

              <div className="nh-case-file-field nh-case-file-field-wide">

                <span>
                  Preferred Contact
                </span>

                <strong>
                  {caseData.propertyOwnerContact.preferredContact ||
                    "N/A"}
                </strong>

              </div>

            </>
          )}

        </div>

      </section>

      {/* =====================================================
          04 — LOCATION HISTORY
          ===================================================== */}

      <section className="nh-case-file-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              04
            </div>

            <h2>
              Location History
            </h2>

            <p>
              Historical research and documented information about this location.
            </p>

          </div>

          <button
            className="nh-primary-button"
            onClick={() =>
              navigate(`/cases/${caseData.firestoreId}/location-history/new`)
            }
          >
            + New Location History
          </button>

        </div>

        {loadingLocationHistories ? (

          <div className="nh-case-detail-empty">
            Loading location history...
          </div>

        ) : locationHistories.length === 0 ? (

          <div className="nh-case-file-empty-module">

            <div className="nh-case-file-module-number">
              0
            </div>

            <div>

              <strong>
                No Location History
              </strong>

              <p>
                No location history records have been submitted for this case.
              </p>

              <button
                className="nh-primary-button"
                onClick={() =>
                  navigate(`/cases/${caseData.firestoreId}/location-history/new`)
                }
              >
                + Add First Location History
              </button>

            </div>

          </div>

        ) : (

          <div className="nh-case-record-list nh-location-history-list">

            {locationHistories.map((history) => (

              <div
                className="nh-case-record-card"
                key={history.firestoreId}
              >

                <div className="nh-case-record-id">
                  {history.historyId || "LOC"}
                </div>

                <div className="nh-case-record-main">

                  <strong>
                    {history.locationName ||
                      caseData.locationName ||
                      "Unnamed Location"}
                  </strong>

                  <span>
                    {history.todaysDate ||
                      "Date not recorded"}
                  </span>

                  <small>
                    {[history.firstName, history.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                      "Researcher not recorded"}
                  </small>

                </div>

                <div className="nh-case-record-status">

                  <span>
                    {history.status || "Submitted"}
                  </span>

                </div>

                <button
                  className="nh-case-record-button"
                  onClick={() =>
                    navigate(
                      `/cases/${caseData.firestoreId}/location-history/${history.firestoreId}`
                    )
                  }
                >
                  View →
                </button>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* =====================================================
          05 — WITNESS REPORTS
          ===================================================== */}

      <section className="nh-case-file-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              05
            </div>

            <h2>
              Witness Reports
            </h2>

            <p>
              Witness statements and encounter reports associated with this case.
            </p>

          </div>

          <button
            className="nh-primary-button"
            onClick={() =>
              navigate(`/cases/${caseData.firestoreId}/witness-reports/new`)
            }
          >
            + New Witness Report
          </button>

        </div>

        {loadingWitnessReports ? (

          <div className="nh-case-detail-empty">
            Loading witness reports...
          </div>

        ) : witnessReports.length === 0 ? (

          <div className="nh-case-file-empty-module">

            <div className="nh-case-file-module-number">
              0
            </div>

            <div>

              <strong>
                No Witness Reports
              </strong>

              <p>
                No witness reports have been submitted for this case.
              </p>

              <button
                className="nh-primary-button"
                onClick={() =>
                  navigate(`/cases/${caseData.firestoreId}/witness-reports/new`)
                }
              >
                + Add First Witness Report
              </button>

            </div>

          </div>

        ) : (

          <div className="nh-case-record-list nh-witness-report-list">

            {witnessReports.map((report) => (

              <div
                className="nh-case-record-card"
                key={report.firestoreId}
              >

                <div className="nh-case-record-id">
                  {report.reportId || "WIT"}
                </div>

                <div className="nh-case-record-main">

                  <strong>
                    {[report.firstName, report.lastName]
                      .filter(Boolean)
                      .join(" ") || "Unnamed Witness"}
                  </strong>

                  <span>
                    {report.todaysDate || "Date not recorded"}
                  </span>

                  <small>
                    {report.locationName ||
                      caseData.locationName ||
                      "Location not recorded"}
                  </small>

                </div>

                <div className="nh-case-record-status">
                  <span>
                    {report.status || "Submitted"}
                  </span>
                </div>

                <button
                  className="nh-case-record-button"
                  onClick={() =>
                    navigate(
                      `/cases/${caseData.firestoreId}/witness-reports/${report.firestoreId}`
                    )
                  }
                >
                  View →
                </button>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* =====================================================
    06 — INVESTIGATIONS
    ===================================================== */}

<section className="nh-case-file-section">

  <div className="nh-case-file-section-header">

    <div>

      <div className="nh-command-label">
        06
      </div>

      <h2>
        Investigations
      </h2>

      <p>
        Investigation sessions associated with this case.
      </p>

    </div>

    <button
      className="nh-primary-button"
      onClick={() => {
        setShowContactModal(false);
        setShowInvestigationModal(true);
      }}
      disabled={saving}
    >
      + Add Investigation
    </button>

  </div>

  {loadingInvestigations ? (

    <div className="nh-case-detail-empty">
      Loading investigations...
    </div>

  ) : investigations.length === 0 ? (

    <div className="nh-case-file-empty-module">

      <div className="nh-case-file-module-number">
        0
      </div>

      <div>

        <strong>
          No Investigation Records
        </strong>

        <p>
          This case does not have any investigations yet.
        </p>

        <button
          className="nh-primary-button"
          onClick={() =>
            setShowInvestigationModal(true)
          }
        >
          + Add First Investigation
        </button>

      </div>

    </div>

  ) : (

    <div className="nh-investigation-records">

      {investigations.map((investigation) => (

        <div
          className="nh-investigation-record"
          key={investigation.firestoreId}
        >

          {/* ---------------------------------------------
              NUMBER
              --------------------------------------------- */}

          <div className="nh-investigation-record-index">
            {String(
              investigation.investigationNumber || "—"
            ).padStart(2, "0")}
          </div>

          {/* ---------------------------------------------
              MAIN INFORMATION
              --------------------------------------------- */}

          <div className="nh-investigation-record-content">

            <div className="nh-investigation-record-heading">

              <div>

                <span className="nh-investigation-record-label">
                  INVESTIGATION
                </span>

                <h3>
                  {investigation.title ||
                    `Investigation #${investigation.investigationNumber}`}
                </h3>

              </div>

              <span
                className={`nh-investigation-status nh-investigation-status-${String(
                  investigation.status || "Planned"
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {investigation.status || "Planned"}
              </span>

            </div>

            {/* -------------------------------------------
                DETAILS
                ------------------------------------------- */}

            <div className="nh-investigation-record-details">

              <div>

                <span>
                  DATE
                </span>

                <strong>
                  {investigation.date ||
                    "Not scheduled"}
                </strong>

              </div>

              <div>

                <span>
                  TIME
                </span>

                <strong>
                  {investigation.startTime
                    ? `${investigation.startTime}${
                        investigation.endTime
                          ? ` — ${investigation.endTime}`
                          : ""
                      }`
                    : "Not scheduled"}
                </strong>

              </div>

              <div>

                <span>
                  TEAM
                </span>

                <strong>
                  {investigation.teamName ||
                    "Unassigned"}
                </strong>

              </div>

              <div>

                <span>
                  PERSONNEL
                </span>

                <strong>
                  {investigation.personnelIds?.length || 0}
                </strong>

              </div>

            </div>

            {/* -------------------------------------------
                DOCUMENTATION
                ------------------------------------------- */}

            <div className="nh-investigation-documentation">

              <div className="nh-investigation-documentation-title">
                DOCUMENTATION
              </div>

              <div className="nh-investigation-document-grid">

                <div className="nh-investigation-document">

                  <span>
                    IPO
                  </span>

                  <strong
                    className={
                      investigation.ipoId
                        ? "complete"
                        : "pending"
                    }
                  >
                    {investigation.ipoId
                      ? "Submitted"
                      : "Not Submitted"}
                  </strong>

                </div>

                <div className="nh-investigation-document">

                  <span>
                    INVESTIGATION REPORT
                  </span>

                  <strong
                    className={
                      investigation.investigationReportId
                        ? "complete"
                        : "pending"
                    }
                  >
                    {investigation.investigationReportId
                      ? "Submitted"
                      : "Not Submitted"}
                  </strong>

                </div>

                <div className="nh-investigation-document">

                  <span>
                    EVIDENCE
                  </span>

                  <strong>
                    {investigation.evidenceIds?.length || 0}{" "}
                    {investigation.evidenceIds?.length === 1
                      ? "Record"
                      : "Records"}
                  </strong>

                </div>

              </div>

            </div>

            {/* -------------------------------------------
                DESCRIPTION
                ------------------------------------------- */}

            {investigation.description && (

              <div className="nh-investigation-description">

                <span>
                  DESCRIPTION
                </span>

                <p>
                  {investigation.description}
                </p>

              </div>

            )}

            {/* -------------------------------------------
                ACTION
                ------------------------------------------- */}

            <div className="nh-investigation-record-footer">

              <span>
                {investigation.id ||
                  `INV-${String(
                    investigation.investigationNumber || 0
                  ).padStart(4, "0")}`}
              </span>

              <button
                className="nh-view-button"
                onClick={() =>
                  navigate(
                    `/investigations/${investigation.firestoreId}`
                  )
                }
              >
                View Investigation →
              </button>

            </div>

          </div>

        </div>

      ))}

    </div>

  )}

</section>

      {/* =====================================================
          07 — EVIDENCE
          ===================================================== */}

      <section className="nh-case-file-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              07
            </div>

            <h2>
              Evidence
            </h2>

            <p>
              Evidence associated with this case.
            </p>

          </div>

        </div>

        <div className="nh-case-file-module-grid">

          <div className="nh-case-file-module-card">

            <strong>
              {caseData.evidenceIds?.length || 0}
            </strong>

            <span>
              Evidence Records
            </span>

          </div>

          <div className="nh-case-file-module-card">

            <strong>
              {caseData.entityIds?.length || 0}
            </strong>

            <span>
              Associated Entities
            </span>

          </div>

          <div className="nh-case-file-module-card">

            <strong>
              {caseData.objectIds?.length || 0}
            </strong>

            <span>
              Associated Objects
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          08 — PERSONNEL
          ===================================================== */}

      <section className="nh-case-file-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              08
            </div>

            <h2>
              Personnel
            </h2>

            <p>
              New Horizon personnel associated with this case.
            </p>

          </div>

        </div>

        {caseData.memberIds?.length ? (

          <div className="nh-investigation-list">

            {caseData.memberIds.map(
              (memberId) => {

                const member =
                  members.find(
                    (item) =>
                      item.firestoreId ===
                      memberId
                  );

                return (

                  <div
                    className="nh-investigation-card"
                    key={memberId}
                  >

                    <div className="nh-investigation-card-number">
                      NH
                    </div>

                    <div className="nh-investigation-card-main">

                      <strong>
                        {member?.name ||
                          "Personnel Record"}
                      </strong>

                      <span>
                        {member?.position ||
                          "Assigned Personnel"}
                      </span>

                      <small>
                        {member?.team ||
                          "New Horizon"}
                      </small>

                    </div>

                    <div className="nh-investigation-card-status">

                      <span>
                        Assigned
                      </span>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        ) : (

          <div className="nh-case-file-empty-module">

            <div className="nh-case-file-module-number">
              0
            </div>

            <div>

              <strong>
                No Personnel Assigned
              </strong>

              <p>
                Personnel will appear here when they are assigned to an investigation.
              </p>

            </div>

          </div>

        )}

      </section>

      {/* =====================================================
          09 — REPORTS & FORMS
          ===================================================== */}

      <section className="nh-case-file-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              09
            </div>

            <h2>
              Reports & Forms
            </h2>

            <p>
              Official documentation associated with this case.
            </p>

          </div>

          <button
            type="button"
            className="nh-final-assessment-header-button"
            onClick={() => {
              if (finalAssessment?.firestoreId) {
                navigate(
                  `/cases/${caseData.firestoreId}/final-assessment/${finalAssessment.firestoreId}`
                );
              } else {
                navigate(
                  `/cases/${caseData.firestoreId}/final-assessment/new`
                );
              }
            }}
          >
            {finalAssessment
              ? "View Final Assessment →"
              : "Create Final Assessment →"}
          </button>

        </div>

        <div className="nh-case-file-module-grid">

          <button
            type="button"
            className="nh-case-file-module-card nh-case-file-module-card-clickable"
            onClick={() => {
              navigate(
                `/cases/${caseData.firestoreId}/incident-reports/new`
              );
            }}
          >

            <strong>
              {caseData.incidentReportIds?.length || 0}
            </strong>

            <span>
              Incident Reports
            </span>

            <small>
              Significant incident documentation.
            </small>

          </button>

          <button
            type="button"
            className="nh-case-file-module-card nh-case-file-module-card-clickable"
            onClick={() => {
              const reportWithRecord =
                investigations.find(
                  (investigation) =>
                    investigation.investigationReportId
                );

              if (reportWithRecord) {
                navigate(
                  `/cases/${caseData.firestoreId}/investigation-reports/${reportWithRecord.investigationReportId}`
                );
              } else if (investigations[0]?.firestoreId) {
                navigate(
                  `/cases/${caseData.firestoreId}/investigation-reports/new?investigationId=${investigations[0].firestoreId}`
                );
              } else {
                setError(
                  "No investigation is associated with this case."
                );
              }
            }}
          >

            <strong>
              {investigations.filter(
                (investigation) =>
                  investigation.investigationReportId
              ).length}
            </strong>

            <span>
              Investigation Reports
            </span>

            <small>
              Reports filed for completed investigations.
            </small>

          </button>

          <button
            type="button"
            className={
              `nh-case-file-module-card nh-case-file-module-card-clickable nh-final-assessment-card ${
                finalAssessment
                  ? "nh-final-assessment-filed"
                  : "nh-final-assessment-pending"
              }`
            }
            onClick={() => {
              if (finalAssessment?.firestoreId) {
                navigate(
                  `/cases/${caseData.firestoreId}/final-assessment/${finalAssessment.firestoreId}`
                );
                return;
              }

              navigate(
                `/cases/${caseData.firestoreId}/final-assessment/new`
              );
            }}
          >

            <strong>
              {finalAssessment ? "01" : "00"}
            </strong>

            <span>
              Final Assessment
            </span>

            <small>
              {loadingFinalAssessment
                ? "Checking assessment record..."
                : finalAssessment
                ? "Filed. Click to view or edit the final case assessment."
                : investigations.length === 0
                ? "Click to create the Final Assessment."
                : investigations.every((investigation) => {
                    const status = String(
                      investigation.status || ""
                    ).toLowerCase();

                    return (
                      status === "completed" ||
                      status === "complete" ||
                      status === "closed"
                    );
                  })
                ? "Ready for Team Lead assessment. Click to create."
                : "Click to open the assessment. It can be filed after all investigations are complete."}
            </small>

            {!finalAssessment && (
              <span className="nh-final-assessment-action">
                Create Final Assessment →
              </span>
            )}

          </button>

        </div>

      </section>

      {/* =====================================================
          SYSTEM INFORMATION
          ===================================================== */}

      <section className="nh-case-file-section nh-case-file-record-section">

        <div className="nh-case-file-section-header">

          <div>

            <div className="nh-command-label">
              RECORD
            </div>

            <h2>
              System Information
            </h2>

          </div>

        </div>

        <div className="nh-case-file-grid">

          <div className="nh-case-file-field">

            <span>
              Created
            </span>

            <strong>
              {formatTimestamp(
                caseData.createdAt
              )}
            </strong>

          </div>

          <div className="nh-case-file-field">

            <span>
              Last Updated
            </span>

            <strong>
              {formatTimestamp(
                caseData.updatedAt
              )}
            </strong>

          </div>

          <div className="nh-case-file-field">

            <span>
              Firestore Record
            </span>

            <strong className="nh-case-file-mono">
              {caseData.firestoreId}
            </strong>

          </div>

        </div>

      </section>

        {/* =========================================================
      EDIT CASE MODAL
      ========================================================= */}

  {showEdit && (

    <div
      className="nh-modal-overlay"
      onClick={() => setShowEdit(false)}
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
              CASE MANAGEMENT
            </div>

            <h2>
              Edit Case
            </h2>
          </div>

          <button
            className="nh-modal-close"
            onClick={() => setShowEdit(false)}
          >
            ×
          </button>

        </div>

        <div className="nh-modal-body">

          <div className="nh-form-grid">

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Case Name
              </label>

              <input
                type="text"
                value={caseData.name || ""}
                onChange={(event) =>
                  updateEditField(
                    "name",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group">

              <label>
                Status
              </label>

              <select
                value={caseData.status || "Active"}
                onChange={(event) =>
                  updateEditField(
                    "status",
                    event.target.value
                  )
                }
              >
                <option value="Active">
                  Active
                </option>

                <option value="Closed">
                  Closed
                </option>

                <option value="Unscheduled">
                  Unscheduled
                </option>
              </select>

            </div>

            <div className="nh-form-group">

              <label>
                Priority
              </label>

              <select
                value={caseData.priority || "Normal"}
                onChange={(event) =>
                  updateEditField(
                    "priority",
                    event.target.value
                  )
                }
              >
                <option value="Low">
                  Low
                </option>

                <option value="Normal">
                  Normal
                </option>

                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>
              </select>

            </div>

            <div className="nh-form-group">

              <label>
                Location Type
              </label>

              <input
                type="text"
                value={
                  caseData.locationType || ""
                }
                onChange={(event) =>
                  updateEditField(
                    "locationType",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group">

              <label>
                Location Name
              </label>

              <input
                type="text"
                value={
                  caseData.locationName || ""
                }
                onChange={(event) =>
                  updateEditField(
                    "locationName",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Address
              </label>

              <input
                type="text"
                value={caseData.address || ""}
                onChange={(event) =>
                  updateEditField(
                    "address",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group">

              <label>
                City
              </label>

              <input
                type="text"
                value={caseData.city || ""}
                onChange={(event) =>
                  updateEditField(
                    "city",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group">

              <label>
                State
              </label>

              <input
                type="text"
                value={caseData.state || ""}
                onChange={(event) =>
                  updateEditField(
                    "state",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group">

              <label>
                Client / Property Owner
              </label>

              <input
                type="text"
                value={
                  caseData.clientName || ""
                }
                onChange={(event) =>
                  updateEditField(
                    "clientName",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group">

              <label>
                Lead Investigator
              </label>

              <input
                type="text"
                value={
                  caseData.leadInvestigator || ""
                }
                onChange={(event) =>
                  updateEditField(
                    "leadInvestigator",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Investigation Date
              </label>

              <input
                type="date"
                value={
                  caseData.investigationDate || ""
                }
                onChange={(event) =>
                  updateEditField(
                    "investigationDate",
                    event.target.value
                  )
                }
              />

            </div>

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Description
              </label>

              <textarea
                rows="5"
                value={
                  caseData.description || ""
                }
                onChange={(event) =>
                  updateEditField(
                    "description",
                    event.target.value
                  )
                }
              />

            </div>

          </div>

        </div>

        <div className="nh-modal-footer">

          <button
            className="nh-secondary-button"
            onClick={() =>
              setShowEdit(false)
            }
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="nh-primary-button"
            onClick={handleSaveEdit}
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

  {/* =========================================================
      PROPERTY OWNER CONTACT MODAL
      ========================================================= */}

  {showContactModal && (

    <div
      className="nh-modal-overlay"
      onClick={() =>
        setShowContactModal(false)
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
              RESTRICTED CASE RECORD
            </div>

            <h2>
              Property Owner Contact
            </h2>

          </div>

          <button
            className="nh-modal-close"
            onClick={() =>
              setShowContactModal(false)
            }
          >
            ×
          </button>

        </div>

        <div className="nh-modal-body">

          <div className="nh-modal-notice">

            This contact record is associated with
            this case only.

          </div>

          <div className="nh-form-grid">

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Name
              </label>

              <input
                type="text"
                value={
                  ownerContact.name || ""
                }
                onChange={(event) =>
                  setOwnerContact({
                    ...ownerContact,
                    name: event.target.value
                  })
                }
              />

            </div>

            <div className="nh-form-group">

              <label>
                Phone
              </label>

              <input
                type="text"
                value={
                  ownerContact.phone || ""
                }
                onChange={(event) =>
                  setOwnerContact({
                    ...ownerContact,
                    phone: event.target.value
                  })
                }
              />

            </div>

            <div className="nh-form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                value={
                  ownerContact.email || ""
                }
                onChange={(event) =>
                  setOwnerContact({
                    ...ownerContact,
                    email: event.target.value
                  })
                }
              />

            </div>

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Preferred Contact Method
              </label>

              <select
                value={
                  ownerContact.preferredContact ||
                  ""
                }
                onChange={(event) =>
                  setOwnerContact({
                    ...ownerContact,
                    preferredContact:
                      event.target.value
                  })
                }
              >

                <option value="">
                  Select method
                </option>

                <option value="Phone">
                  Phone
                </option>

                <option value="Email">
                  Email
                </option>

                <option value="Text">
                  Text
                </option>

              </select>

            </div>

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Notes
              </label>

              <textarea
                rows="4"
                value={
                  ownerContact.notes || ""
                }
                onChange={(event) =>
                  setOwnerContact({
                    ...ownerContact,
                    notes: event.target.value
                  })
                }
              />

            </div>

          </div>

        </div>

        <div className="nh-modal-footer">

          <button
            className="nh-secondary-button"
            onClick={() =>
              setShowContactModal(false)
            }
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="nh-primary-button"
            onClick={handleSaveOwnerContact}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Contact"}
          </button>

        </div>

      </div>

    </div>

  )}

  {/* =========================================================
      ADD INVESTIGATION MODAL
      ========================================================= */}

  {showInvestigationModal && (

    <div
      className="nh-modal-overlay"
      onClick={() =>
        setShowInvestigationModal(false)
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
              Add Investigation
            </h2>

          </div>

          <button
            className="nh-modal-close"
            onClick={() =>
              setShowInvestigationModal(false)
            }
          >
            ×
          </button>

        </div>

        <div className="nh-modal-body">

          <div className="nh-form-grid">

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Investigation Title
              </label>

              <input
                type="text"
                value={
                  newInvestigation.title
                }
                onChange={(event) =>
                  setNewInvestigation({
                    ...newInvestigation,
                    title: event.target.value
                  })
                }
                placeholder="Investigation title"
              />

            </div>

            <div className="nh-form-group">

              <label>
                Date
              </label>

              <input
                type="date"
                value={
                  newInvestigation.date
                }
                onChange={(event) =>
                  setNewInvestigation({
                    ...newInvestigation,
                    date: event.target.value
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
                  newInvestigation.status
                }
                onChange={(event) =>
                  setNewInvestigation({
                    ...newInvestigation,
                    status: event.target.value
                  })
                }
              >

                <option value="Planned">
                  Planned
                </option>

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
                Start Time
              </label>

              <input
                type="time"
                value={
                  newInvestigation.startTime
                }
                onChange={(event) =>
                  setNewInvestigation({
                    ...newInvestigation,
                    startTime:
                      event.target.value
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
                  newInvestigation.endTime
                }
                onChange={(event) =>
                  setNewInvestigation({
                    ...newInvestigation,
                    endTime:
                      event.target.value
                  })
                }
              />

            </div>

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Team
              </label>

              <input
                type="text"
                value={
                  newInvestigation.teamName
                }
                onChange={(event) =>
                  setNewInvestigation({
                    ...newInvestigation,
                    teamName:
                      event.target.value
                  })
                }
                placeholder="Investigation team"
              />

            </div>

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Personnel
              </label>

              <div className="nh-personnel-selector">

                {loadingMembers ? (

                  <div className="nh-case-detail-empty">
                    Loading personnel...
                  </div>

                ) : members.length === 0 ? (

                  <div className="nh-case-detail-empty">
                    No personnel records available.
                  </div>

                ) : (

                  members.map((member) => {

                    const selected =
                      newInvestigation.personnelIds?.includes(
                        member.firestoreId
                      );

                    return (

                      <button
                        type="button"
                        key={member.firestoreId}
                        className={
                          selected
                            ? "nh-personnel-option selected"
                            : "nh-personnel-option"
                        }
                        onClick={() =>
                          togglePersonnel(
                            member.firestoreId
                          )
                        }
                      >

                        <span className="nh-personnel-option-check">

                          {selected
                            ? "✓"
                            : ""}

                        </span>

                        <span>

                          <strong>
                            {member.name ||
                              "Unnamed Member"}
                          </strong>

                          <small>
                            {member.position ||
                              "Personnel"}
                          </small>

                        </span>

                      </button>

                    );

                  })

                )}

              </div>

            </div>

            <div className="nh-form-group nh-form-group-wide">

              <label>
                Description
              </label>

              <textarea
                rows="5"
                value={
                  newInvestigation.description
                }
                onChange={(event) =>
                  setNewInvestigation({
                    ...newInvestigation,
                    description:
                      event.target.value
                  })
                }
                placeholder="Investigation notes or purpose"
              />

            </div>

          </div>

        </div>

        <div className="nh-modal-footer">

          <button
            className="nh-secondary-button"
            onClick={() =>
              setShowInvestigationModal(false)
            }
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="nh-primary-button"
            onClick={createInvestigation}
            disabled={saving}
          >
            {saving
              ? "Creating..."
              : "Create Investigation"}
          </button>

        </div>

      </div>

    </div>

  )}

    </div>
  );
}

export default CaseDetail;