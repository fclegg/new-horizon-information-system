import { useEffect, useMemo, useState } from "react";

import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase/config";


/*
 * =========================================================
 * STATUS / CONDITION / CALIBRATION HELPERS
 * =========================================================
 */

function statusClass(status) {
  return (
    "nh-equipment-status nh-equipment-status-" +
    String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-")
  );
}


function conditionClass(condition) {
  return (
    "nh-equipment-condition nh-equipment-condition-" +
    String(condition || "").toLowerCase()
  );
}


function calibrationClass(calibration) {
  return calibration === "Due"
    ? "nh-equipment-calibration nh-equipment-calibration-due"
    : "nh-equipment-calibration";
}


/*
 * =========================================================
 * EQUIPMENT
 * =========================================================
 */

function Equipment() {

  /*
   * =======================================================
   * STATE
   * =======================================================
   */

  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [selectedEquipment, setSelectedEquipment] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] =
    useState("");

  const [editError, setEditError] =
    useState("");


  /*
   * =======================================================
   * NEW EQUIPMENT FORM
   * =======================================================
   */

  const [newEquipment, setNewEquipment] =
    useState({
      name: "",
      type: "",
      status: "Available",
      assignedTo: "",
      condition: "Good",
      calibration: "N/A",
      lastMaintenance: "",
    });


  /*
   * =======================================================
   * EDIT EQUIPMENT FORM
   * =======================================================
   */

  const [editEquipment, setEditEquipment] =
    useState({
      name: "",
      type: "",
      status: "Available",
      assignedTo: "",
      condition: "Good",
      calibration: "N/A",
      lastMaintenance: "",
    });


  /*
   * =======================================================
   * FIRESTORE — EQUIPMENT
   * =======================================================
   */

  useEffect(() => {

    const equipmentRef =
      collection(db, "equipment");

    const unsubscribe = onSnapshot(
      equipmentRef,
      (snapshot) => {

        const equipmentRecords = [];

        snapshot.forEach((equipmentDoc) => {

          equipmentRecords.push({
            firestoreId: equipmentDoc.id,
            ...equipmentDoc.data(),
          });

        });

        setEquipment(equipmentRecords);

        setLoading(false);

        setError("");

      },
      (err) => {

        console.error(
          "Error loading equipment:",
          err
        );

        setError(
          "Unable to load equipment data."
        );

        setLoading(false);

      }
    );

    return () => unsubscribe();

  }, []);


  /*
   * =======================================================
   * EQUIPMENT TYPES
   * =======================================================
   */

  const equipmentTypes = useMemo(() => {

    const types = equipment
      .map((item) => item.type)
      .filter(Boolean);

    return [
      "All",
      ...new Set(types),
    ];

  }, [equipment]);


  /*
   * =======================================================
   * FILTER EQUIPMENT
   * =======================================================
   */

  const filteredEquipment = useMemo(() => {

    const search =
      searchTerm
        .toLowerCase()
        .trim();

    return equipment.filter(
      (item) => {

        const matchesSearch =
          !search ||
          String(item.name || "")
            .toLowerCase()
            .includes(search) ||
          String(item.id || "")
            .toLowerCase()
            .includes(search) ||
          String(item.equipmentNumber || "")
            .toLowerCase()
            .includes(search) ||
          String(item.type || "")
            .toLowerCase()
            .includes(search) ||
          String(item.assignedTo || "")
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          statusFilter === "All" ||
          item.status === statusFilter;

        const matchesType =
          typeFilter === "All" ||
          item.type === typeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType
        );

      }
    );

  }, [
    equipment,
    searchTerm,
    statusFilter,
    typeFilter,
  ]);


  /*
   * =======================================================
   * EQUIPMENT STATISTICS
   * =======================================================
   */

  const totalEquipment =
    equipment.length;


  const availableEquipment =
    equipment.filter(
      (item) =>
        item.status === "Available"
    ).length;


  const assignedEquipment =
    equipment.filter(
      (item) =>
        item.status === "Assigned"
    ).length;


  const maintenanceEquipment =
    equipment.filter(
      (item) =>
        item.status === "Maintenance"
    ).length;


  /*
   * =======================================================
   * FORM INPUT HANDLER
   * =======================================================
   */

  const handleFormChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;

    setNewEquipment(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  /*
   * =======================================================
   * EDIT FORM INPUT HANDLER
   * =======================================================
   */

  const handleEditFormChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;

    setEditEquipment(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  /*
   * =======================================================
   * OPEN ADD EQUIPMENT
   * =======================================================
   */

  const openAddEquipment = () => {

    setSaveError("");

    setNewEquipment({
      name: "",
      type: "",
      status: "Available",
      assignedTo: "",
      condition: "Good",
      calibration: "N/A",
      lastMaintenance: "",
    });

    setShowAddModal(true);

  };


  /*
   * =======================================================
   * CLOSE ADD EQUIPMENT
   * =======================================================
   */

  const closeAddEquipment = () => {

    if (saving) {
      return;
    }

    setShowAddModal(false);

    setSaveError("");

  };


  /*
   * =======================================================
   * OPEN EQUIPMENT DETAILS
   * =======================================================
   */

  const openEquipmentDetails = (item) => {

    setEditError("");

    setEditEquipment({
      name: item.name || "",
      type: item.type || "",
      status: item.status || "Available",
      assignedTo: item.assignedTo || "",
      condition: item.condition || "Good",
      calibration: item.calibration || "N/A",
      lastMaintenance: item.lastMaintenance || "",
    });

    setSelectedEquipment(item);

  };


  /*
   * =======================================================
   * CLOSE EQUIPMENT DETAILS
   * =======================================================
   */

  const closeEquipmentDetails = () => {

    if (saving) {
      return;
    }

    setSelectedEquipment(null);

    setEditError("");

  };


  /*
   * =======================================================
   * GENERATE NEXT EQUIPMENT NUMBER
   * =======================================================
   */

  const generateEquipmentNumber =
    async () => {

      const equipmentRef =
        collection(
          db,
          "equipment"
        );

      const snapshot =
        await getDocs(
          equipmentRef
        );

      let highestNumber = 0;

      snapshot.forEach(
        (equipmentDoc) => {

          const data =
            equipmentDoc.data();

          const existingId =
            data.equipmentNumber ||
            data.id ||
            "";

          const match =
            String(existingId).match(
              /^EQP-(\d+)$/
            );

          if (match) {

            const number =
              Number(match[1]);

            if (
              number >
              highestNumber
            ) {

              highestNumber =
                number;

            }

          }

        }
      );

      const nextNumber =
        highestNumber + 1;

      return (
        "EQP-" +
        String(nextNumber).padStart(
          4,
          "0"
        )
      );

    };


  /*
   * =======================================================
   * ADD EQUIPMENT
   * =======================================================
   */

  const handleAddEquipment =
    async (event) => {

      event.preventDefault();

      setSaveError("");


      /*
       * -----------------------------------------------------
       * VALIDATION
       * -----------------------------------------------------
       */

      if (
        !newEquipment.name.trim()
      ) {

        setSaveError(
          "Equipment name is required."
        );

        return;

      }


      if (
        !newEquipment.type.trim()
      ) {

        setSaveError(
          "Equipment type is required."
        );

        return;

      }


      /*
       * -----------------------------------------------------
       * SAVE TO FIRESTORE
       * -----------------------------------------------------
       */

      try {

        setSaving(true);

        const equipmentNumber =
          await generateEquipmentNumber();


        await addDoc(
          collection(
            db,
            "equipment"
          ),
          {

            equipmentNumber:
              equipmentNumber,

            name:
              newEquipment.name.trim(),

            type:
              newEquipment.type.trim(),

            status:
              newEquipment.status,

            assignedTo:
              newEquipment.assignedTo.trim() ||
              null,

            condition:
              newEquipment.condition,

            calibration:
              newEquipment.calibration,

            lastMaintenance:
              newEquipment.lastMaintenance ||
              null,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

          }
        );


        /*
         * ---------------------------------------------------
         * RESET FORM
         * ---------------------------------------------------
         */

        setNewEquipment({
          name: "",
          type: "",
          status: "Available",
          assignedTo: "",
          condition: "Good",
          calibration: "N/A",
          lastMaintenance: "",
        });


        setShowAddModal(false);

      } catch (err) {

        console.error(
          "Error adding equipment:",
          err
        );

        setSaveError(
          "Unable to add equipment. Please try again."
        );

      } finally {

        setSaving(false);

      }

    };


  /*
   * =======================================================
   * SAVE EQUIPMENT EDITS
   * =======================================================
   */

  const handleSaveEquipment =
    async (event) => {

      event.preventDefault();

      setEditError("");


      if (!selectedEquipment) {
        return;
      }


      /*
       * -----------------------------------------------------
       * VALIDATION
       * -----------------------------------------------------
       */

      if (
        !editEquipment.name.trim()
      ) {

        setEditError(
          "Equipment name is required."
        );

        return;

      }


      if (
        !editEquipment.type.trim()
      ) {

        setEditError(
          "Equipment type is required."
        );

        return;

      }


      /*
       * -----------------------------------------------------
       * SAVE CHANGES
       * -----------------------------------------------------
       */

      try {

        setSaving(true);

        const equipmentRef =
          doc(
            db,
            "equipment",
            selectedEquipment.firestoreId
          );


        await updateDoc(
          equipmentRef,
          {

            name:
              editEquipment.name.trim(),

            type:
              editEquipment.type.trim(),

            status:
              editEquipment.status,

            assignedTo:
              editEquipment.assignedTo.trim() ||
              null,

            condition:
              editEquipment.condition,

            calibration:
              editEquipment.calibration,

            lastMaintenance:
              editEquipment.lastMaintenance ||
              null,

            updatedAt:
              serverTimestamp(),

          }
        );


        /*
         * ---------------------------------------------------
         * UPDATE LOCAL SELECTED RECORD
         * ---------------------------------------------------
         */

        setSelectedEquipment(
          (previous) => ({
            ...previous,
            ...editEquipment,
            name:
              editEquipment.name.trim(),
            type:
              editEquipment.type.trim(),
            assignedTo:
              editEquipment.assignedTo.trim() ||
              null,
            lastMaintenance:
              editEquipment.lastMaintenance ||
              null,
          })
        );


        setEditError("");

      } catch (err) {

        console.error(
          "Error updating equipment:",
          err
        );

        setEditError(
          "Unable to save changes. Please check your Firestore permissions."
        );

      } finally {

        setSaving(false);

      }

    };


  /*
   * =======================================================
   * LOADING SCREEN
   * =======================================================
   */

  if (loading) {

    return (
      <div className="nh-page">

        <div className="nh-loading-state">
          Loading equipment inventory...
        </div>

      </div>
    );

  }


  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (

    <div className="nh-page">


      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="nh-page-header nh-equipment-header">

        <div>

          <div className="nh-eyebrow">
            ASSET MANAGEMENT
          </div>

          <h1>
            Equipment
          </h1>

          <p>
            Inventory, assignments, maintenance, and
            calibration records.
          </p>

        </div>


        <button
          className="nh-primary-button"
          type="button"
          onClick={openAddEquipment}
        >
          + Add Equipment
        </button>

      </div>


      {/* ===================================================
          DATABASE ERROR
          =================================================== */}

      {error && (

        <div className="nh-form-error">
          {error}
        </div>

      )}


      {/* ===================================================
          EQUIPMENT STATISTICS
          =================================================== */}

      <div className="nh-equipment-stats">

        <div className="nh-equipment-stat">

          <span className="nh-equipment-stat-label">
            TOTAL EQUIPMENT
          </span>

          <strong>
            {totalEquipment}
          </strong>

          <span className="nh-equipment-stat-detail">
            Individually tracked assets
          </span>

        </div>


        <div className="nh-equipment-stat">

          <span className="nh-equipment-stat-label">
            AVAILABLE
          </span>

          <strong>
            {availableEquipment}
          </strong>

          <span className="nh-equipment-stat-detail">
            Ready for assignment
          </span>

        </div>


        <div className="nh-equipment-stat">

          <span className="nh-equipment-stat-label">
            ASSIGNED
          </span>

          <strong>
            {assignedEquipment}
          </strong>

          <span className="nh-equipment-stat-detail">
            Currently assigned
          </span>

        </div>


        <div className="nh-equipment-stat">

          <span className="nh-equipment-stat-label">
            MAINTENANCE
          </span>

          <strong>
            {maintenanceEquipment}
          </strong>

          <span className="nh-equipment-stat-detail">
            Requires attention
          </span>

        </div>

      </div>


      {/* ===================================================
          EQUIPMENT INVENTORY
          =================================================== */}

      <section className="nh-section nh-equipment-section">

        <div className="nh-section-header">

          <div>

            <h2>
              Equipment Inventory
            </h2>

            <p>
              Every equipment item is tracked using a
              unique NHIS equipment identifier.
            </p>

          </div>

        </div>


        {/* =================================================
            FILTER CONTROLS
            ================================================= */}

        <div className="nh-equipment-controls">

          <div className="nh-search-box nh-equipment-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search equipment, tag, type, or member..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>


          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="nh-filter-select"
          >

            <option value="All">
              All Statuses
            </option>

            <option value="Available">
              Available
            </option>

            <option value="Assigned">
              Assigned
            </option>

            <option value="Maintenance">
              Maintenance
            </option>

            <option value="Retired">
              Retired
            </option>

            <option value="Lost">
              Lost
            </option>

          </select>


          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
            className="nh-filter-select"
          >

            {equipmentTypes.map(
              (type) => (

                <option
                  key={type}
                  value={type}
                >
                  {type === "All"
                    ? "All Equipment Types"
                    : type}
                </option>

              )
            )}

          </select>

        </div>


        {/* =================================================
            INVENTORY TABLE
            ================================================= */}

        <div className="nh-equipment-table-wrap">

          <div className="nh-equipment-table">

            <div className="nh-equipment-row nh-equipment-row-header">

              <div>
                Equipment
              </div>

              <div>
                Tag
              </div>

              <div>
                Status
              </div>

              <div>
                Condition
              </div>

              <div></div>

            </div>


            {filteredEquipment.map(
              (item) => (

                <div
                  className="nh-equipment-row"
                  key={item.firestoreId}
                >

                  {/* -----------------------------------------
                      EQUIPMENT
                      ----------------------------------------- */}

                  <div className="nh-equipment-identity">

                    <div className="nh-equipment-icon">
                      ▣
                    </div>

                    <div>

                      <strong>
                        {item.name ||
                          "Unnamed Equipment"}
                      </strong>

                      <span>
                        {item.type ||
                          "Uncategorized"}
                      </span>

                    </div>

                  </div>


                  {/* -----------------------------------------
                      EQUIPMENT TAG
                      ----------------------------------------- */}

                  <div className="nh-equipment-tag">

                    {item.equipmentNumber ||
                      item.id ||
                      item.firestoreId}

                  </div>


                  {/* -----------------------------------------
                      STATUS
                      ----------------------------------------- */}

                  <div>

                    <span
                      className={statusClass(
                        item.status
                      )}
                    >
                      {item.status ||
                        "Unknown"}
                    </span>

                  </div>


                  {/* -----------------------------------------
                      CONDITION
                      ----------------------------------------- */}

                  <div>

                    <span
                      className={conditionClass(
                        item.condition
                      )}
                    >
                      {item.condition ||
                        "Unknown"}
                    </span>

                  </div>


                  {/* -----------------------------------------
                      VIEW
                      ----------------------------------------- */}

                  <div>

                    <button
                      className="nh-equipment-view-button"
                      type="button"
                      onClick={() =>
                        openEquipmentDetails(item)
                      }
                    >
                      View
                    </button>

                  </div>

                </div>

              )
            )}


            {/* =================================================
                EMPTY STATE
                ================================================= */}

            {filteredEquipment.length === 0 && (

              <div className="nh-equipment-empty">

                <div className="nh-equipment-empty-icon">
                  ▣
                </div>

                <strong>
                  No equipment registered
                </strong>

                <span>
                  {equipment.length === 0
                    ? "Add your first equipment item to begin building the NHIS inventory."
                    : "Try changing your search or filter settings."}
                </span>


                {equipment.length === 0 && (

                  <button
                    type="button"
                    className="nh-primary-button"
                    onClick={openAddEquipment}
                    style={{
                      marginTop: "16px",
                    }}
                  >
                    + Add Equipment
                  </button>

                )}

              </div>

            )}

          </div>

        </div>

      </section>


      {/* ===================================================
          EQUIPMENT OVERVIEW
          =================================================== */}

      <section className="nh-section nh-equipment-overview">

        <div className="nh-equipment-overview-card">

          <div className="nh-equipment-overview-icon">
            ↔
          </div>

          <div>

            <span className="nh-eyebrow">
              ASSIGNMENTS
            </span>

            <h3>
              Equipment Assignment History
            </h3>

            <p>
              Track which members have possession of
              equipment and maintain a history of previous
              assignments.
            </p>

          </div>

          <button
            type="button"
            className="nh-secondary-button"
          >
            View Assignments
          </button>

        </div>


        <div className="nh-equipment-overview-card">

          <div className="nh-equipment-overview-icon">
            ⚙
          </div>

          <div>

            <span className="nh-eyebrow">
              MAINTENANCE
            </span>

            <h3>
              Maintenance & Calibration
            </h3>

            <p>
              Record repairs, service, calibration dates,
              and upcoming maintenance requirements.
            </p>

          </div>

          <button
            type="button"
            className="nh-secondary-button"
          >
            View Records
          </button>

        </div>

      </section>


      {/* ===================================================
          ADD EQUIPMENT MODAL
          =================================================== */}

      {showAddModal && (

        <div
          className="nh-equipment-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddEquipment();
            }

          }}
        >

          <div className="nh-equipment-modal">


            {/* =============================================
                MODAL HEADER
                ============================================= */}

            <div className="nh-equipment-modal-header">

              <div className="nh-equipment-modal-header-left">

                <div className="nh-equipment-modal-icon">
                  ▣
                </div>


                <div className="nh-equipment-modal-title">

                  <div className="nh-eyebrow">
                    EQUIPMENT REGISTRATION
                  </div>

                  <h2>
                    Add Equipment
                  </h2>

                  <p>
                    Register a new asset in the NHIS
                    equipment inventory.
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="nh-equipment-modal-close"
                onClick={closeAddEquipment}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =============================================
                MODAL FORM
                ============================================= */}

            <form
              onSubmit={handleAddEquipment}
              className="nh-equipment-modal-form"
            >

              <div className="nh-equipment-modal-body">


                {/* =========================================
                    EQUIPMENT IDENTIFIER
                    ========================================= */}

                <div className="nh-equipment-id-preview">

                  <div className="nh-equipment-id-preview-label">

                    <strong>
                      NHIS EQUIPMENT IDENTIFIER
                    </strong>

                    <span>
                      Automatically assigned when registered
                    </span>

                  </div>


                  <div className="nh-equipment-id-preview-value">
                    EQP-####
                  </div>

                </div>


                {/* =========================================
                    ERROR
                    ========================================= */}

                {saveError && (

                  <div
                    className="nh-form-error"
                    style={{
                      marginBottom: "24px",
                    }}
                  >
                    {saveError}
                  </div>

                )}


                {/* =========================================
                    BASIC INFORMATION
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Basic Information
                  </div>


                  <div className="nh-equipment-form-grid">


                    <div className="nh-equipment-form-field">

                      <label htmlFor="equipment-name">
                        Equipment Name
                      </label>

                      <input
                        id="equipment-name"
                        type="text"
                        name="name"
                        value={
                          newEquipment.name
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="K2 EMF Meter"
                        required
                        autoFocus
                      />

                    </div>


                    <div className="nh-equipment-form-field">

                      <label htmlFor="equipment-type">
                        Equipment Type
                      </label>

                      <input
                        id="equipment-type"
                        type="text"
                        name="type"
                        value={
                          newEquipment.type
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="EMF Meter"
                        required
                      />

                    </div>

                  </div>

                </div>


                {/* =========================================
                    OPERATIONAL STATUS
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Operational Status
                  </div>


                  <div className="nh-equipment-form-grid">


                    <div className="nh-equipment-form-field">

                      <label htmlFor="equipment-status">
                        Status
                      </label>

                      <select
                        id="equipment-status"
                        name="status"
                        value={
                          newEquipment.status
                        }
                        onChange={
                          handleFormChange
                        }
                      >

                        <option value="Available">
                          Available
                        </option>

                        <option value="Assigned">
                          Assigned
                        </option>

                        <option value="Maintenance">
                          Maintenance
                        </option>

                        <option value="Retired">
                          Retired
                        </option>

                        <option value="Lost">
                          Lost
                        </option>

                      </select>

                    </div>


                    <div className="nh-equipment-form-field">

                      <label htmlFor="equipment-condition">
                        Condition
                      </label>

                      <select
                        id="equipment-condition"
                        name="condition"
                        value={
                          newEquipment.condition
                        }
                        onChange={
                          handleFormChange
                        }
                      >

                        <option value="Good">
                          Good
                        </option>

                        <option value="Fair">
                          Fair
                        </option>

                        <option value="Poor">
                          Poor
                        </option>

                      </select>

                    </div>

                  </div>

                </div>


                {/* =========================================
                    ASSIGNMENT
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Assignment
                  </div>


                  <div className="nh-equipment-form-grid">


                    <div className="nh-equipment-form-field">

                      <label htmlFor="equipment-assigned">
                        Assigned To
                      </label>

                      <input
                        id="equipment-assigned"
                        type="text"
                        name="assignedTo"
                        value={
                          newEquipment.assignedTo
                        }
                        onChange={
                          handleFormChange
                        }
                        placeholder="MEM-####"
                      />

                      <span className="nh-equipment-field-help">
                        Leave blank if currently
                        unassigned.
                      </span>

                    </div>

                  </div>

                </div>


                {/* =========================================
                    MAINTENANCE & CALIBRATION
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Maintenance & Calibration
                  </div>


                  <div className="nh-equipment-form-grid">


                    <div className="nh-equipment-form-field">

                      <label htmlFor="equipment-calibration">
                        Calibration
                      </label>

                      <select
                        id="equipment-calibration"
                        name="calibration"
                        value={
                          newEquipment.calibration
                        }
                        onChange={
                          handleFormChange
                        }
                      >

                        <option value="N/A">
                          N/A
                        </option>

                        <option value="Current">
                          Current
                        </option>

                        <option value="Due">
                          Due
                        </option>

                      </select>

                    </div>


                    <div className="nh-equipment-form-field">

                      <label htmlFor="equipment-maintenance">
                        Last Maintenance
                      </label>

                      <input
                        id="equipment-maintenance"
                        type="date"
                        name="lastMaintenance"
                        value={
                          newEquipment.lastMaintenance
                        }
                        onChange={
                          handleFormChange
                        }
                      />

                    </div>

                  </div>

                </div>

              </div>


              {/* =============================================
                  MODAL FOOTER
                  ============================================= */}

              <div className="nh-equipment-modal-footer">

                <span className="nh-equipment-modal-footer-note">
                  Record will be stored in the NHIS
                  equipment registry.
                </span>


                <div className="nh-equipment-modal-actions">

                  <button
                    type="button"
                    className="nh-secondary-button"
                    onClick={closeAddEquipment}
                    disabled={saving}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="nh-primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Registering..."
                      : "Register Equipment"}
                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ===================================================
          VIEW / EDIT EQUIPMENT MODAL
          =================================================== */}

      {selectedEquipment && (

        <div
          className="nh-equipment-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeEquipmentDetails();
            }

          }}
        >

          <div className="nh-equipment-modal">


            {/* =============================================
                MODAL HEADER
                ============================================= */}

            <div className="nh-equipment-modal-header">

              <div className="nh-equipment-modal-header-left">

                <div className="nh-equipment-modal-icon">
                  ▣
                </div>


                <div className="nh-equipment-modal-title">

                  <div className="nh-eyebrow">
                    EQUIPMENT RECORD
                  </div>

                  <h2>
                    {editEquipment.name ||
                      "Equipment Record"}
                  </h2>

                  <p>
                    {editEquipment.type ||
                      "Uncategorized"}
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="nh-equipment-modal-close"
                onClick={closeEquipmentDetails}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =============================================
                EDIT FORM
                ============================================= */}

            <form
              onSubmit={handleSaveEquipment}
              className="nh-equipment-modal-form"
            >

              <div className="nh-equipment-modal-body">


                {/* =========================================
                    EQUIPMENT IDENTIFIER
                    ========================================= */}

                <div className="nh-equipment-id-preview">

                  <div className="nh-equipment-id-preview-label">

                    <strong>
                      NHIS EQUIPMENT IDENTIFIER
                    </strong>

                    <span>
                      Equipment identifier cannot be changed
                    </span>

                  </div>


                  <div className="nh-equipment-id-preview-value">
                    {selectedEquipment.equipmentNumber ||
                      selectedEquipment.id ||
                      selectedEquipment.firestoreId}
                  </div>

                </div>


                {/* =========================================
                    ERROR
                    ========================================= */}

                {editError && (

                  <div
                    className="nh-form-error"
                    style={{
                      marginBottom: "24px",
                    }}
                  >
                    {editError}
                  </div>

                )}


                {/* =========================================
                    BASIC INFORMATION
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Basic Information
                  </div>


                  <div className="nh-equipment-form-grid">


                    <div className="nh-equipment-form-field">

                      <label htmlFor="edit-equipment-name">
                        Equipment Name
                      </label>

                      <input
                        id="edit-equipment-name"
                        type="text"
                        name="name"
                        value={
                          editEquipment.name
                        }
                        onChange={
                          handleEditFormChange
                        }
                        placeholder="K2 EMF Meter"
                        required
                        autoFocus
                      />

                    </div>


                    <div className="nh-equipment-form-field">

                      <label htmlFor="edit-equipment-type">
                        Equipment Type
                      </label>

                      <input
                        id="edit-equipment-type"
                        type="text"
                        name="type"
                        value={
                          editEquipment.type
                        }
                        onChange={
                          handleEditFormChange
                        }
                        placeholder="EMF Meter"
                        required
                      />

                    </div>

                  </div>

                </div>


                {/* =========================================
                    OPERATIONAL STATUS
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Operational Status
                  </div>


                  <div className="nh-equipment-form-grid">


                    <div className="nh-equipment-form-field">

                      <label htmlFor="edit-equipment-status">
                        Status
                      </label>

                      <select
                        id="edit-equipment-status"
                        name="status"
                        value={
                          editEquipment.status
                        }
                        onChange={
                          handleEditFormChange
                        }
                      >

                        <option value="Available">
                          Available
                        </option>

                        <option value="Assigned">
                          Assigned
                        </option>

                        <option value="Maintenance">
                          Maintenance
                        </option>

                        <option value="Retired">
                          Retired
                        </option>

                        <option value="Lost">
                          Lost
                        </option>

                      </select>

                    </div>


                    <div className="nh-equipment-form-field">

                      <label htmlFor="edit-equipment-condition">
                        Condition
                      </label>

                      <select
                        id="edit-equipment-condition"
                        name="condition"
                        value={
                          editEquipment.condition
                        }
                        onChange={
                          handleEditFormChange
                        }
                      >

                        <option value="Good">
                          Good
                        </option>

                        <option value="Fair">
                          Fair
                        </option>

                        <option value="Poor">
                          Poor
                        </option>

                      </select>

                    </div>

                  </div>

                </div>


                {/* =========================================
                    ASSIGNMENT
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Assignment
                  </div>


                  <div className="nh-equipment-form-grid">


                    <div className="nh-equipment-form-field">

                      <label htmlFor="edit-equipment-assigned">
                        Assigned To
                      </label>

                      <input
                        id="edit-equipment-assigned"
                        type="text"
                        name="assignedTo"
                        value={
                          editEquipment.assignedTo
                        }
                        onChange={
                          handleEditFormChange
                        }
                        placeholder="MEM-####"
                      />

                      <span className="nh-equipment-field-help">
                        Leave blank if currently
                        unassigned.
                      </span>

                    </div>

                  </div>

                </div>


                {/* =========================================
                    MAINTENANCE & CALIBRATION
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Maintenance & Calibration
                  </div>


                  <div className="nh-equipment-form-grid">


                    <div className="nh-equipment-form-field">

                      <label htmlFor="edit-equipment-calibration">
                        Calibration
                      </label>

                      <select
                        id="edit-equipment-calibration"
                        name="calibration"
                        value={
                          editEquipment.calibration
                        }
                        onChange={
                          handleEditFormChange
                        }
                      >

                        <option value="N/A">
                          N/A
                        </option>

                        <option value="Current">
                          Current
                        </option>

                        <option value="Due">
                          Due
                        </option>

                      </select>

                    </div>


                    <div className="nh-equipment-form-field">

                      <label htmlFor="edit-equipment-maintenance">
                        Last Maintenance
                      </label>

                      <input
                        id="edit-equipment-maintenance"
                        type="date"
                        name="lastMaintenance"
                        value={
                          editEquipment.lastMaintenance
                        }
                        onChange={
                          handleEditFormChange
                        }
                      />

                    </div>

                  </div>

                </div>


                {/* =========================================
                    DATABASE INFORMATION
                    ========================================= */}

                <div className="nh-equipment-form-section">

                  <div className="nh-equipment-form-section-title">
                    Database Record
                  </div>


                  <div className="nh-equipment-form-grid">

                    <div className="nh-equipment-form-field">

                      <label>
                        Firestore Document ID
                      </label>

                      <div>
                        {selectedEquipment.firestoreId}
                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* =============================================
                  EDIT MODAL FOOTER
                  ============================================= */}

              <div className="nh-equipment-modal-footer">

                <span className="nh-equipment-modal-footer-note">
                  Changes will be saved to the NHIS
                  equipment registry.
                </span>


                <div className="nh-equipment-modal-actions">

                  <button
                    type="button"
                    className="nh-secondary-button"
                    onClick={closeEquipmentDetails}
                    disabled={saving}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="nh-primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}


export default Equipment;