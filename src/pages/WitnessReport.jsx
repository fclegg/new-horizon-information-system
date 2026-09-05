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
  detailedReport: "",
};

const getToday = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

function WitnessReport() {
  const navigate = useNavigate();
  const { caseId, reportId } = useParams();

  // /new = create a report
  // anything else = view/edit an existing report
  const isNew = !reportId || reportId === "new";

  const [caseData, setCaseData] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(isNew);

  // ============================================================
  // LOAD CASE / REPORT
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
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
          throw new Error("The associated case could not be found.");
        }

        const loadedCase = {
          firestoreId: caseSnap.id,
          ...caseSnap.data(),
        };

        if (cancelled) return;

        setCaseData(loadedCase);

        // --------------------------------------------------------
        // NEW REPORT
        // --------------------------------------------------------
        // IMPORTANT:
        // If reportId is "new", we DO NOT query Firestore for
        // witnessReports/new.
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
        // EXISTING REPORT
        // --------------------------------------------------------

        if (!reportId) {
          throw new Error("No witness report was specified.");
        }

        const reportRef = doc(db, "witnessReports", reportId);
        const reportSnap = await getDoc(reportRef);

        if (!reportSnap.exists()) {
          throw new Error("Unable to load this witness report.");
        }

        const reportData = reportSnap.data();

        // Make sure this report belongs to this case.
        if (
          reportData.caseFirestoreId &&
          reportData.caseFirestoreId !== caseId
        ) {
          throw new Error(
            "This witness report does not belong to the selected case."
          );
        }

        setForm({
          firstName: reportData.firstName || "",
          lastName: reportData.lastName || "",
          todaysDate: reportData.todaysDate || "",

          locationName: reportData.locationName || "",

          locationAddressOrCoordinates:
            reportData.locationAddressOrCoordinates || "",

          city: reportData.city || "",
          state: reportData.state || "",

          detailedReport: reportData.detailedReport || "",
        });

        setEditing(false);
        setLoading(false);
      } catch (err) {
        console.error("Error loading witness report:", err);

        if (!cancelled) {
          setError(
            err?.message ||
              "An error occurred while loading the witness report."
          );

          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [caseId, reportId, isNew]);

  // ============================================================
  // DISPLAY NAME
  // ============================================================

  const fullWitnessName = useMemo(() => {
    return `${form.firstName} ${form.lastName}`.trim();
  }, [form.firstName, form.lastName]);

  // ============================================================
  // INPUT HANDLER
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ============================================================
  // GET NEXT REPORT ID
  // ============================================================
  //
  // This version does NOT use a Firestore "where" query.
  // It safely reads the collection and checks the IDs locally.
  //
  // ============================================================

  const getNextReportId = async () => {
    const reportsRef = collection(db, "witnessReports");
    const snapshot = await getDocs(reportsRef);

    let highestNumber = 0;

    snapshot.forEach((reportDoc) => {
      const data = reportDoc.data() || {};

      const existingId =
        typeof data.reportId === "string"
          ? data.reportId.trim()
          : "";

      if (!existingId) {
        return;
      }

      const match = existingId.match(/^WIT-(\d+)$/i);

      if (!match) {
        return;
      }

      const number = Number(match[1]);

      if (
        Number.isFinite(number) &&
        number > highestNumber
      ) {
        highestNumber = number;
      }
    });

    return `WIT-${String(highestNumber + 1).padStart(4, "0")}`;
  };

  // ============================================================
  // VALIDATE
  // ============================================================

  const validateForm = () => {
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
      ["detailedReport", "Detailed Report"],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(form[field] || "").trim()) {
        setError(`${label} is required.`);
        return false;
      }
    }

    return true;
  };

  // ============================================================
  // CREATE REPORT
  // ============================================================

  const createReport = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const newReportId = await getNextReportId();

      const reportData = {
        reportId: newReportId,
        reportType: "Witness Report",

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

        locationName: form.locationName.trim(),

        locationAddressOrCoordinates:
          form.locationAddressOrCoordinates.trim(),

        city: form.city.trim(),
        state: form.state.trim(),

        detailedReport: form.detailedReport.trim(),

        status: "Submitted",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create the report.
      const reportRef = await addDoc(
        collection(db, "witnessReports"),
        reportData
      );

      // --------------------------------------------------------
      // UPDATE PARENT CASE
      // --------------------------------------------------------

      const caseRef = doc(db, "cases", caseId);
      const caseSnap = await getDoc(caseRef);

      if (caseSnap.exists()) {
        const currentCase = caseSnap.data() || {};

        const existingReportIds = Array.isArray(
          currentCase.witnessReportIds
        )
          ? currentCase.witnessReportIds
          : [];

        const updatedReportIds = [
          ...new Set([
            ...existingReportIds,
            reportRef.id,
          ]),
        ];

        await updateDoc(caseRef, {
          witnessReportIds: updatedReportIds,
          witnessReportCount: updatedReportIds.length,
          updatedAt: serverTimestamp(),
        });
      }

      setSuccess(
        `${newReportId} submitted successfully.`
      );

      // Give the user a moment to see the success message.
      setTimeout(() => {
        navigate(`/cases/${caseId}`);
      }, 700);
    } catch (err) {
      console.error("Error creating witness report:", err);

      setError(
        err?.message ||
          "An error occurred while saving the witness report."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // UPDATE EXISTING REPORT
  // ============================================================

  const updateReport = async () => {
    if (!validateForm()) {
      return;
    }

    if (!reportId || reportId === "new") {
      setError(
        "This witness report does not have a valid report ID."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const reportRef = doc(
        db,
        "witnessReports",
        reportId
      );

      await updateDoc(reportRef, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        todaysDate: form.todaysDate,

        locationName: form.locationName.trim(),

        locationAddressOrCoordinates:
          form.locationAddressOrCoordinates.trim(),

        city: form.city.trim(),
        state: form.state.trim(),

        detailedReport: form.detailedReport.trim(),

        updatedAt: serverTimestamp(),
      });

      setSuccess(
        "Witness report updated successfully."
      );

      setEditing(false);
    } catch (err) {
      console.error("Error updating witness report:", err);

      setError(
        err?.message ||
          "An error occurred while updating the witness report."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isNew) {
      await createReport();
    } else {
      await updateReport();
    }
  };

  // ============================================================
  // CANCEL / BACK
  // ============================================================

  const handleCancel = () => {
    navigate(`/cases/${caseId}`);
  };

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

            <h1>Witness Report</h1>

            <p>
              Loading witness report...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // CASE LOAD ERROR
  // ============================================================

  if (error && !caseData) {
    return (
      <div className="nh-page">
        <div className="nh-page-header">
          <div>
            <div className="nh-eyebrow">
              CASE DOCUMENTATION
            </div>

            <h1>Witness Report</h1>
          </div>
        </div>

        <div className="nh-witness-report-note">
          <strong>Unable to load case</strong>

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
  // MAIN PAGE
  // ============================================================

  return (
    <div className="nh-page nh-witness-report-page">

      {/* ========================================================
          HEADER
         ======================================================== */}

      <div className="nh-page-header">
        <div>
          <div className="nh-eyebrow">
            CASE DOCUMENTATION
          </div>

          <h1>
            {isNew
              ? "New Witness Report"
              : editing
              ? "Edit Witness Report"
              : "Witness Report"}
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

      {/* ========================================================
          METADATA
         ======================================================== */}

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
          <span>Report ID</span>

          <strong>
            {isNew
              ? "NEW"
              : reportId || "—"}
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
          <span>Witness</span>

          <strong>
            {fullWitnessName ||
              "Not entered"}
          </strong>
        </div>

      </div>

      {/* ========================================================
          ERROR
         ======================================================== */}

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

      {/* ========================================================
          SUCCESS
         ======================================================== */}

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

      {/* ========================================================
          FORM CARD
         ======================================================== */}

      <div className="nh-witness-report-card">

        <div className="nh-witness-report-header">

          <div className="nh-eyebrow">
            WITNESS REPORT
          </div>

          <h2>
            {isNew
              ? "Submit Witness Report"
              : editing
              ? "Edit Witness Report"
              : "Witness Report Record"}
          </h2>

          <p>
            Record the witness's account of
            their encounters at the location.
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

            {/* ADDRESS / COORDINATES */}

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

            {/* DETAILED REPORT */}

            <div className="nh-form-group nh-form-full">

              <label htmlFor="detailedReport">
                Detailed Report Over Victim's Encounters{" "}
                <span>*</span>
              </label>

              <textarea
                id="detailedReport"
                name="detailedReport"
                rows="12"
                value={form.detailedReport}
                onChange={handleChange}
                disabled={!isNew && !editing}
                required
                placeholder={
                  editing
                    ? "Enter the detailed report..."
                    : ""
                }
              />

            </div>

          </div>

          {/* ======================================================
              FOOTER
             ====================================================== */}

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

              {/* VIEW MODE */}

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
                  Edit Report
                </button>
              )}

              {/* CREATE / EDIT MODE */}

              {editing && (
                <button
                  type="submit"
                  className="nh-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : isNew
                    ? "Submit Report"
                    : "Save Changes"}
                </button>
              )}

            </div>

          </div>

        </form>

        {/* ========================================================
            EXISTING REPORT INFO
           ======================================================== */}

        {!isNew && (
          <div className="nh-witness-report-record">

            <div>
              <strong>Report ID:</strong>{" "}
              {reportId || "Unknown"}
            </div>

            <div>
              <strong>Record Type:</strong>{" "}
              Witness Report
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default WitnessReport;