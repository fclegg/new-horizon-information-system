import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

import { db } from "../firebase/config";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  todaysDate: "",
  locationName: "",
  locationAddressOrCoordinates: "",
  city: "",
  state: "",
  detailedDescription: "",
};

function getToday() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function LocationHistory() {
  const navigate = useNavigate();
  const { caseId, historyId } = useParams();

  const isNew = !historyId || historyId === "new";

  const [caseData, setCaseData] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(isNew);

  // ============================================================
  // LOAD CASE / LOCATION HISTORY
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        if (!caseId) {
          throw new Error("No case was specified.");
        }

        // --------------------------------------------------------
        // LOAD CASE
        // --------------------------------------------------------

        const caseRef = doc(db, "cases", caseId);
        const caseSnap = await getDoc(caseRef);

        if (!caseSnap.exists()) {
          throw new Error(
            "The associated case could not be found."
          );
        }

        const loadedCase = {
          firestoreId: caseSnap.id,
          ...caseSnap.data(),
        };

        if (cancelled) return;

        setCaseData(loadedCase);

        // --------------------------------------------------------
        // NEW LOCATION HISTORY
        // --------------------------------------------------------

        if (isNew) {
          setForm({
            ...EMPTY_FORM,

            todaysDate: getToday(),

            locationName:
              loadedCase.locationName ||
              loadedCase.name ||
              "",

            locationAddressOrCoordinates:
              loadedCase.address ||
              loadedCase.locationAddressOrCoordinates ||
              loadedCase.coordinates ||
              "",

            city: loadedCase.city || "",
            state: loadedCase.state || "",
          });

          setEditing(true);
          setLoading(false);

          return;
        }

        // --------------------------------------------------------
        // EXISTING LOCATION HISTORY
        // --------------------------------------------------------

        if (!historyId) {
          throw new Error(
            "No location history record was specified."
          );
        }

        const historyRef = doc(
          db,
          "locationHistories",
          historyId
        );

        const historySnap = await getDoc(historyRef);

        if (!historySnap.exists()) {
          throw new Error(
            "Unable to load this location history record."
          );
        }

        const historyData = historySnap.data();

        // Make sure the record belongs to this case.
        if (
          historyData.caseFirestoreId &&
          historyData.caseFirestoreId !== caseId
        ) {
          throw new Error(
            "This location history record does not belong to the selected case."
          );
        }

        setForm({
          firstName: historyData.firstName || "",
          lastName: historyData.lastName || "",
          todaysDate: historyData.todaysDate || "",

          locationName:
            historyData.locationName || "",

          locationAddressOrCoordinates:
            historyData.locationAddressOrCoordinates || "",

          city: historyData.city || "",
          state: historyData.state || "",

          detailedDescription:
            historyData.detailedDescription || "",
        });

        setEditing(false);
        setLoading(false);
      } catch (err) {
        console.error(
          "Error loading location history:",
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              "An error occurred while loading the location history."
          );

          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [caseId, historyId, isNew]);

  // ============================================================
  // FORM HELPERS
  // ============================================================

  const fullName = useMemo(() => {
    return `${form.firstName} ${form.lastName}`.trim();
  }, [form.firstName, form.lastName]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  // ============================================================
  // GET NEXT HISTORY ID
  // ============================================================

  async function getNextHistoryId() {
    const historyRef = collection(
      db,
      "locationHistories"
    );

    const snapshot = await getDocs(historyRef);

    let highestNumber = 0;

    snapshot.forEach((historyDoc) => {
      const data = historyDoc.data() || {};

      const existingId =
        typeof data.historyId === "string"
          ? data.historyId.trim()
          : "";

      if (!existingId) return;

      const match =
        existingId.match(/^LOC-(\d+)$/i);

      if (!match) return;

      const number = Number(match[1]);

      if (
        Number.isFinite(number) &&
        number > highestNumber
      ) {
        highestNumber = number;
      }
    });

    return `LOC-${String(
      highestNumber + 1
    ).padStart(4, "0")}`;
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  function validateForm() {
    const requiredFields = [
      ["firstName", "First Name"],
      ["lastName", "Last Name"],
      ["todaysDate", "Today's Date"],
      ["locationName", "Location Name"],
      [
        "locationAddressOrCoordinates",
        "Location Address or Coordinates",
      ],
      ["city", "City"],
      ["state", "State"],
      [
        "detailedDescription",
        "Detailed Description",
      ],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(form[field] || "").trim()) {
        setError(`${label} is required.`);
        return false;
      }
    }

    return true;
  }

  // ============================================================
  // CREATE
  // ============================================================

  async function createHistory() {
    if (!validateForm()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const newHistoryId =
        await getNextHistoryId();

      const historyData = {
        historyId: newHistoryId,

        recordType: "Location History",

        caseFirestoreId: caseId,

        caseId:
          caseData?.caseId ||
          caseData?.id ||
          "",

        caseName:
          caseData?.caseName ||
          caseData?.name ||
          caseData?.locationName ||
          "",

        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),

        todaysDate: form.todaysDate,

        locationName:
          form.locationName.trim(),

        locationAddressOrCoordinates:
          form.locationAddressOrCoordinates.trim(),

        city: form.city.trim(),
        state: form.state.trim(),

        detailedDescription:
          form.detailedDescription.trim(),

        status: "Submitted",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const historyRef = await addDoc(
        collection(db, "locationHistories"),
        historyData
      );

      // --------------------------------------------------------
      // UPDATE CASE
      // --------------------------------------------------------

      const caseRef = doc(
        db,
        "cases",
        caseId
      );

      const caseSnap = await getDoc(caseRef);

      if (caseSnap.exists()) {
        const currentCase =
          caseSnap.data() || {};

        const existingHistoryIds =
          Array.isArray(
            currentCase.locationHistoryIds
          )
            ? currentCase.locationHistoryIds
            : [];

        const updatedHistoryIds = [
          ...new Set([
            ...existingHistoryIds,
            historyRef.id,
          ]),
        ];

        await updateDoc(caseRef, {
          locationHistoryIds:
            updatedHistoryIds,

          locationHistoryCount:
            updatedHistoryIds.length,

          updatedAt:
            serverTimestamp(),
        });
      }

      setSuccess(
        `${newHistoryId} submitted successfully.`
      );

      setTimeout(() => {
        navigate(`/cases/${caseId}`);
      }, 700);
    } catch (err) {
      console.error(
        "Error creating location history:",
        err
      );

      setError(
        err?.message ||
          "An error occurred while saving the location history."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async function updateHistory() {
    if (!validateForm()) return;

    if (!historyId || historyId === "new") {
      setError(
        "This location history record does not have a valid ID."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const historyRef = doc(
        db,
        "locationHistories",
        historyId
      );

      await updateDoc(historyRef, {
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        todaysDate:
          form.todaysDate,

        locationName:
          form.locationName.trim(),

        locationAddressOrCoordinates:
          form.locationAddressOrCoordinates.trim(),

        city:
          form.city.trim(),

        state:
          form.state.trim(),

        detailedDescription:
          form.detailedDescription.trim(),

        updatedAt:
          serverTimestamp(),
      });

      setSuccess(
        "Location history updated successfully."
      );

      setEditing(false);
    } catch (err) {
      console.error(
        "Error updating location history:",
        err
      );

      setError(
        err?.message ||
          "An error occurred while updating the location history."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (isNew) {
      await createHistory();
    } else {
      await updateHistory();
    }
  }

  // ============================================================
  // BACK
  // ============================================================

  function handleCancel() {
    navigate(`/cases/${caseId}`);
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="nh-page">
        <div className="nh-page-header">
          <div>
            <div className="nh-eyebrow">
              CASE DOCUMENTATION
            </div>

            <h1>Location History</h1>

            <p>
              Loading location history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error && !caseData) {
    return (
      <div className="nh-page">

        <div className="nh-page-header">
          <div>
            <div className="nh-eyebrow">
              CASE DOCUMENTATION
            </div>

            <h1>Location History</h1>
          </div>
        </div>

        <div className="nh-witness-report-note">
          <strong>
            Unable to load case
          </strong>

          <p>{error}</p>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="nh-secondary-button"
            onClick={handleCancel}
          >
            ← Back to Case
          </button>
        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="nh-page nh-witness-report-page">

      {/* HEADER */}

      <div className="nh-page-header">

        <div>

          <div className="nh-eyebrow">
            CASE DOCUMENTATION
          </div>

          <h1>
            {isNew
              ? "New Location History"
              : editing
              ? "Edit Location History"
              : "Location History"}
          </h1>

          <p>
            {caseData?.caseName ||
              caseData?.name ||
              caseData?.locationName ||
              "Investigation Case"}
          </p>

        </div>

        <div className="nh-page-header-actions">

          <button
            type="button"
            className="nh-secondary-button"
            onClick={handleCancel}
          >
            ← Back to Case
          </button>

        </div>

      </div>

      {/* METADATA */}

      <div className="nh-witness-report-meta">

        <div>
          <span>Case</span>

          <strong>
            {caseData?.caseId ||
              caseData?.id ||
              caseData?.firestoreId ||
              "—"}
          </strong>
        </div>

        <div>
          <span>Record ID</span>

          <strong>
            {isNew
              ? "NEW"
              : historyId || "—"}
          </strong>
        </div>

        <div>
          <span>Status</span>

          <strong>
            {isNew
              ? "Draft"
              : "Submitted"}
          </strong>
        </div>

        <div>
          <span>Researcher</span>

          <strong>
            {fullName ||
              "Not entered"}
          </strong>
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div
          className="nh-witness-report-note"
          style={{
            marginBottom: "18px",
          }}
        >
          <strong>Error</strong>

          <p>{error}</p>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          className="nh-witness-report-note"
          style={{
            marginBottom: "18px",
          }}
        >
          <strong>Success</strong>

          <p>{success}</p>
        </div>
      )}

      {/* FORM CARD */}

      <div className="nh-witness-report-card">

        <div className="nh-witness-report-header">

          <div className="nh-eyebrow">
            LOCATION HISTORY
          </div>

          <h2>
            {isNew
              ? "Submit Location History"
              : editing
              ? "Edit Location History"
              : "Location History Record"}
          </h2>

          <p>
            Document the known history of
            the investigation location.
          </p>

        </div>

        <form onSubmit={handleSubmit}>

          <div className="nh-form-grid">

            {/* FIRST NAME */}

            <div className="nh-form-group">

              <label htmlFor="firstName">
                First Name <span>*</span>
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
              />

            </div>

            {/* LAST NAME */}

            <div className="nh-form-group">

              <label htmlFor="lastName">
                Last Name <span>*</span>
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
              />

            </div>

            {/* TODAY'S DATE */}

            <div className="nh-form-group">

              <label htmlFor="todaysDate">
                Today's Date <span>*</span>
              </label>

              <input
                id="todaysDate"
                name="todaysDate"
                type="date"
                value={form.todaysDate}
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
              />

            </div>

            {/* LOCATION NAME */}

            <div className="nh-form-group">

              <label htmlFor="locationName">
                Location Name <span>*</span>
              </label>

              <input
                id="locationName"
                name="locationName"
                type="text"
                value={form.locationName}
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
              />

            </div>

            {/* ADDRESS */}

            <div className="nh-form-group nh-form-full">

              <label htmlFor="locationAddressOrCoordinates">
                Location Address or Coordinates{" "}
                <span>*</span>
              </label>

              <input
                id="locationAddressOrCoordinates"
                name="locationAddressOrCoordinates"
                type="text"
                value={
                  form.locationAddressOrCoordinates
                }
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
              />

            </div>

            {/* CITY */}

            <div className="nh-form-group">

              <label htmlFor="city">
                City <span>*</span>
              </label>

              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
              />

            </div>

            {/* STATE */}

            <div className="nh-form-group">

              <label htmlFor="state">
                State <span>*</span>
              </label>

              <input
                id="state"
                name="state"
                type="text"
                value={form.state}
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
              />

            </div>

            {/* DETAILED DESCRIPTION */}

            <div className="nh-form-group nh-form-full">

              <label htmlFor="detailedDescription">
                Detailed Description Over the Location's History{" "}
                <span>*</span>
              </label>

              <textarea
                id="detailedDescription"
                name="detailedDescription"
                rows="14"
                value={
                  form.detailedDescription
                }
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
                placeholder={
                  editing
                    ? "Enter the detailed description of the location's history..."
                    : ""
                }
              />

            </div>

          </div>

          {/* FOOTER */}

          <div className="nh-witness-report-footer">

            <div className="nh-witness-report-required">
              * Required field
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >

              <button
                type="button"
                className="nh-secondary-button"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>

              {/* VIEW EXISTING */}

              {!isNew && !editing && (
                <button
                  type="button"
                  className="nh-primary-button"
                  onClick={() => {
                    setEditing(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Edit History
                </button>
              )}

              {/* SAVE */}

              {editing && (
                <button
                  type="submit"
                  className="nh-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : isNew
                    ? "Submit History"
                    : "Save Changes"}
                </button>
              )}

            </div>

          </div>

        </form>

        {/* RECORD INFORMATION */}

        {!isNew && (
          <div className="nh-witness-report-record">

            <div>
              <strong>Record ID:</strong>{" "}
              {historyId || "Unknown"}
            </div>

            <div>
              <strong>Record Type:</strong>{" "}
              Location History
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default LocationHistory;