import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";

/*
 * ============================================================
 * CULT REGISTRY OPTIONS
 * ============================================================
 */

const statusOptions = [
  "Active",
  "Inactive",
  "Disbanded",
  "Unknown",
  "Allegedly Active",
  "Historical",
];

const leadershipOptions = [
  "Single Leader",
  "Council",
  "Priest/Priestess",
  "Hierarchy",
  "Cell-Based",
  "Unknown",
];

const entityClaimOptions = [
  "Demon",
  "Satan",
  "Fallen Angel",
  "God/Deity",
  "Spirit",
  "Ancestor",
  "Unknown Entity",
];

const relationshipOptions = [
  "Worship",
  "Servitude",
  "Communication",
  "Summoning",
  "Possession",
  "Protection",
  "Bargaining / Pact",
  "Divination",
  "Unknown",
];

const practiceOptions = [
  "Prayer / Worship",
  "Invocation",
  "Evocation",
  "Spirit Communication",
  "Divination",
  "Ceremonial Magic",
  "Blood Rituals",
  "Animal Sacrifice",
  "Human Sacrifice — allegation requires corroboration",
  "Possession Rituals",
  "Exorcism / Counter-Rituals",
  "Curse / Malefic Practice",
  "Offerings",
  "Sexual Rituals",
  "Necromancy",
  "Grave / Cemetery Rituals",
  "Fire Rituals",
];

const materialOptions = [
  "Candles",
  "Symbols",
  "Religious objects",
  "Written texts",
  "Weapons",
  "Animal remains",
  "Blood",
  "Personal objects",
  "Photographs",
  "Unknown",
];

const evidenceSourceOptions = [
  "Organization’s own statement",
  "Social media",
  "Witness",
  "Police report",
  "Court document",
  "News report",
  "Photograph/video",
  "Investigator observation",
  "Anonymous report",
];

const violenceOptions = [
  "None documented",
  "Threats",
  "Harassment",
  "Property destruction",
  "Assault",
  "Animal cruelty",
  "Kidnapping",
  "Missing persons associated with group",
  "Homicide allegation",
  "Human sacrifice allegation",
  "Unknown",
];

const primaryClassOptions = [
  "CLASS A — INFERNAL ORGANIZATION",
  "CLASS B — RITUALISTIC CULT",
  "CLASS C — OCCULT CELL",
  "CLASS D — OCCULT AFFILIATION",
  "UNCLASSIFIED / INSUFFICIENT EVIDENCE",
];

const organizationLevelOptions = [
  "O1 — Informal",
  "O2 — Structured",
  "O3 — Hierarchical",
  "O4 — Networked",
  "O5 — Institutional",
];

const supernaturalActivityOptions = [
  "S1 — Symbolic",
  "S2 — Ceremonial",
  "S3 — Invocational",
  "S4 — Transactional",
  "S5 — Manifestational",
];

const violenceLevelOptions = [
  "V0 — None observed",
  "V1 — Threats/intimidation",
  "V2 — Property destruction",
  "V3 — Animal harm/sacrifice",
  "V4 — Serious human violence",
  "V5 — Human sacrifice / attempted murder",
];

const influenceOptions = [
  "I0 — None",
  "I1 — Local",
  "I2 — Community",
  "I3 — Regional",
  "I4 — Institutional",
  "I5 — National/International",
];

const intentOptions = [
  "W — Worship",
  "S — Servitude",
  "C — Contact",
  "E — Evocation",
  "T — Transaction",
  "D — Destruction",
  "A — Apocalyptic",
  "Unknown",
];

const threatOptions = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
  "UNKNOWN",
];


/*
 * ============================================================
 * INITIAL REGISTRY RECORD
 * ============================================================
 *
 * Dakhma of Angra Mainyu remains CULT-001.
 * New organizations are saved to Firestore as CULT-002+.
 */

const initialOrganization = {
  id: "CULT-001",
  name: "Dakhma of Angra Mainyu",
  classification: "Unknown",
  locations: ["Oklahoma", "Unknown"],
  incidents: 2,
  entities: 1,
  evidence: 4,
  status: "Active",
};


/*
 * ============================================================
 * EMPTY REGISTRATION FORM
 * ============================================================
 */

const emptyForm = {
  /*
   * SECTION I
   */
  investigatorName: "",
  registrationDate: "",
  officialName: "",
  aliases: "",
  unidentifiedCult: false,
  dateFirstIdentified: "",
  status: "Unknown",

  /*
   * SECTION II
   */
  primaryArea: "",
  streetAddress: "",
  streetAddressLine2: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",

  /*
   * SECTION III
   */
  currentLeader: "",
  knownTitles: "",
  leadershipStructure: "",
  secondInCommand: "",
  otherKnownLeaders: "",
  estimatedMembers: "",
  knownMembers: "",

  /*
   * SECTION IV
   */
  selfDescription: "",
  religiousTradition: "",
  primaryEntity: "",
  entityClaim: "",
  entityRelationship: "",
  entityProvides: "",

  /*
   * SECTION V
   */
  practices: [],
  materials: [],

  /*
   * SECTION VI
   */
  incidentDate: "",
  incidentTime: "",
  incidentLocation: "",
  activityType: "",
  incidentDescription: "",
  invokedEntity: "",
  evidenceSources: [],
  sourceCitation: "",

  /*
   * SECTION VII
   */
  violence: [],
  criminalActivityDetails: "",

  /*
   * SECTION VIII
   */
  primaryClass: "UNCLASSIFIED / INSUFFICIENT EVIDENCE",
  organizationLevel: "",
  supernaturalActivity: "",
  violenceLevel: "",
  influenceLevel: "",
  primaryIntent: "",
  overallThreat: "UNKNOWN",
  threatReason: "",

  /*
   * SECTION IX
   */
  knownAssociates: "",
  associatedOrganizations: "",
  associatedLocations: "",
  associatedEntities: "",
  knownSymbols: "",
  knownTexts: "",
  knownDates: "",
  patternsIdentified: "",
  outstandingQuestions: "",
};


