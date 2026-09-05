import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase/config";

function Members() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);

  const [newMember, setNewMember] = useState({
    name: "",
    position: "Investigator",
    team: "Investigation",
    status: "Active",
    dateJoined: "",
    phone: "",
    email: "",
    address: "",
    certifications: [],
    training: "Incomplete",
    beliefs: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });

  /* =========================================================
     LOAD MEMBERS
     ========================================================= */

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(
        collection(db, "members")
      );

      const loadedMembers = snapshot.docs.map((memberDoc) => ({
        firestoreId: memberDoc.id,
        ...memberDoc.data(),
      }));

      loadedMembers.sort((a, b) =>
        (a.memberId || "").localeCompare(
          b.memberId || "",
          undefined,
          { numeric: true }
        )
      );

      setMembers(loadedMembers);
    } catch (err) {
      console.error("Error loading members:", err);

      setError(
        "Unable to load personnel records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  /* =========================================================
     GENERATE MEMBER ID
     ========================================================= */

  const generateMemberId = () => {
    let highestNumber = 0;

    members.forEach((member) => {
      const match = String(
        member.memberId || ""
      ).match(/^MEM-(\d+)$/);

      if (match) {
        const number = Number(match[1]);

        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    return `MEM-${String(
      highestNumber + 1
    ).padStart(3, "0")}`;
  };

  /* =========================================================
     DELETE MEMBER
     ========================================================= */

  const handleDeleteMember = async (member) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${member.name}?\n\nThis cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteDoc(
        doc(db, "members", member.firestoreId)
      );

      setMembers((currentMembers) =>
        currentMembers.filter(
          (item) =>
            item.firestoreId !== member.firestoreId
        )
      );
    } catch (err) {
      console.error(
        "Error deleting member:",
        err
      );

      setError(
        "Unable to delete member."
      );
    }
  };

  /* =========================================================
     ADD MEMBER
     ========================================================= */

  const handleAddMember = async () => {
    if (!newMember.name.trim()) {
      setError("Member name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const memberId = generateMemberId();

      const memberRecord = {
        memberId,

        name: newMember.name.trim(),

        position: newMember.position,

        team: newMember.team,

        status: newMember.status,

        dateJoined:
          newMember.dateJoined || null,

        phone:
          newMember.phone.trim(),

        email:
          newMember.email.trim(),

        address:
          newMember.address.trim(),

        certifications:
          newMember.certifications,

        training:
          newMember.training,

        beliefs:
          newMember.beliefs.trim(),

        emergencyContact: {
          name:
            newMember.emergencyContactName.trim(),

          phone:
            newMember.emergencyContactPhone.trim(),

          relationship:
            newMember.emergencyContactRelationship.trim(),
        },

        caseIds: [],

        authorizedReportIds: [],

        trainingIds: [],

        personnelActionIds: [],

        signedDocumentIds: [],

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, "members"),
        memberRecord
      );

      setNewMember({
        name: "",
        position: "Investigator",
        team: "Investigation",
        status: "Active",
        dateJoined: "",
        phone: "",
        email: "",
        address: "",
        certifications: [],
        training: "Incomplete",
        beliefs: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
      });

      setShowAddMember(false);

      await loadMembers();
    } catch (err) {
      console.error(
        "Error creating member:",
        err
      );

      setError(
        "Unable to create the member record."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     FILTER MEMBERS
     ========================================================= */

  const filteredMembers = members.filter(
    (member) => {
      const searchValue =
        search.toLowerCase();

      const matchesSearch =
        (member.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        (member.memberId || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        member.status === statusFilter;

      const matchesTeam =
        teamFilter === "All" ||
        member.team === teamFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTeam
      );
    }
  );

  /* =========================================================
     MEMBER STATS
     ========================================================= */

  const activeMembers =
    members.filter(
      (member) =>
        member.status === "Active"
    ).length;

  const investigationMembers =
    members.filter(
      (member) =>
        member.team === "Investigation"
    ).length;

  const administrationMembers =
    members.filter(
      (member) =>
        member.team === "Administration"
    ).length;

  /* =========================================================
     LOADING SCREEN
     ========================================================= */

  if (loading) {
    return (
      <div className="nh-page">
        <div className="nh-loading-state">
          Loading personnel directory...
        </div>
      </div>
    );
  }

  return (
    <div className="nh-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="nh-page-header">

        <div>
          <h1 className="nh-page-title">
            Members
          </h1>

          <p className="nh-page-subtitle">
            New Horizon personnel directory and member management.
          </p>
        </div>

        <button
          className="nh-button nh-button-primary"
          onClick={() => {
            setError("");
            setShowAddMember(true);
          }}
        >
          + Add Member
        </button>

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
          MEMBER SUMMARY
          ===================================================== */}

      <section className="nh-member-summary-grid">

        <div className="nh-card nh-member-summary-card">
          <span>
            TOTAL MEMBERS
          </span>

          <strong>
            {members.length}
          </strong>
        </div>

        <div className="nh-card nh-member-summary-card">
          <span>
            ACTIVE
          </span>

          <strong>
            {activeMembers}
          </strong>
        </div>

        <div className="nh-card nh-member-summary-card">
          <span>
            INVESTIGATION
          </span>

          <strong>
            {investigationMembers}
          </strong>
        </div>

        <div className="nh-card nh-member-summary-card">
          <span>
            ADMINISTRATION
          </span>

          <strong>
            {administrationMembers}
          </strong>
        </div>

      </section>

      {/* =====================================================
          DIRECTORY CONTROLS
          ===================================================== */}

      <section className="nh-member-controls nh-card">

        <div className="nh-member-search">
          <input
            type="text"
            placeholder="Search by name or member ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          value={teamFilter}
          onChange={(e) =>
            setTeamFilter(e.target.value)
          }
        >
          <option value="All">
            All Teams
          </option>

          <option value="Administration">
            Administration
          </option>

          <option value="Investigation">
            Investigation
          </option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="All">
            All Statuses
          </option>

          <option value="Active">
            Active
          </option>

          <option value="Inactive">
            Inactive
          </option>
        </select>

      </section>

      {/* =====================================================
          MEMBER DIRECTORY
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <h2 className="nh-section-title">
            Personnel Directory
          </h2>

          <span className="nh-member-count">
            {filteredMembers.length} members
          </span>

        </div>

        <div className="nh-card nh-member-table">

          {/* TABLE HEADER */}

          <div className="nh-member-row nh-member-header">

            <div>
              Member
            </div>

            <div>
              Position
            </div>

            <div>
              Team
            </div>

            <div>
              Status
            </div>

            <div>
              Training
            </div>

            <div>
              Actions
            </div>

          </div>

          {/* MEMBERS */}

          {filteredMembers.map((member) => (
            <div
              className="nh-member-row"
              key={member.firestoreId}
            >

              {/* MEMBER */}

              <div className="nh-member-identity">

                <div className="nh-member-avatar">
                  {(member.name || "N")
                    .split(" ")
                    .map(
                      (name) =>
                        name[0]
                    )
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>

                  <div className="nh-list-title">
                    {member.name}
                  </div>

                  <div className="nh-list-meta">
                    {member.memberId}
                  </div>

                </div>

              </div>

              {/* POSITION */}

              <div className="nh-member-position">
                {member.position || "N/A"}
              </div>

              {/* TEAM */}

              <div className="nh-member-team">
                {member.team || "N/A"}
              </div>

              {/* STATUS */}

              <div>

                <span
                  className={
                    member.status === "Active"
                      ? "nh-status nh-status-active"
                      : "nh-status nh-status-warning"
                  }
                >
                  {member.status || "Unknown"}
                </span>

              </div>

              {/* TRAINING */}

              <div>

                <div
                  className={
                    member.training === "Complete"
                      ? "nh-training-complete"
                      : "nh-training-incomplete"
                  }
                >
                  {member.training || "Incomplete"}
                </div>

                <div className="nh-list-meta">
                  {Array.isArray(
                    member.certifications
                  )
                    ? member.certifications.length
                    : 0}
                  {" "}
                  certifications
                </div>

              </div>

              {/* ACTIONS */}

              <div className="nh-member-actions">

                <button
                  className="nh-member-profile-button"
                  onClick={() =>
                    navigate(
                      `/members/${member.firestoreId}`
                    )
                  }
                >
                  View Profile →
                </button>

                <button
                  className="nh-delete-button"
                  onClick={() =>
                    handleDeleteMember(member)
                  }
                >
                  Delete
                </button>

              </div>

            </div>
          ))}

          {/* EMPTY STATE */}

          {filteredMembers.length === 0 && (
            <div className="nh-member-empty">
              {members.length === 0
                ? "No personnel records have been created yet."
                : "No members match the current filters."}
            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          ADD MEMBER MODAL
          ===================================================== */}

      {showAddMember && (
        <div
          className="nh-modal-overlay"
          onClick={() =>
            setShowAddMember(false)
          }
        >

          <div
            className="nh-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="nh-modal-header">

              <div>

                <div className="nh-command-label">
                  PERSONNEL MANAGEMENT
                </div>

                <h2>
                  Add Member
                </h2>

              </div>

              <button
                className="nh-modal-close"
                onClick={() =>
                  setShowAddMember(false)
                }
              >
                ×
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="nh-modal-body">

              <div className="nh-modal-notice">
                A unique member ID will be automatically
                assigned when this personnel record is created.
              </div>

              <div className="nh-form-grid">

                {/* NAME */}

                <div className="nh-form-group nh-form-group-wide">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        name: e.target.value,
                      })
                    }
                    placeholder="Full legal name"
                  />

                </div>

                {/* POSITION */}

                <div className="nh-form-group">

                  <label>
                    Position
                  </label>

                  <select
                    value={newMember.position}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        position: e.target.value,
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
                    value={newMember.team}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        team: e.target.value,
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
                    value={newMember.status}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        status: e.target.value,
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
                    value={newMember.dateJoined}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
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
                    value={newMember.phone}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Phone number"
                  />

                </div>

                {/* EMAIL */}

                <div className="nh-form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        email: e.target.value,
                      })
                    }
                    placeholder="Email address"
                  />

                </div>

                {/* ADDRESS */}

                <div className="nh-form-group nh-form-group-wide">

                  <label>
                    Address
                  </label>

                  <input
                    type="text"
                    value={newMember.address}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        address: e.target.value,
                      })
                    }
                    placeholder="Residential address"
                  />

                </div>

                {/* TRAINING */}

                <div className="nh-form-group">

                  <label>
                    Training Status
                  </label>

                  <select
                    value={newMember.training}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        training: e.target.value,
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
                    value={newMember.beliefs}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        beliefs: e.target.value,
                      })
                    }
                    placeholder="Optional notes regarding investigator beliefs or approach"
                    rows="3"
                  />

                </div>

              </div>

              {/* =================================================
                  EMERGENCY CONTACT
                  ================================================= */}

              <div className="nh-form-section-title">
                Emergency Contact
              </div>

              <div className="nh-form-grid">

                {/* CONTACT NAME */}

                <div className="nh-form-group">

                  <label>
                    Contact Name
                  </label>

                  <input
                    type="text"
                    value={
                      newMember.emergencyContactName
                    }
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        emergencyContactName:
                          e.target.value,
                      })
                    }
                    placeholder="Emergency contact"
                  />

                </div>

                {/* RELATIONSHIP */}

                <div className="nh-form-group">

                  <label>
                    Relationship
                  </label>

                  <input
                    type="text"
                    value={
                      newMember.emergencyContactRelationship
                    }
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        emergencyContactRelationship:
                          e.target.value,
                      })
                    }
                    placeholder="Relationship"
                  />

                </div>

                {/* CONTACT PHONE */}

                <div className="nh-form-group">

                  <label>
                    Contact Phone
                  </label>

                  <input
                    type="tel"
                    value={
                      newMember.emergencyContactPhone
                    }
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        emergencyContactPhone:
                          e.target.value,
                      })
                    }
                    placeholder="Emergency phone number"
                  />

                </div>

              </div>

            </div>

            {/* =================================================
                MODAL FOOTER
                ================================================= */}

            <div className="nh-modal-footer">

              <button
                className="nh-button nh-button-secondary"
                onClick={() =>
                  setShowAddMember(false)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="nh-button nh-button-primary"
                onClick={handleAddMember}
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create Member"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Members;