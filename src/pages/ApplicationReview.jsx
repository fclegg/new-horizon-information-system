import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/config";

const DIRECTOR_EMAIL = "newhorizonparanormal@gmail.com";

function ApplicationReview() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("pending");
  const [directorNotes, setDirectorNotes] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const email = user.email?.trim().toLowerCase();

      if (email !== DIRECTOR_EMAIL.toLowerCase()) {
        navigate("/");
        return;
      }

      try {
        const applicationRef = doc(db, "applications", applicationId);
        const snapshot = await getDoc(applicationRef);

        if (!snapshot.exists()) {
          setError("Application not found.");
          setLoading(false);
          return;
        }

        const data = snapshot.data();

        setApplication({
          id: snapshot.id,
          ...data,
        });

        setStatus(data.status || "pending");
        setDirectorNotes(data.directorNotes || "");
      } catch (err) {
        console.error("Error loading application:", err);
        setError("Unable to load application.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [applicationId, navigate]);

  const saveReview = async (newStatus = status) => {
    if (!applicationId) return;

    setSaving(true);
    setError("");

    try {
      const applicationRef = doc(db, "applications", applicationId);

      await updateDoc(applicationRef, {
        status: newStatus,
        directorNotes: directorNotes.trim(),
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.email || DIRECTOR_EMAIL,
      });

      setStatus(newStatus);

      setApplication((previous) => ({
        ...previous,
        status: newStatus,
        directorNotes: directorNotes.trim(),
      }));

      alert("Application review saved.");
    } catch (err) {
      console.error("Error saving application:", err);
      setError("Unable to save the application review.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";

    if (value?.toDate) {
      return value.toDate().toLocaleDateString();
    }

    if (typeof value === "string") {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }

      return value;
    }

    return "—";
  };

  const valueOrDash = (value) => {
    if (value === undefined || value === null || value === "") {
      return "—";
    }

    return value;
  };

  if (loading) {
    return (
      <div className="application-review-page">
        <div className="application-review-loading">
          Loading application...
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="application-review-page">
        <div className="application-review-header">
          <button
            className="application-back-button"
            onClick={() => navigate("/applications")}
          >
            ← Back to Applications
          </button>

          <h1>Application Review</h1>
        </div>

        <div className="application-error">
          {error}
        </div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="application-review-page">

      {/* HEADER */}
      <div className="application-review-header">
        <div>
          <button
            className="application-back-button"
            onClick={() => navigate("/applications")}
          >
            ← Back to Applications
          </button>

          <div className="application-review-title-row">
            <div>
              <h1>
                {valueOrDash(application.firstName)}{" "}
                {valueOrDash(application.lastName)}
              </h1>

              <p>
                Membership Application • ID: {application.id}
              </p>
            </div>

            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      {error && (
        <div className="application-error">
          {error}
        </div>
      )}

      {/* APPLICATION INFORMATION */}
      <section className="application-section">
        <div className="application-section-header">
          <div>
            <span className="application-section-label">
              APPLICANT
            </span>

            <h2>Personal Information</h2>
          </div>
        </div>

        <div className="application-grid">
          <InfoCard
            label="First Name"
            value={application.firstName}
          />

          <InfoCard
            label="Last Name"
            value={application.lastName}
          />

          <InfoCard
            label="Date of Birth"
            value={formatDate(application.dateOfBirth)}
          />

          <InfoCard
            label="Gender"
            value={application.gender}
          />

          <InfoCard
            label="Phone Number"
            value={application.phoneNumber}
          />

          <InfoCard
            label="Email"
            value={application.email}
          />

          <InfoCard
            label="Address"
            value={application.address}
          />

          <InfoCard
            label="City"
            value={application.city}
          />

          <InfoCard
            label="State"
            value={application.state}
          />
        </div>
      </section>

      {/* AVAILABILITY */}
      <section className="application-section">
        <div className="application-section-header">
          <div>
            <span className="application-section-label">
              AVAILABILITY
            </span>

            <h2>Scheduling Information</h2>
          </div>
        </div>

        <div className="application-grid">
          <InfoCard
            label="Weekly Availability"
            value={application.availability}
          />

          <InfoCard
            label="Available Start Date"
            value={formatDate(application.dateAvailable)}
          />

          <InfoCard
            label="Reliable Transportation"
            value={application.transportation}
          />
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="application-section">
        <div className="application-section-header">
          <div>
            <span className="application-section-label">
              BACKGROUND
            </span>

            <h2>Experience & Qualifications</h2>
          </div>
        </div>

        <div className="application-grid">
          <InfoCard
            label="Previous Experience"
            value={application.experience}
            fullWidth
          />

          <InfoCard
            label="Desired Position"
            value={application.desiredPosition}
          />

          <InfoCard
            label="Known Languages"
            value={application.languages}
          />
        </div>
      </section>

      {/* ADDITIONAL INFORMATION */}
      <section className="application-section">
        <div className="application-section-header">
          <div>
            <span className="application-section-label">
              ADDITIONAL
            </span>

            <h2>Additional Information</h2>
          </div>
        </div>

        <div className="application-grid">
          <InfoCard
            label="Religion / Belief"
            value={application.religion}
          />

          <InfoCard
            label="How Did You Hear About Us?"
            value={application.heardAboutUs}
          />

          <InfoCard
            label="Application Date"
            value={formatDate(application.todaysDate)}
          />
        </div>
      </section>

      {/* DIRECTOR REVIEW */}
      <section className="application-section director-review-section">
        <div className="application-section-header">
          <div>
            <span className="application-section-label">
              DIRECTOR
            </span>

            <h2>Application Review</h2>

            <p>
              Record your decision and any internal notes regarding
              this applicant.
            </p>
          </div>
        </div>

        <div className="review-controls">

          <div className="review-field">
            <label>Application Status</label>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={saving}
            >
              <option value="pending">
                Pending
              </option>

              <option value="needs_info">
                Needs More Information
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="denied">
                Denied
              </option>
            </select>
          </div>

          <div className="review-field">
            <label>Director Notes</label>

            <textarea
              value={directorNotes}
              onChange={(event) =>
                setDirectorNotes(event.target.value)
              }
              placeholder="Enter private notes about this application..."
              rows={7}
              disabled={saving}
            />
          </div>

          <div className="review-actions">
            <button
              className="review-action secondary"
              onClick={() => navigate("/applications")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              className="review-action save"
              onClick={() => saveReview("pending")}
              disabled={saving}
            >
              Save as Pending
            </button>

            <button
              className="review-action info"
              onClick={() => saveReview("needs_info")}
              disabled={saving}
            >
              Request Information
            </button>

            <button
              className="review-action deny"
              onClick={() => saveReview("denied")}
              disabled={saving}
            >
              Deny
            </button>

            <button
              className="review-action approve"
              onClick={() => saveReview("approved")}
              disabled={saving}
            >
              Approve Applicant
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}


/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({ label, value, fullWidth = false }) {
  return (
    <div
      className={`application-info-card ${
        fullWidth ? "full-width" : ""
      }`}
    >
      <div className="application-info-label">
        {label}
      </div>

      <div className="application-info-value">
        {value || "—"}
      </div>
    </div>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const statusInfo = {
    pending: {
      label: "PENDING",
      className: "pending",
    },

    needs_info: {
      label: "NEEDS INFORMATION",
      className: "needs-info",
    },

    approved: {
      label: "APPROVED",
      className: "approved",
    },

    denied: {
      label: "DENIED",
      className: "denied",
    },
  };

  const current = statusInfo[status] || statusInfo.pending;

  return (
    <div className={`application-status-badge ${current.className}`}>
      <span className="status-dot"></span>
      {current.label}
    </div>
  );
}

export default ApplicationReview;