/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

function CultRegistry() {
  const [search, setSearch] = useState("");
  const [classificationFilter, setClassificationFilter] =
    useState("All");

  const [organizations, setOrganizations] = useState([
    initialOrganization,
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showRegistration, setShowRegistration] =
    useState(false);

  const [registrationStep, setRegistrationStep] =
    useState(1);

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");

  /*
   * ==========================================================
   * LOAD FIRESTORE ORGANIZATIONS
   * ==========================================================
   */

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      setLoading(true);

      const snapshot = await getDocs(
        collection(db, "cults")
      );

      const firestoreOrganizations =
        snapshot.docs.map((cultDoc) => {
          const data = cultDoc.data();

          return {
            firestoreId: cultDoc.id,

            id:
              data.cultId ||
              data.id ||
              cultDoc.id,

            name:
              data.officialName ||
              data.name ||
              "Unnamed Organization",

            classification:
              data.classification ||
              "Unknown",

            locations:
              Array.isArray(data.locations)
                ? data.locations
                : [],

            incidents:
              data.incidents || 0,

            entities:
              data.entities || 0,

            evidence:
              data.evidence || 0,

            status:
              data.status ||
              "Unknown",

            ...data,
          };
        });

      /*
       * Dakhma remains the initial registry record.
       *
       * If it ever gets added to Firestore, don't display
       * it twice.
       */

      const hasDakhma =
        firestoreOrganizations.some(
          (organization) =>
            organization.id === "CULT-001"
        );

      const combined =
        hasDakhma
          ? firestoreOrganizations
          : [
              initialOrganization,
              ...firestoreOrganizations,
            ];

      setOrganizations(combined);
    } catch (err) {
      console.error(
        "Error loading cult organizations:",
        err
      );

      /*
       * Keep Dakhma visible even if Firestore is unavailable.
       */

      setOrganizations([
        initialOrganization,
      ]);
    } finally {
      setLoading(false);
    }
  }


  /*
   * ==========================================================
   * FORM HELPERS
   * ==========================================================
   */

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleArrayValue(
    field,
    value
  ) {
    setForm((previous) => {
      const current =
        Array.isArray(previous[field])
          ? previous[field]
          : [];

      const exists =
        current.includes(value);

      return {
        ...previous,
        [field]: exists
          ? current.filter(
              (item) => item !== value
            )
          : [...current, value],
      };
    });
  }


  /*
   * ==========================================================
   * REGISTRATION MODAL
   * ==========================================================
   */

  function openRegistration() {
    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    setForm({
      ...emptyForm,
      registrationDate: today,
    });

    setRegistrationStep(1);
    setError("");
    setShowRegistration(true);
  }

  function closeRegistration() {
    if (saving) {
      return;
    }

    setShowRegistration(false);
    setRegistrationStep(1);
    setForm(emptyForm);
    setError("");
  }


  /*
   * ==========================================================
   * STEP VALIDATION
   * ==========================================================
   */

  function validateStep() {
    setError("");

    if (registrationStep === 1) {
      if (!form.investigatorName.trim()) {
        setError(
          "Your Full Name is required."
        );
        return false;
      }

      if (!form.registrationDate) {
        setError(
          "Registration date is required."
        );
        return false;
      }

      if (
        !form.officialName.trim() &&
        !form.unidentifiedCult
      ) {
        setError(
          "Enter the Official Name of the Group or select Unidentified Cult."
        );
        return false;
      }
    }

    if (registrationStep === 2) {
      if (!form.primaryArea.trim()) {
        setError(
          "Primary Area of Operation is required."
        );
        return false;
      }

      if (!form.city.trim()) {
        setError(
          "City is required."
        );
        return false;
      }

      if (!form.stateProvince.trim()) {
        setError(
          "State / Province is required."
        );
        return false;
      }

      if (!form.country.trim()) {
        setError(
          "Country is required."
        );
        return false;
      }
    }

    if (registrationStep === 4) {
      if (!form.religiousTradition.trim()) {
        setError(
          "Religious / Occult Tradition is required."
        );
        return false;
      }
    }

    if (registrationStep === 8) {
      if (!form.primaryClass) {
        setError(
          "Primary Class is required."
        );
        return false;
      }

      if (!form.overallThreat) {
        setError(
          "Overall Threat is required."
        );
        return false;
      }
    }

    return true;
  }


  function nextStep() {
    if (!validateStep()) {
      return;
    }

    if (registrationStep < 9) {
      setRegistrationStep(
        (previous) => previous + 1
      );
    }
  }


  function previousStep() {
    setError("");

    if (registrationStep > 1) {
      setRegistrationStep(
        (previous) => previous - 1
      );
    }
  }


  /*
   * ==========================================================
   * CULT ID GENERATION
   * ==========================================================
   */

  function generateCultId(
    existingOrganizations
  ) {
    let highestNumber = 0;

    existingOrganizations.forEach(
      (organization) => {
        const match =
          String(
            organization.id || ""
          ).match(
            /^CULT-(\d+)$/
          );

        if (!match) {
          return;
        }

        const number =
          parseInt(
            match[1],
            10
          );

        if (
          number >
          highestNumber
        ) {
          highestNumber =
            number;
        }
      }
    );

    return `CULT-${String(
      highestNumber + 1
    ).padStart(3, "0")}`;
  }


  /*
   * ==========================================================
   * SAVE ORGANIZATION
   * ==========================================================
   */

  async function handleRegisterOrganization(
    event
  ) {
    event.preventDefault();

    setError("");

    if (!validateStep()) {
      return;
    }

    if (!form.officialName.trim()) {
      /*
       * Unidentified organizations still need a usable
       * display name.
       */

      if (form.unidentifiedCult) {
        form.officialName =
          "Unidentified Cult";
      } else {
        setError(
          "Organization name is required."
        );
        return;
      }
    }

    try {
      setSaving(true);

      /*
       * Re-read Firestore before creating the ID so we don't
       * accidentally reuse a number.
       */

      const snapshot = await getDocs(
        collection(db, "cults")
      );

      const firestoreOrganizations =
        snapshot.docs.map(
          (cultDoc) => {
            const data =
              cultDoc.data();

            return {
              id:
                data.cultId ||
                data.id ||
                cultDoc.id,
            };
          }
        );

      const existingOrganizations = [
        ...organizations,
        ...firestoreOrganizations,
      ];

      const cultId =
        generateCultId(
          existingOrganizations
        );

      /*
       * Build location array for the registry.
       */

      const locations = [
        form.city,
        form.stateProvince,
        form.country,
      ].filter(Boolean);

      if (
        form.primaryArea.trim() &&
        !locations.includes(
          form.primaryArea.trim()
        )
      ) {
        locations.unshift(
          form.primaryArea.trim()
        );
      }

      /*
       * Create the complete Firestore record.
       */

      const organizationRecord = {
        cultId,

        officialName:
          form.officialName.trim(),

        aliases:
          form.aliases
            .split(",")
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean),

        unidentifiedCult:
          form.unidentifiedCult,

        investigatorName:
          form.investigatorName.trim(),

        registrationDate:
          form.registrationDate,

        dateFirstIdentified:
          form.dateFirstIdentified,

        status:
          form.status,

        /*
         * Location
         */

        primaryArea:
          form.primaryArea.trim(),

        streetAddress:
          form.streetAddress.trim(),

        streetAddressLine2:
          form.streetAddressLine2.trim(),

        city:
          form.city.trim(),

        stateProvince:
          form.stateProvince.trim(),

        postalCode:
          form.postalCode.trim(),

        country:
          form.country.trim(),

        locations,

        /*
         * Leadership
         */

        currentLeader:
          form.currentLeader.trim(),

        knownTitles:
          form.knownTitles.trim(),

        leadershipStructure:
          form.leadershipStructure,

        secondInCommand:
          form.secondInCommand.trim(),

        otherKnownLeaders:
          form.otherKnownLeaders.trim(),

        estimatedMembers:
          form.estimatedMembers,

        knownMembers:
          form.knownMembers.trim(),

        /*
         * Belief System
         */

        selfDescription:
          form.selfDescription.trim(),

        religiousTradition:
          form.religiousTradition.trim(),

        primaryEntity:
          form.primaryEntity.trim(),

        entityClaim:
          form.entityClaim,

        entityRelationship:
          form.entityRelationship,

        entityProvides:
          form.entityProvides.trim(),

        /*
         * Ritual / Practices
         */

        practices:
          form.practices,

        materials:
          form.materials,

        /*
         * Incident
         */

        incident: {
          date:
            form.incidentDate,

          approximateTime:
            form.incidentTime,

          location:
            form.incidentLocation.trim(),

          activityType:
            form.activityType.trim(),

          description:
            form.incidentDescription.trim(),

          invokedEntity:
            form.invokedEntity.trim(),

          evidenceSources:
            form.evidenceSources,

          sourceCitation:
            form.sourceCitation.trim(),
        },

        /*
         * Violence
         */

        violence:
          form.violence,

        criminalActivityDetails:
          form.criminalActivityDetails.trim(),

        /*
         * Classification
         */

        primaryClass:
          form.primaryClass,

        organizationLevel:
          form.organizationLevel,

        supernaturalActivity:
          form.supernaturalActivity,

        violenceLevel:
          form.violenceLevel,

        influenceLevel:
          form.influenceLevel,

        primaryIntent:
          form.primaryIntent,

        overallThreat:
          form.overallThreat,

        threatReason:
          form.threatReason.trim(),

        /*
         * Investigator Notes
         */

        knownAssociates:
          form.knownAssociates.trim(),

        associatedOrganizations:
          form.associatedOrganizations.trim(),

        associatedLocations:
          form.associatedLocations.trim(),

        associatedEntities:
          form.associatedEntities.trim(),

        knownSymbols:
          form.knownSymbols.trim(),

        knownTexts:
          form.knownTexts.trim(),

        knownDates:
          form.knownDates.trim(),

        patternsIdentified:
          form.patternsIdentified.trim(),

        outstandingQuestions:
          form.outstandingQuestions.trim(),

        /*
         * Registry counters
         */

        incidents:
          form.incidentDate ||
          form.incidentDescription
            ? 1
            : 0,

        entities:
          form.associatedEntities.trim()
            ? 1
            : 0,

        evidence:
          form.evidenceSources.length,

        classification:
          form.primaryClass,

        name:
          form.officialName.trim(),

        locations,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      await addDoc(
        collection(
          db,
          "cults"
        ),
        organizationRecord
      );

      /*
       * Reload the registry.
       */

      await loadOrganizations();

      /*
       * Close registration window.
       */

      setShowRegistration(false);
      setRegistrationStep(1);
      setForm(emptyForm);
    } catch (err) {
      console.error(
        "Error registering organization:",
        err
      );

      setError(
        "Unable to register the organization. Check your Firestore permissions and try again."
      );
    } finally {
      setSaving(false);
    }
  }


  /*
   * ==========================================================
   * FILTER
   * ==========================================================
   */

  const filteredOrganizations =
    organizations.filter(
      (organization) => {
        const searchTerm =
          search
            .trim()
            .toLowerCase();

        const matchesSearch =
          organization.name
            .toLowerCase()
            .includes(
              searchTerm
            ) ||
          organization.id
            .toLowerCase()
            .includes(
              searchTerm
            );

        const matchesClassification =
          classificationFilter ===
            "All" ||
          organization.classification ===
            classificationFilter;

        return (
          matchesSearch &&
          matchesClassification
        );
      }
    );


  /*
   * ==========================================================
   * STATISTICS
   * ==========================================================
   */

  const registeredOrganizations =
    organizations.length;

  const knownIncidents =
    organizations.reduce(
      (total, organization) =>
        total +
        (organization.incidents ||
          0),
      0
    );

  const associatedEntities =
    organizations.reduce(
      (total, organization) =>
        total +
        (organization.entities ||
          0),
      0
    );

  const evidenceResearch =
    organizations.reduce(
      (total, organization) =>
        total +
        (organization.evidence ||
          0),
      0
    );


  /*
   * ==========================================================
   * STEP TITLES
   * ==========================================================
   */

  const stepTitles = [
    "Organization Identification",
    "Location",
    "Leadership & Membership",
    "Belief System",
    "Ritual & Occult Practices",
    "Recent Incidents & Ritual History",
    "Violence & Criminal Activity",
    "Organizational Classification",
    "Investigator Notes",
  ];


  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="nh-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="nh-page-header">

        <div>

          <h1 className="nh-page-title">
            Cult Registry
          </h1>

          <p className="nh-page-subtitle">
            Organization records, incidents,
            associated entities, and research.
          </p>

        </div>

        <button
          type="button"
          className="nh-button nh-button-primary"
          onClick={
            openRegistration
          }
        >
          + Register Organization
        </button>

      </div>


      {/* =====================================================
          STATISTICS
          ===================================================== */}

      <section className="nh-cult-overview">

        <div className="nh-cult-stat nh-card">

          <div className="nh-cult-stat-label">
            Registered Organizations
          </div>

          <div className="nh-cult-stat-value">
            {String(
              registeredOrganizations
            ).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-cult-stat nh-card">

          <div className="nh-cult-stat-label">
            Known Incidents
          </div>

          <div className="nh-cult-stat-value">
            {String(
              knownIncidents
            ).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-cult-stat nh-card">

          <div className="nh-cult-stat-label">
            Associated Entities
          </div>

          <div className="nh-cult-stat-value">
            {String(
              associatedEntities
            ).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-cult-stat nh-card">

          <div className="nh-cult-stat-label">
            Evidence / Research
          </div>

          <div className="nh-cult-stat-value">
            {String(
              evidenceResearch
            ).padStart(2, "0")}
          </div>

        </div>

      </section>


      {/* =====================================================
          SEARCH / FILTERS
          ===================================================== */}

      <section className="nh-cult-controls nh-card">

        <div className="nh-search-wrapper">

          <input
            type="text"
            className="nh-search-input"
            placeholder="Search organizations or registry IDs..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <select
          className="nh-filter-select"
          value={
            classificationFilter
          }
          onChange={(event) =>
            setClassificationFilter(
              event.target.value
            )
          }
        >

          <option value="All">
            All Classifications
          </option>

          <option value="Occult">
            Occult
          </option>

          <option value="Religious">
            Religious
          </option>

          <option value="Satanic">
            Satanic
          </option>

          <option value="Extremist">
            Extremist
          </option>

          <option value="Unknown">
            Unknown
          </option>

        </select>

      </section>


      {/* =====================================================
          REGISTRY
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Organization Records
            </h2>

            <p className="nh-section-subtitle">
              Registered organizations and associated
              investigative information.
            </p>

          </div>

          <span className="nh-member-count">
            {filteredOrganizations.length} records
          </span>

        </div>


        <div className="nh-card nh-cult-table">

          {/* TABLE HEADER */}

          <div className="nh-cult-row nh-cult-header">

            <div>
              Organization
            </div>

            <div>
              Classification
            </div>

            <div>
              Locations
            </div>

            <div>
              Incidents
            </div>

            <div>
              Entities
            </div>

            <div>
              Evidence
            </div>

            <div>
              Status
            </div>

          </div>


          {/* RECORDS */}

          {loading ? (

            <div className="nh-cult-empty">
              Loading organization records...
            </div>

          ) : (

            filteredOrganizations.map(
              (organization) => (

                <div
                  className="nh-cult-row"
                  key={
                    organization.firestoreId ||
                    organization.id
                  }
                >

                  <div className="nh-cult-identity">

                    <div className="nh-cult-icon">
                      ◇
                    </div>

                    <div>

                      <div className="nh-list-title">
                        {organization.name}
                      </div>

                      <div className="nh-list-meta">
                        {organization.id}
                      </div>

                    </div>

                  </div>


                  <div>

                    <span className="nh-cult-classification">
                      {
                        organization.classification
                      }
                    </span>

                  </div>


                  <div className="nh-cult-locations">

                    {(
                      organization.locations ||
                      []
                    )
                      .slice(0, 2)
                      .map(
                        (
                          location,
                          index
                        ) => (

                          <span
                            key={
                              index
                            }
                          >
                            {location}
                          </span>

                        )
                      )}

                    {(
                      organization.locations ||
                      []
                    ).length >
                      2 && (

                      <span className="nh-cult-more">
                        +
                        {organization.locations.length -
                          2}
                      </span>

                    )}

                  </div>


                  <div className="nh-cult-number">
                    {
                      organization.incidents ||
                      0
                    }
                  </div>


                  <div className="nh-cult-number">
                    {
                      organization.entities ||
                      0
                    }
                  </div>


                  <div className="nh-cult-number">
                    {
                      organization.evidence ||
                      0
                    }
                  </div>


                  <div>

                    <span className="nh-status nh-status-active">
                      {
                        organization.status
                      }
                    </span>

                  </div>

                </div>

              )
            )

          )}


          {filteredOrganizations.length ===
            0 &&
            !loading && (

              <div className="nh-cult-empty">

                <div
                  style={{
                    fontSize: "28px",
                    marginBottom: "10px",
                    opacity: 0.5,
                  }}
                >
                  ◇
                </div>

                <div>
                  No organizations found.
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    opacity: 0.65,
                  }}
                >
                  Click "+ Register Organization"
                  to create the first record.
                </div>

              </div>

            )}

        </div>

      </section>


      {/* =====================================================
          REGISTRATION MODAL
          ===================================================== */}

      {showRegistration && (

        <div
          className="nh-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeRegistration();
            }

          }}
        >

          <div
            className="nh-modal nh-cult-registration-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
                ================================================= */}

            <div className="nh-modal-header">

              <div>

                <div className="nh-command-label">
                  ORGANIZATION REGISTRATION
                </div>

                <h2 className="nh-modal-title">
                  Register Organization
                </h2>

                <p className="nh-modal-subtitle">
                  Step {registrationStep} of 9 —{" "}
                  {
                    stepTitles[
                      registrationStep - 1
                    ]
                  }
                </p>

              </div>


              <button
                type="button"
                className="nh-modal-close"
                onClick={
                  closeRegistration
                }
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* =================================================
                PROGRESS BAR
                ================================================= */}

            <div className="nh-cult-registration-progress">

              {stepTitles.map(
                (
                  title,
                  index
                ) => {

                  const stepNumber =
                    index + 1;

                  return (
                    <div
                      key={
                        title
                      }
                      className={
                        "nh-cult-progress-step " +
                        (
                          stepNumber ===
                          registrationStep
                            ? "active"
                            : ""
                        ) +
                        (
                          stepNumber <
                          registrationStep
                            ? " completed"
                            : ""
                        )
                      }
                    >
                      <span>
                        {stepNumber}
                      </span>
                    </div>
                  );

                }
              )}

            </div>


            {/* =================================================
                FORM
                ================================================= */}

            <form
              className="nh-cult-registration-form"
              onSubmit={
                handleRegisterOrganization
              }
            >

              {error && (

                <div className="nh-form-error">
                  {error}
                </div>

              )}


              {/* =================================================
                  STEP 1 — IDENTIFICATION
                  ================================================= */}

              {registrationStep === 1 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section I — Organization Identification
                  </div>


                  <div className="nh-entity-form-grid">

                    <div className="nh-entity-form-field">

                      <label>
                        Your Full Name *
                      </label>

                      <input
                        type="text"
                        value={
                          form.investigatorName
                        }
                        onChange={(event) =>
                          updateField(
                            "investigatorName",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Registration Date *
                      </label>

                      <input
                        type="date"
                        value={
                          form.registrationDate
                        }
                        onChange={(event) =>
                          updateField(
                            "registrationDate",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Official Name of Group
                      </label>

                      <input
                        type="text"
                        value={
                          form.officialName
                        }
                        onChange={(event) =>
                          updateField(
                            "officialName",
                            event.target.value
                          )
                        }
                        placeholder="Enter organization name..."
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Aliases / Alternate Names
                      </label>

                      <input
                        type="text"
                        value={
                          form.aliases
                        }
                        onChange={(event) =>
                          updateField(
                            "aliases",
                            event.target.value
                          )
                        }
                        placeholder="Separate multiple names with commas..."
                      />

                    </div>

                  </div>


                  <label className="nh-cult-checkbox-row">

                    <input
                      type="checkbox"
                      checked={
                        form.unidentifiedCult
                      }
                      onChange={(event) =>
                        updateField(
                          "unidentifiedCult",
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      Unidentified Cult
                    </span>

                  </label>


                  <div className="nh-entity-form-grid">

                    <div className="nh-entity-form-field">

                      <label>
                        Date First Identified
                      </label>

                      <input
                        type="date"
                        value={
                          form.dateFirstIdentified
                        }
                        onChange={(event) =>
                          updateField(
                            "dateFirstIdentified",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Status
                      </label>

                      <select
                        value={
                          form.status
                        }
                        onChange={(event) =>
                          updateField(
                            "status",
                            event.target.value
                          )
                        }
                      >

                        {statusOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 2 — LOCATION
                  ================================================= */}

              {registrationStep === 2 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section II — Location
                  </div>


                  <div className="nh-entity-form-grid">

                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Primary Area of Operation *
                      </label>

                      <input
                        type="text"
                        value={
                          form.primaryArea
                        }
                        onChange={(event) =>
                          updateField(
                            "primaryArea",
                            event.target.value
                          )
                        }
                        placeholder="Example: Oklahoma City, Oklahoma"
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Street Address
                      </label>

                      <input
                        type="text"
                        value={
                          form.streetAddress
                        }
                        onChange={(event) =>
                          updateField(
                            "streetAddress",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Street Address Line 2
                      </label>

                      <input
                        type="text"
                        value={
                          form.streetAddressLine2
                        }
                        onChange={(event) =>
                          updateField(
                            "streetAddressLine2",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        City *
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
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        State / Province *
                      </label>

                      <input
                        type="text"
                        value={
                          form.stateProvince
                        }
                        onChange={(event) =>
                          updateField(
                            "stateProvince",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        ZIP / Postal Code
                      </label>

                      <input
                        type="text"
                        value={
                          form.postalCode
                        }
                        onChange={(event) =>
                          updateField(
                            "postalCode",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Country *
                      </label>

                      <input
                        type="text"
                        value={
                          form.country
                        }
                        onChange={(event) =>
                          updateField(
                            "country",
                            event.target.value
                          )
                        }
                        placeholder="United States"
                      />

                    </div>

                  </div>


                  <div className="nh-cult-safety-note">

                    <strong>
                      Safety Note
                    </strong>

                    <span>
                      Do not trespass, confront members,
                      enter abandoned structures, or attempt
                      to infiltrate a group while gathering
                      this information.
                    </span>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 3 — LEADERSHIP
                  ================================================= */}

              {registrationStep === 3 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section III — Leadership & Membership
                  </div>


                  <div className="nh-entity-form-grid">

                    <div className="nh-entity-form-field">

                      <label>
                        Current Leader
                      </label>

                      <input
                        type="text"
                        value={
                          form.currentLeader
                        }
                        onChange={(event) =>
                          updateField(
                            "currentLeader",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Known Titles
                      </label>

                      <input
                        type="text"
                        value={
                          form.knownTitles
                        }
                        onChange={(event) =>
                          updateField(
                            "knownTitles",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Leadership Structure
                      </label>

                      <select
                        value={
                          form.leadershipStructure
                        }
                        onChange={(event) =>
                          updateField(
                            "leadershipStructure",
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Structure
                        </option>

                        {leadershipOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Second-in-Command
                      </label>

                      <input
                        type="text"
                        value={
                          form.secondInCommand
                        }
                        onChange={(event) =>
                          updateField(
                            "secondInCommand",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Estimated Number of Members
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          form.estimatedMembers
                        }
                        onChange={(event) =>
                          updateField(
                            "estimatedMembers",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Other Known Leaders
                      </label>

                      <textarea
                        rows="3"
                        value={
                          form.otherKnownLeaders
                        }
                        onChange={(event) =>
                          updateField(
                            "otherKnownLeaders",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Known Members
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.knownMembers
                        }
                        onChange={(event) =>
                          updateField(
                            "knownMembers",
                            event.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 4 — BELIEF SYSTEM
                  ================================================= */}

              {registrationStep === 4 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section IV — Belief System
                  </div>


                  <div className="nh-entity-form-field nh-entity-form-field-wide">

                    <label>
                      How does the organization describe itself?
                    </label>

                    <textarea
                      rows="4"
                      value={
                        form.selfDescription
                      }
                      onChange={(event) =>
                        updateField(
                          "selfDescription",
                          event.target.value
                        )
                      }
                    />

                  </div>


                  <div className="nh-entity-form-field nh-entity-form-field-wide">

                    <label>
                      Religious / Occult Tradition *
                    </label>

                    <input
                      type="text"
                      value={
                        form.religiousTradition
                      }
                      onChange={(event) =>
                        updateField(
                          "religiousTradition",
                          event.target.value
                        )
                      }
                      placeholder="Enter tradition..."
                    />

                  </div>


                  <div className="nh-entity-form-grid">

                    <div className="nh-entity-form-field">

                      <label>
                        Primary Deity / Entity / Spirit Worshipped
                      </label>

                      <input
                        type="text"
                        value={
                          form.primaryEntity
                        }
                        onChange={(event) =>
                          updateField(
                            "primaryEntity",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Claimed Entity Type
                      </label>

                      <select
                        value={
                          form.entityClaim
                        }
                        onChange={(event) =>
                          updateField(
                            "entityClaim",
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Type
                        </option>

                        {entityClaimOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Claimed Relationship With Entity
                      </label>

                      <select
                        value={
                          form.entityRelationship
                        }
                        onChange={(event) =>
                          updateField(
                            "entityRelationship",
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Relationship
                        </option>

                        {relationshipOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        What does the group claim the entity provides?
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.entityProvides
                        }
                        onChange={(event) =>
                          updateField(
                            "entityProvides",
                            event.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 5 — PRACTICES
                  ================================================= */}

              {registrationStep === 5 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section V — Ritual & Occult Practices
                  </div>


                  <div className="nh-cult-checkbox-section">

                    <div className="nh-cult-checkbox-heading">
                      Known / Reported Practices
                    </div>

                    <div className="nh-cult-checkbox-grid">

                      {practiceOptions.map(
                        (option) => (

                          <label
                            className="nh-cult-checkbox-row"
                            key={
                              option
                            }
                          >

                            <input
                              type="checkbox"
                              checked={form.practices.includes(
                                option
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  "practices",
                                  option
                                )
                              }
                            />

                            <span>
                              {option}
                            </span>

                          </label>

                        )
                      )}

                    </div>

                  </div>


                  <div className="nh-cult-checkbox-section">

                    <div className="nh-cult-checkbox-heading">
                      Reported / Observed Materials
                    </div>

                    <div className="nh-cult-checkbox-grid">

                      {materialOptions.map(
                        (option) => (

                          <label
                            className="nh-cult-checkbox-row"
                            key={
                              option
                            }
                          >

                            <input
                              type="checkbox"
                              checked={form.materials.includes(
                                option
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  "materials",
                                  option
                                )
                              }
                            />

                            <span>
                              {option}
                            </span>

                          </label>

                        )
                      )}

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 6 — INCIDENT
                  ================================================= */}

              {registrationStep === 6 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section VI — Recent Incidents & Ritual History
                  </div>


                  <div className="nh-entity-form-grid">

                    <div className="nh-entity-form-field">

                      <label>
                        Date
                      </label>

                      <input
                        type="date"
                        value={
                          form.incidentDate
                        }
                        onChange={(event) =>
                          updateField(
                            "incidentDate",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Approximate Time
                      </label>

                      <input
                        type="text"
                        value={
                          form.incidentTime
                        }
                        onChange={(event) =>
                          updateField(
                            "incidentTime",
                            event.target.value
                          )
                        }
                        placeholder="Example: Approximately 11:30 PM"
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Location
                      </label>

                      <input
                        type="text"
                        value={
                          form.incidentLocation
                        }
                        onChange={(event) =>
                          updateField(
                            "incidentLocation",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Type of Activity
                      </label>

                      <textarea
                        rows="3"
                        value={
                          form.activityType
                        }
                        onChange={(event) =>
                          updateField(
                            "activityType",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        What reportedly occurred?
                      </label>

                      <textarea
                        rows="5"
                        value={
                          form.incidentDescription
                        }
                        onChange={(event) =>
                          updateField(
                            "incidentDescription",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Entity Invoked / Worshipped
                      </label>

                      <input
                        type="text"
                        value={
                          form.invokedEntity
                        }
                        onChange={(event) =>
                          updateField(
                            "invokedEntity",
                            event.target.value
                          )
                        }
                      />

                    </div>

                  </div>


                  <div className="nh-cult-checkbox-section">

                    <div className="nh-cult-checkbox-heading">
                      Evidence Source
                    </div>

                    <div className="nh-cult-checkbox-grid">

                      {evidenceSourceOptions.map(
                        (option) => (

                          <label
                            className="nh-cult-checkbox-row"
                            key={
                              option
                            }
                          >

                            <input
                              type="checkbox"
                              checked={form.evidenceSources.includes(
                                option
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  "evidenceSources",
                                  option
                                )
                              }
                            />

                            <span>
                              {option}
                            </span>

                          </label>

                        )
                      )}

                    </div>

                  </div>


                  <div className="nh-entity-form-field nh-entity-form-field-wide">

                    <label>
                      Source / Citation
                    </label>

                    <textarea
                      rows="4"
                      value={
                        form.sourceCitation
                      }
                      onChange={(event) =>
                        updateField(
                          "sourceCitation",
                          event.target.value
                        )
                      }
                      placeholder="URL, document reference, case file, interview reference, etc."
                    />

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 7 — VIOLENCE
                  ================================================= */}

              {registrationStep === 7 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section VII — Violence & Criminal Activity
                  </div>


                  <div className="nh-cult-checkbox-section">

                    <div className="nh-cult-checkbox-heading">
                      Known or Alleged Violence
                    </div>

                    <div className="nh-cult-checkbox-grid">

                      {violenceOptions.map(
                        (option) => (

                          <label
                            className="nh-cult-checkbox-row"
                            key={
                              option
                            }
                          >

                            <input
                              type="checkbox"
                              checked={form.violence.includes(
                                option
                              )}
                              onChange={() =>
                                toggleArrayValue(
                                  "violence",
                                  option
                                )
                              }
                            />

                            <span>
                              {option}
                            </span>

                          </label>

                        )
                      )}

                    </div>

                  </div>


                  <div className="nh-entity-form-field nh-entity-form-field-wide">

                    <label>
                      Details of Criminal Activity
                    </label>

                    <textarea
                      rows="7"
                      value={
                        form.criminalActivityDetails
                      }
                      onChange={(event) =>
                        updateField(
                          "criminalActivityDetails",
                          event.target.value
                        )
                      }
                      placeholder="Document verified information, allegations, source material, and relevant context..."
                    />

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 8 — CLASSIFICATION
                  ================================================= */}

              {registrationStep === 8 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section VIII — Organizational Classification
                  </div>


                  <div className="nh-entity-form-grid">

                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Primary Class *
                      </label>

                      <select
                        value={
                          form.primaryClass
                        }
                        onChange={(event) =>
                          updateField(
                            "primaryClass",
                            event.target.value
                          )
                        }
                      >

                        {primaryClassOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Organization — O1–O5
                      </label>

                      <select
                        value={
                          form.organizationLevel
                        }
                        onChange={(event) =>
                          updateField(
                            "organizationLevel",
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Level
                        </option>

                        {organizationLevelOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Supernatural Activity — S1–S5
                      </label>

                      <select
                        value={
                          form.supernaturalActivity
                        }
                        onChange={(event) =>
                          updateField(
                            "supernaturalActivity",
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Level
                        </option>

                        {supernaturalActivityOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Violence — V0–V5
                      </label>

                      <select
                        value={
                          form.violenceLevel
                        }
                        onChange={(event) =>
                          updateField(
                            "violenceLevel",
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Level
                        </option>

                        {violenceLevelOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Influence — I0–I5
                      </label>

                      <select
                        value={
                          form.influenceLevel
                        }
                        onChange={(event) =>
                          updateField(
                            "influenceLevel",
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Level
                        </option>

                        {influenceOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Primary Intent
                      </label>

                      <select
                        value={
                          form.primaryIntent
                        }
                        onChange={(event) =>
                          updateField(
                            "primaryIntent",
                            event.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Intent
                        </option>

                        {intentOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Overall Threat *
                      </label>

                      <select
                        value={
                          form.overallThreat
                        }
                        onChange={(event) =>
                          updateField(
                            "overallThreat",
                            event.target.value
                          )
                        }
                      >

                        {threatOptions.map(
                          (option) => (

                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {option}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Why?
                      </label>

                      <textarea
                        rows="5"
                        value={
                          form.threatReason
                        }
                        onChange={(event) =>
                          updateField(
                            "threatReason",
                            event.target.value
                          )
                        }
                        placeholder="Explain the basis for the assigned threat level..."
                      />

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  STEP 9 — INVESTIGATOR NOTES
                  ================================================= */}

              {registrationStep === 9 && (

                <div className="nh-cult-form-section">

                  <div className="nh-entity-form-section-title">
                    Section IX — Investigator Notes
                  </div>


                  <div className="nh-entity-form-grid">

                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Known Associates
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.knownAssociates
                        }
                        onChange={(event) =>
                          updateField(
                            "knownAssociates",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Associated Organizations
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.associatedOrganizations
                        }
                        onChange={(event) =>
                          updateField(
                            "associatedOrganizations",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Associated Locations
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.associatedLocations
                        }
                        onChange={(event) =>
                          updateField(
                            "associatedLocations",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Associated Entities
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.associatedEntities
                        }
                        onChange={(event) =>
                          updateField(
                            "associatedEntities",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Known Symbols
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.knownSymbols
                        }
                        onChange={(event) =>
                          updateField(
                            "knownSymbols",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Known Texts / Scriptures / Books
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.knownTexts
                        }
                        onChange={(event) =>
                          updateField(
                            "knownTexts",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Known Dates of Significance
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.knownDates
                        }
                        onChange={(event) =>
                          updateField(
                            "knownDates",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field">

                      <label>
                        Patterns Identified
                      </label>

                      <textarea
                        rows="4"
                        value={
                          form.patternsIdentified
                        }
                        onChange={(event) =>
                          updateField(
                            "patternsIdentified",
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="nh-entity-form-field nh-entity-form-field-wide">

                      <label>
                        Outstanding Questions
                      </label>

                      <textarea
                        rows="6"
                        value={
                          form.outstandingQuestions
                        }
                        onChange={(event) =>
                          updateField(
                            "outstandingQuestions",
                            event.target.value
                          )
                        }
                        placeholder="What still needs to be researched or verified?"
                      />

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  FINAL REVIEW
                  ================================================= */}

              {registrationStep === 9 && (

                <div className="nh-cult-review">

                  <div className="nh-cult-review-title">
                    Registration Review
                  </div>

                  <div className="nh-cult-review-grid">

                    <div>
                      <span>
                        Organization
                      </span>

                      <strong>
                        {form.officialName ||
                          "Unidentified Cult"}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        {form.status}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Primary Class
                      </span>

                      <strong>
                        {form.primaryClass}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Threat
                      </span>

                      <strong>
                        {form.overallThreat}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Primary Area
                      </span>

                      <strong>
                        {form.primaryArea ||
                          "Not specified"}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Leadership
                      </span>

                      <strong>
                        {form.leadershipStructure ||
                          "Unknown"}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Practices
                      </span>

                      <strong>
                        {form.practices.length}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Evidence Sources
                      </span>

                      <strong>
                        {
                          form
                            .evidenceSources
                            .length
                        }
                      </strong>
                    </div>

                  </div>


                  <div className="nh-cult-review-note">

                    <strong>
                      Ready to Register
                    </strong>

                    <span>
                      Review the information above.
                      Selecting "Register Organization"
                      will create the next available CULT
                      registry record in Firestore.
                    </span>

                  </div>

                </div>

              )}


              {/* =================================================
                  MODAL ACTIONS
                  ================================================= */}

              <div className="nh-modal-actions">

                <button
                  type="button"
                  className="nh-button nh-button-secondary"
                  onClick={
                    registrationStep === 1
                      ? closeRegistration
                      : previousStep
                  }
                  disabled={saving}
                >
                  {registrationStep === 1
                    ? "Cancel"
                    : "← Back"}
                </button>


                {registrationStep <
                9 ? (

                  <button
                    type="button"
                    className="nh-button nh-button-primary"
                    onClick={
                      nextStep
                    }
                    disabled={saving}
                  >
                    Continue →
                  </button>

                ) : (

                  <button
                    type="submit"
                    className="nh-button nh-button-primary"
                    disabled={saving}
                  >
                    {saving
                      ? "Registering..."
                      : "Register Organization"}
                  </button>

                )}

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default CultRegistry;