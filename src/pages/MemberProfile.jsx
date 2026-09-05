import {
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

function MemberProfile() {
  const navigate = useNavigate();
  const { memberId } = useParams();

  const [member, setMember] = useState(null);
  const [cases, setCases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showEdit, setShowEdit] = useState(false);

  const [editMember, setEditMember] = useState(null);

  /* =========================================================
     LOAD MEMBER
     ========================================================= */

  const loadMember = async () => {
    try {
      setLoading(true);
      setError("");

      const memberRef = doc(
        db,
        "members",
        memberId
      );

      const memberSnapshot =
        await getDoc(memberRef);

      if (!memberSnapshot.exists()) {
        setMember(null);
        setError(
          "Personnel record could not be found."
        );
        return;
      }

      const memberData = {
        firestoreId: memberSnapshot.id,
        ...memberSnapshot.data(),
      };

      setMember(memberData);

      setEditMember({
        name: memberData.name || "",
        position:
          memberData.position ||
          "Investigator",
        team:
          memberData.team ||
          "Investigation",
        status:
          memberData.status ||
          "Active",
        dateJoined:
          memberData.dateJoined || "",
        phone:
          memberData.phone || "",
        email:
          memberData.email || "",
        address:
          memberData.address || "",
        beliefs:
          memberData.beliefs || "",
        training:
          memberData.training ||
          "Incomplete",
        emergencyContactName:
          memberData.emergencyContact?.name ||
          "",
        emergencyContactPhone:
          memberData.emergencyContact?.phone ||
          "",
        emergencyContactRelationship:
          memberData.emergencyContact
            ?.relationship || "",
      });

      /* =====================================================
         LOAD RELATED CASES
         ===================================================== */

      const casesSnapshot =
        await getDocs(
          collection(db, "cases")
        );

      const relatedCases =
        casesSnapshot.docs
          .map((caseDoc) => ({
            firestoreId: caseDoc.id,
            ...caseDoc.data(),
          }))
          .filter((caseItem) => {
            const memberIds =
              Array.isArray(
                caseItem.memberIds
              )
                ? caseItem.memberIds
                : [];

            return memberIds.includes(
              memberSnapshot.id
            );
          });

      setCases(relatedCases);
    } catch (err) {
      console.error(
        "Error loading member profile:",
        err
      );

      setError(
        "Unable to load this personnel record."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) {
      loadMember();
    }
  }, [memberId]);

  /* =========================================================
     SAVE MEMBER
     ========================================================= */

  const handleSaveMember = async () => {
    if (!editMember.name.trim()) {
      setError("Member name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const memberRef = doc(
        db,
        "members",
        memberId
      );

      const updatedRecord = {
        name: editMember.name.trim(),

        position:
          editMember.position,

        team:
          editMember.team,

        status:
          editMember.status,

        dateJoined:
          editMember.dateJoined || null,

        phone:
          editMember.phone.trim(),

        email:
          editMember.email.trim(),

        address:
          editMember.address.trim(),

        beliefs:
          editMember.beliefs.trim(),

        training:
          editMember.training,

        emergencyContact: {
          name:
            editMember.emergencyContactName.trim(),

          phone:
            editMember.emergencyContactPhone.trim(),

          relationship:
            editMember.emergencyContactRelationship.trim(),
        },

        updatedAt:
          serverTimestamp(),
      };

      await updateDoc(
        memberRef,
        updatedRecord
      );

      setMember((currentMember) => ({
        ...currentMember,
        ...updatedRecord,
        updatedAt: new Date(),
      }));

      setShowEdit(false);
    } catch (err) {
      console.error(
        "Error updating member:",
        err
      );

      setError(
        "Unable to save personnel changes."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     INITIALS
     ========================================================= */

  const getInitials = (name) => {
    if (!name) {
      return "NH";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  /* =========================================================
     DATE FORMATTER
     ========================================================= */

  const formatDate = (value) => {
    if (!value) {
      return "N/A";
    }

    if (
      typeof value === "object" &&
      value.toDate
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
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="nh-page">
        <div className="nh-loading-state">
          Loading personnel record...
        </div>
      </div>
    );
  }

  /* =========================================================
     NOT FOUND
     ========================================================= */

  if (!member) {
    return (
      <div className="nh-page">

        <div className="nh-page-header">

          <div>
            <div className="nh-command-label">
              PERSONNEL DATABASE
            </div>

            <h1 className="nh-page-title">
              Member Not Found
            </h1>

            <p className="nh-page-subtitle">
              The requested personnel record could not
              be located.
            </p>
          </div>

          <button
            className="nh-button nh-button-secondary"
            onClick={() =>
              navigate("/members")
            }
          >
            ← Back to Members
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

  /* =========================================================
     PROFILE
     ========================================================= */

  return (
    <div className="nh-page nh-member-profile-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="nh-member-profile-header">

        <div>

          <div className="nh-member-profile-title-row">

            <div className="nh-member-profile-avatar">
              {getInitials(member.name)}
            </div>

            <div>

              <div className="nh-command-label">
                PERSONNEL RECORD
              </div>

              <h1 className="nh-page-title">
                {member.name}
              </h1>

              <div className="nh-member-profile-id">
                {member.memberId}
              </div>

            </div>

          </div>

        </div>

        <div className="nh-member-profile-actions">

          <button
            className="nh-button nh-button-secondary"
            onClick={() =>
              navigate("/members")
            }
          >
            ← Directory
          </button>

          <button
            className="nh-button nh-button-primary"
            onClick={() => {
              setError("");
              setShowEdit(true);
            }}
          >
            Edit Member
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
            POSITION
          </span>

          <strong>
            {member.position || "N/A"}
          </strong>
        </div>

        <div>
          <span>
            TEAM
          </span>

          <strong>
            {member.team || "N/A"}
          </strong>
        </div>

        <div>
          <span>
            STATUS
          </span>

          <strong>
            {member.status || "N/A"}
          </strong>
        </div>

        <div>
          <span>
            MEMBER SINCE
          </span>

          <strong>
            {formatDate(
              member.dateJoined
            )}
          </strong>
        </div>

      </div>

      {/* =====================================================
          BASIC INFORMATION
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              IDENTITY
            </div>

            <h2>
              Member Information
            </h2>

            <p>
              Primary personnel information.
            </p>
          </div>

        </div>

        <div className="nh-profile-grid">

          <div className="nh-profile-field">

            <span>
              MEMBER ID
            </span>

            <strong>
              {member.memberId || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              FULL NAME
            </span>

            <strong>
              {member.name || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              POSITION
            </span>

            <strong>
              {member.position || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              TEAM
            </span>

            <strong>
              {member.team || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              STATUS
            </span>

            <strong>
              {member.status || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              DATE JOINED
            </span>

            <strong>
              {formatDate(
                member.dateJoined
              )}
            </strong>

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTACT INFORMATION
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              CONTACT
            </div>

            <h2>
              Contact Information
            </h2>

            <p>
              Personnel contact information.
            </p>
          </div>

        </div>

        <div className="nh-profile-grid">

          <div className="nh-profile-field">

            <span>
              PHONE
            </span>

            <strong>
              {member.phone || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              EMAIL
            </span>

            <strong>
              {member.email || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field nh-profile-field-wide">

            <span>
              ADDRESS
            </span>

            <strong className="nh-restricted-value">
              {member.address || "N/A"}
            </strong>

            <div className="nh-restricted-label">
              Restricted Personnel Information
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          EMERGENCY CONTACT
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              SAFETY
            </div>

            <h2>
              Emergency Contact
            </h2>

            <p>
              Emergency contact information.
            </p>
          </div>

        </div>

        <div className="nh-profile-grid">

          <div className="nh-profile-field">

            <span>
              CONTACT NAME
            </span>

            <strong>
              {member.emergencyContact
                ?.name || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              RELATIONSHIP
            </span>

            <strong>
              {member.emergencyContact
                ?.relationship || "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              PHONE
            </span>

            <strong>
              {member.emergencyContact
                ?.phone || "N/A"}
            </strong>

          </div>

        </div>

      </section>

      {/* =====================================================
          CERTIFICATIONS
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              QUALIFICATIONS
            </div>

            <h2>
              Certifications
            </h2>

            <p>
              Professional certifications recorded for this member.
            </p>
          </div>

        </div>

        {Array.isArray(
          member.certifications
        ) &&
        member.certifications.length > 0 ? (

          <div className="nh-member-certification-list">

            {member.certifications.map(
              (certification, index) => (
                <div
                  className="nh-member-certification"
                  key={index}
                >

                  <span>
                    CERTIFICATION
                  </span>

                  <strong>
                    {typeof certification ===
                    "string"
                      ? certification
                      : certification.name ||
                        "Unnamed Certification"}
                  </strong>

                </div>
              )
            )}

          </div>

        ) : (

          <div className="nh-empty-state">
            No certifications have been recorded.
          </div>

        )}

      </section>

      {/* =====================================================
          TRAINING
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              TRAINING
            </div>

            <h2>
              Training History
            </h2>

            <p>
              Training status and completed courses.
            </p>
          </div>

        </div>

        <div className="nh-profile-grid">

          <div className="nh-profile-field">

            <span>
              CURRENT TRAINING STATUS
            </span>

            <strong>
              {member.training ||
                "Incomplete"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              LINKED TRAINING RECORDS
            </span>

            <strong>
              {Array.isArray(
                member.trainingIds
              )
                ? member.trainingIds.length
                : 0}
            </strong>

          </div>

        </div>

      </section>

      {/* =====================================================
          CASE PARTICIPATION
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              OPERATIONS
            </div>

            <h2>
              Cases Participated In
            </h2>

            <p>
              Cases automatically linked to this member.
            </p>
          </div>

          <span className="nh-member-count">
            {cases.length} cases
          </span>

        </div>

        {cases.length > 0 ? (

          <div className="nh-related-record-list">

            {cases.map((caseItem) => (

              <button
                key={caseItem.firestoreId}
                className="nh-related-record"
                onClick={() =>
                  navigate(
                    `/cases/${caseItem.firestoreId}`
                  )
                }
              >

                <div>

                  <div className="nh-list-title">
                    {caseItem.name ||
                      "Unnamed Case"}
                  </div>

                  <div className="nh-list-meta">
                    {caseItem.id ||
                      "Case"}
                  </div>

                </div>

                <div className="nh-related-record-arrow">
                  →
                </div>

              </button>

            ))}

          </div>

        ) : (

          <div className="nh-empty-state">
            No cases are currently linked to this member.
          </div>

        )}

      </section>

      {/* =====================================================
          AUTHORIZED REPORTS
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              AUTHORIZATION
            </div>

            <h2>
              Authorized Reports
            </h2>

            <p>
              Investigation reports this member is authorized to access or approve.
            </p>
          </div>

        </div>

        {Array.isArray(
          member.authorizedReportIds
        ) &&
        member.authorizedReportIds.length > 0 ? (

          <div className="nh-record-id-list">

            {member.authorizedReportIds.map(
              (reportId) => (
                <div
                  className="nh-record-id"
                  key={reportId}
                >
                  {reportId}
                </div>
              )
            )}

          </div>

        ) : (

          <div className="nh-empty-state">
            No authorized reports are currently linked.
          </div>

        )}

      </section>

      {/* =====================================================
          PERSONNEL ACTIONS
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              PERSONNEL
            </div>

            <h2>
              Personnel Actions
            </h2>

            <p>
              Promotions, demotions, write-ups, and other personnel actions.
            </p>
          </div>

        </div>

        {Array.isArray(
          member.personnelActionIds
        ) &&
        member.personnelActionIds.length > 0 ? (

          <div className="nh-record-id-list">

            {member.personnelActionIds.map(
              (actionId) => (
                <div
                  className="nh-record-id"
                  key={actionId}
                >
                  {actionId}
                </div>
              )
            )}

          </div>

        ) : (

          <div className="nh-empty-state">
            No personnel actions have been recorded.
          </div>

        )}

      </section>

      {/* =====================================================
          SIGNED DOCUMENTS
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              DOCUMENTATION
            </div>

            <h2>
              Signed Documents
            </h2>

            <p>
              Documents and acknowledgements signed by this member.
            </p>
          </div>

        </div>

        {Array.isArray(
          member.signedDocumentIds
        ) &&
        member.signedDocumentIds.length > 0 ? (

          <div className="nh-record-id-list">

            {member.signedDocumentIds.map(
              (documentId) => (
                <div
                  className="nh-record-id"
                  key={documentId}
                >
                  {documentId}
                </div>
              )
            )}

          </div>

        ) : (

          <div className="nh-empty-state">
            No signed documents are currently linked.
          </div>

        )}

      </section>

      {/* =====================================================
          PERMISSIONS / CLEARANCE
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              SECURITY
            </div>

            <h2>
              Permissions & Clearance
            </h2>

            <p>
              Access level determined by organizational position.
            </p>
          </div>

        </div>

        <div className="nh-profile-grid">

          <div className="nh-profile-field">

            <span>
              POSITION
            </span>

            <strong>
              {member.position ||
                "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              TEAM
            </span>

            <strong>
              {member.team ||
                "N/A"}
            </strong>

          </div>

          <div className="nh-profile-field nh-profile-field-wide">

            <span>
              CLEARANCE
            </span>

            <strong>
              Position-Based Access
            </strong>

            <div className="nh-list-meta">
              Detailed permissions will be controlled by the NHIS permission system.
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          BELIEFS
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              INVESTIGATOR PROFILE
            </div>

            <h2>
              Beliefs & Approach
            </h2>

            <p>
              Information recorded regarding the member's investigative approach.
            </p>
          </div>

        </div>

        <div className="nh-member-profile-text">
          {member.beliefs ||
            "No information has been recorded."}
        </div>

      </section>

      {/* =====================================================
          ACTIVITY / SYSTEM HISTORY
          ===================================================== */}

      <section className="nh-member-profile-section">

        <div className="nh-case-file-section-header">

          <div>
            <div className="nh-command-label">
              SYSTEM
            </div>

            <h2>
              Activity & History
            </h2>

            <p>
              System information associated with this personnel record.
            </p>
          </div>

        </div>

        <div className="nh-profile-grid">

          <div className="nh-profile-field">

            <span>
              RECORD CREATED
            </span>

            <strong>
              {formatDate(
                member.createdAt
              )}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              LAST UPDATED
            </span>

            <strong>
              {formatDate(
                member.updatedAt
              )}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              CASE PARTICIPATION
            </span>

            <strong>
              {cases.length}
            </strong>

          </div>

          <div className="nh-profile-field">

            <span>
              TRAINING RECORDS
            </span>

            <strong>
              {Array.isArray(
                member.trainingIds
              )
                ? member.trainingIds.length
                : 0}
            </strong>

          </div>

        </div>

      </section>

      {/* =====================================================
          EDIT MEMBER MODAL
          ===================================================== */}

      {showEdit &&
        editMember && (
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

              {/* HEADER */}

              <div className="nh-modal-header">

                <div>

                  <div className="nh-command-label">
                    PERSONNEL MANAGEMENT
                  </div>

                  <h2>
                    Edit Member
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

              {/* BODY */}

              <div className="nh-modal-body">

                <div className="nh-form-grid">

                  {/* NAME */}

                  <div className="nh-form-group nh-form-group-wide">

                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={
                        editMember.name
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          name:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  {/* POSITION */}

                  <div className="nh-form-group">

                    <label>
                      Position
                    </label>

                    <select
                      value={
                        editMember.position
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          position:
                            e.target.value,
                        })
                      }
                    >

                      <option value="Director">
                        Director
                      </option>

                      <option value="Team Lead">
                        Team Lead
                      </option>

                      <option value="Assistant Team Lead">
                        Assistant Team Lead
                      </option>

                      <option value="Investigator">
                        Investigator
                      </option>

                      <option value="Specialist">
                        Specialist
                      </option>

                    </select>

                  </div>

                  {/* TEAM */}

                  <div className="nh-form-group">

                    <label>
                      Team
                    </label>

                    <select
                      value={
                        editMember.team
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          team:
                            e.target.value,
                        })
                      }
                    >

                      <option value="Administration">
                        Administration
                      </option>

                      <option value="Investigation">
                        Investigation
                      </option>

                    </select>

                  </div>

                  {/* STATUS */}

                  <div className="nh-form-group">

                    <label>
                      Status
                    </label>

                    <select
                      value={
                        editMember.status
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          status:
                            e.target.value,
                        })
                      }
                    >

                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>

                    </select>

                  </div>

                  {/* DATE JOINED */}

                  <div className="nh-form-group">

                    <label>
                      Date Joined
                    </label>

                    <input
                      type="date"
                      value={
                        editMember.dateJoined
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          dateJoined:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  {/* PHONE */}

                  <div className="nh-form-group">

                    <label>
                      Phone
                    </label>

                    <input
                      type="tel"
                      value={
                        editMember.phone
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          phone:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  {/* EMAIL */}

                  <div className="nh-form-group">

                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      value={
                        editMember.email
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          email:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  {/* ADDRESS */}

                  <div className="nh-form-group nh-form-group-wide">

                    <label>
                      Address
                    </label>

                    <input
                      type="text"
                      value={
                        editMember.address
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          address:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  {/* TRAINING */}

                  <div className="nh-form-group">

                    <label>
                      Training Status
                    </label>

                    <select
                      value={
                        editMember.training
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          training:
                            e.target.value,
                        })
                      }
                    >

                      <option value="Incomplete">
                        Incomplete
                      </option>

                      <option value="Complete">
                        Complete
                      </option>

                    </select>

                  </div>

                  {/* BELIEFS */}

                  <div className="nh-form-group nh-form-group-wide">

                    <label>
                      Beliefs
                    </label>

                    <textarea
                      value={
                        editMember.beliefs
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          beliefs:
                            e.target.value,
                        })
                      }
                      rows="4"
                    />

                  </div>

                </div>

                {/* EMERGENCY CONTACT */}

                <div className="nh-form-section-title">
                  Emergency Contact
                </div>

                <div className="nh-form-grid">

                  <div className="nh-form-group">

                    <label>
                      Contact Name
                    </label>

                    <input
                      type="text"
                      value={
                        editMember.emergencyContactName
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          emergencyContactName:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="nh-form-group">

                    <label>
                      Relationship
                    </label>

                    <input
                      type="text"
                      value={
                        editMember.emergencyContactRelationship
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          emergencyContactRelationship:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="nh-form-group">

                    <label>
                      Contact Phone
                    </label>

                    <input
                      type="tel"
                      value={
                        editMember.emergencyContactPhone
                      }
                      onChange={(e) =>
                        setEditMember({
                          ...editMember,
                          emergencyContactPhone:
                            e.target.value,
                        })
                      }
                    />

                  </div>

                </div>

              </div>

              {/* FOOTER */}

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
                    handleSaveMember
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

    </div>
  );
}

export default MemberProfile;