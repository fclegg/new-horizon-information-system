import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase/config";

/*
 * =========================================================
 * DEMON TERMS DATABASE
 * =========================================================
 *
 * These values are based on the New Horizon Demon Terms
 * reference document.
 *
 * Types
 * Sub-Types
 * Classes
 * Sub-Classes
 * Ranks
 * =========================================================
 */

const entityTypes = [
  "Banshee",
  "Cherub / Cherubim",
  "Fujin",
  "Gorgon / Gorgons",
  "Hellhound / Hellhounds",
  "Humanoid / Humanoids",
  "Kappa / Kappas",
  "Lauma / Laumi",
  "Naga / Nagas",
  "Ofan / Ophanim",
  "Ore / Orim",
  "Satyr / Satyrs",
  "Seraph / Seraphim",
  "Witiko / Witego",
  "Zohar / Zoharim",
];

const entitySubtypes = [
  "Borec / Borecs",
  "Daeva",
  "Coreum / Coreums",
  "Lurae / Lurai",
  "Niveus / Nivi",
];

const entityClasses = [
  "Adtis / Adti",
  "Berserker / Berserkers",
  "Capher / Caphers",
  "Collectors",
  "Destroyer / Destroyers",
  "Ebrius / Ebrium",
  "Elemental / Elementals",
  "Fallaci",
  "Infernal Familiar / Infernal Familiars",
  "Herald / Heralds",
  "Incubus / Incubi",
  "Infirmity / Infirmities",
  "Jinni / Jinn",
  "Mare / Mares",
  "Mortiferum Peccatorum",
  "Mute / Mutes",
  "Oppressor / Oppressors",
  "Resonant / Resonants",
  "Sentinel / Sentinels",
  "Shekeer",
  "Shinigami",
  "Succubus / Succubi",
  "Trickster / Tricksters",
  "Yahra / Yahrai",
  "Yedaw / Yeday",
];

const entitySubclasses = [
  "Avarite / Avarites",
  "Ebrius / Ebrium",
  "Gnomes",
  "Grigori",
  "Gula / Guli",
  "Invidia / Invidi",
  "Ira",
  "Libidine / Libidines",
  "Myriad / Myriads",
  "Ostiarius / Ostairiuses",
  "Otiosum / Otiosi",
  "Parash / Parashes",
  "Prince / Princes",
  "Ruler / Rulers",
  "Shamar / Shamari",
  "Superbia / Superbi",
  "Sylph",
  "Vene / Veni",
  "Warden / Wardens",
];

const entityRanks = [
  "Locus / Locuses",
  "Patriam / Patrius",
  "Populus / Populi",
  "Princes of Hell / Satan",
  "Regionem",
  "Vena / Venium",
  "Yamin / Yami",
];

const nameTypes = [
  "Pseudonym",
  "Forename",
  "Alias",
];

const eyeColors = [
  "Red",
  "White",
  "Black",
  "Yellow",
];

const encounterTypes = [
  "First-hand",
  "Second-hand",
];


/*
 * =========================================================
 * SPIRIT DATABASE
 * =========================================================
 */

function SpiritDatabase() {
  const navigate = useNavigate();

  /*
   * =========================================================
   * PAGE STATE
   * =========================================================
   */

  const [search, setSearch] = useState("");
  const [classificationFilter, setClassificationFilter] =
    useState("All");

  const [entities, setEntities] = useState([]);
  const [cases, setCases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");


  /*
   * =========================================================
   * NEW ENTITY FORM
   * =========================================================
   */

  const emptyEntity = {
    spiritName: "",
    nameType: "Pseudonym",
    nameMeaning: "",
    type: "",
    subtype: "",
    classFunction: "",
    subclass: "",
    eyeColor: "",
    rank: "",
    caseId: "",
    encounterType: "First-hand",
    encounterSource: "",
  };

  const [newEntity, setNewEntity] =
    useState(emptyEntity);


  /*
   * =========================================================
   * EXISTING TEST DATA
   * =========================================================
   *
   * These remain intentionally.
   *
   * They are not written to Firestore.
   */

  const testEntities = [
    {
      id: "ENT-001",
      name: "Example Entity",
      classification: "Demon",

      nameType: "Pseudonym",
      nameMeaning: "Example meaning",

      type: "Humanoid / Humanoids",
      subtype: "Daeva",

      classFunction:
        "Oppressor / Oppressors",

      subclass:
        "Warden / Wardens",

      eyeColor: "Red",
      rank: "Regionem",

      aliases: [
        "Example Name",
        "Alternate Name",
      ],

      characteristics: [
        "Intelligent",
        "Aggressive",
        "Auditory",
      ],

      cases: 2,
      evidence: 5,

      caseIds: [],

      status: "Active",

      encounterType: "First-hand",

      encounterSource:
        "Test investigation record",

      isTest: true,
    },

    {
      id: "ENT-002",
      name: "Unknown Male Entity",
      classification: "Human Spirit",

      nameType: "Pseudonym",
      nameMeaning: "",

      type: "",
      subtype: "",

      classFunction: "",
      subclass: "",

      eyeColor: "",
      rank: "",

      aliases: [
        "The Man",
      ],

      characteristics: [
        "Intelligent",
        "Vocal",
        "Apparition",
      ],

      cases: 1,
      evidence: 3,

      caseIds: [],

      status: "Unconfirmed",

      encounterType: "Second-hand",

      encounterSource:
        "Test witness account",

      isTest: true,
    },

    {
      id: "ENT-003",
      name: "Example Angelic Entity",
      classification: "Angel",

      nameType: "Pseudonym",
      nameMeaning: "",

      type: "Seraph / Seraphim",
      subtype: "",

      classFunction: "",
      subclass: "",

      eyeColor: "White",
      rank: "",

      aliases: [
        "Unknown Messenger",
      ],

      characteristics: [
        "Visual",
        "Protective",
      ],

      cases: 1,
      evidence: 2,

      caseIds: [],

      status: "Reference",

      encounterType: "Second-hand",

      encounterSource:
        "Test reference",

      isTest: true,
    },
  ];


  /*
   * =========================================================
   * LOAD DATABASE
   * =========================================================
   */

  useEffect(() => {
    loadEntities();
    loadCases();
  }, []);


  /*
   * =========================================================
   * LOAD ENTITIES
   * =========================================================
   */

  async function loadEntities() {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(
        collection(db, "entities")
      );

      const firestoreEntities =
        snapshot.docs.map((entityDoc) => {
          const data = entityDoc.data();

          const caseIds =
            Array.isArray(data.caseIds)
              ? data.caseIds
              : [];

          const evidenceIds =
            Array.isArray(data.evidenceIds)
              ? data.evidenceIds
              : [];

          return {
            firestoreId: entityDoc.id,

            id:
              data.entityId ||
              entityDoc.id,

            name:
              data.spiritName ||
              data.name ||
              "Unnamed Entity",

            nameType:
              data.nameType || "",

            nameMeaning:
              data.nameMeaning || "",

            type:
              data.type || "",

            subtype:
              data.subtype || "",

            classFunction:
              data.classFunction || "",

            subclass:
              data.subclass || "",

            eyeColor:
              data.eyeColor || "",

            rank:
              data.rank || "",

            encounterType:
              data.encounterType || "",

            encounterSource:
              data.encounterSource || "",

            caseIds,

            evidenceIds,

            aliases:
              Array.isArray(data.aliases)
                ? data.aliases
                : [],

            characteristics:
              Array.isArray(data.characteristics)
                ? data.characteristics
                : [],

            /*
             * Compatibility field.
             */

            classification:
              data.classification ||
              data.type ||
              "Unknown",

            cases:
              caseIds.length,

            evidence:
              evidenceIds.length,

            status:
              data.status ||
              "Unconfirmed",

            isTest: false,
          };
        });

      setEntities(firestoreEntities);

    } catch (err) {
      console.error(
        "Error loading entities:",
        err
      );

      setError(
        "Unable to load entity records."
      );

    } finally {
      setLoading(false);
    }
  }


  /*
   * =========================================================
   * LOAD CASES
   * =========================================================
   */

  async function loadCases() {
    try {
      const snapshot = await getDocs(
        collection(db, "cases")
      );

      const loadedCases =
        snapshot.docs.map((caseDoc) => ({
          firestoreId: caseDoc.id,
          ...caseDoc.data(),
        }));

      loadedCases.sort((a, b) =>
        String(
          a.caseNumber ||
          a.name ||
          ""
        ).localeCompare(
          String(
            b.caseNumber ||
            b.name ||
            ""
          ),
          undefined,
          {
            numeric: true,
          }
        )
      );

      setCases(loadedCases);

    } catch (err) {
      console.error(
        "Error loading cases:",
        err
      );
    }
  }


  /*
   * =========================================================
   * GENERATE ENTITY ID
   * =========================================================
   */

  function generateEntityId(
    existingEntities
  ) {
    let highestNumber = 0;

    existingEntities.forEach(
      (entity) => {
        const match =
          String(
            entity.id || ""
          ).match(
            /^ENT-(\d+)$/
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

    return `ENT-${String(
      highestNumber + 1
    ).padStart(3, "0")}`;
  }


  /*
   * =========================================================
   * UPDATE FORM FIELD
   * =========================================================
   */

  function updateNewEntity(
    field,
    value
  ) {
    setNewEntity(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }


  /*
   * =========================================================
   * OPEN ADD ENTITY
   * =========================================================
   */

  function openAddEntity() {
    setError("");
    setNewEntity(
      emptyEntity
    );
    setShowAddEntity(true);
  }


  /*
   * =========================================================
   * CLOSE ADD ENTITY
   * =========================================================
   */

  function closeAddEntity() {
    if (saving) {
      return;
    }

    setShowAddEntity(false);
    setError("");
  }


  /*
   * =========================================================
   * ADD ENTITY
   * =========================================================
   */

  async function handleAddEntity(
    event
  ) {
    event.preventDefault();

    setError("");

    /*
     * Required field.
     */

    if (
      !newEntity.spiritName.trim()
    ) {
      setError(
        "Spirit Name is required."
      );

      return;
    }

    try {
      setSaving(true);

      /*
       * Generate the next ENT number.
       */

      const entityId =
        generateEntityId([
          ...testEntities,
          ...entities,
        ]);

      /*
       * Case relationship.
       *
       * "None" is stored as an
       * empty caseIds array.
       */

      const caseIds =
        newEntity.caseId
          ? [newEntity.caseId]
          : [];


      /*
       * Build Firestore record.
       */

      const entityRecord = {
        entityId,

        spiritName:
          newEntity.spiritName.trim(),

        nameType:
          newEntity.nameType,

        nameMeaning:
          newEntity.nameMeaning.trim(),

        type:
          newEntity.type,

        subtype:
          newEntity.subtype,

        classFunction:
          newEntity.classFunction,

        subclass:
          newEntity.subclass,

        eyeColor:
          newEntity.eyeColor,

        rank:
          newEntity.rank,

        caseIds,

        encounterType:
          newEntity.encounterType,

        encounterSource:
          newEntity.encounterSource.trim(),

        /*
         * Future cross-reference fields.
         */

        evidenceIds: [],

        objectIds: [],

        incidentReportIds: [],

        /*
         * Existing profile fields.
         */

        aliases: [],

        characteristics: [],

        description: "",

        notes: "",

        status:
          "Unconfirmed",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };


      /*
       * Create Firestore record.
       */

      const entityRef =
        await addDoc(
          collection(
            db,
            "entities"
          ),
          entityRecord
        );


      /*
       * If a case was selected,
       * update the case so the
       * relationship works both ways.
       */

      if (
        newEntity.caseId
      ) {
        const selectedCase =
          cases.find(
            (caseItem) =>
              caseItem.firestoreId ===
              newEntity.caseId
          );

        if (selectedCase) {
          const existingEntityIds =
            Array.isArray(
              selectedCase.entityIds
            )
              ? selectedCase.entityIds
              : [];

          await updateDoc(
            doc(
              db,
              "cases",
              selectedCase.firestoreId
            ),
            {
              entityIds: [
                ...new Set([
                  ...existingEntityIds,
                  entityRef.id,
                ]),
              ],

              updatedAt:
                serverTimestamp(),
            }
          );
        }
      }


      /*
       * Reset and close.
       */

      setNewEntity(
        emptyEntity
      );

      setShowAddEntity(
        false
      );

      /*
       * Refresh data.
       */

      await Promise.all([
        loadEntities(),
        loadCases(),
      ]);

    } catch (err) {
      console.error(
        "Error creating entity:",
        err
      );

      setError(
        "Unable to create the entity record."
      );

    } finally {
      setSaving(false);
    }
  }


  /*
   * =========================================================
   * COMBINED ENTITY DATA
   * =========================================================
   */

  const allEntities = [
    ...testEntities,
    ...entities,
  ];


  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredEntities =
    allEntities.filter(
      (entity) => {
        const searchTerm =
          search
            .trim()
            .toLowerCase();

        const searchableText = [
          entity.name,
          entity.id,
          entity.nameType,
          entity.nameMeaning,
          entity.type,
          entity.subtype,
          entity.classFunction,
          entity.subclass,
          entity.eyeColor,
          entity.rank,
          entity.encounterType,
          entity.encounterSource,
          ...(entity.aliases || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          searchableText.includes(
            searchTerm
          );

        const matchesClassification =
          classificationFilter ===
            "All" ||
          entity.classification ===
            classificationFilter ||
          entity.type ===
            classificationFilter;

        return (
          matchesSearch &&
          matchesClassification
        );
      }
    );


  /*
   * =========================================================
   * STATISTICS
   * =========================================================
   */

  const totalEntities =
    allEntities.length;

  const demonCount =
    allEntities.filter(
      (entity) =>
        entity.classification ===
          "Demon" ||
        entity.type ===
          "Demon"
    ).length;

  const humanSpiritCount =
    allEntities.filter(
      (entity) =>
        entity.classification ===
        "Human Spirit"
    ).length;

  const angelCount =
    allEntities.filter(
      (entity) =>
        entity.classification ===
          "Angel" ||
        entity.type ===
          "Angel"
    ).length;


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="nh-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="nh-page-header">

        <div>

          <h1 className="nh-page-title">
            Spirit Database
          </h1>

          <p className="nh-page-subtitle">
            Entity records, classifications,
            characteristics, and investigative
            references.
          </p>

        </div>


        <button
          type="button"
          className="nh-button nh-button-primary"
          onClick={openAddEntity}
        >
          + Add Entity
        </button>

      </div>


      {/* =====================================================
          OVERVIEW
          ===================================================== */}

      <section className="nh-spirit-overview">

        <div className="nh-spirit-stat nh-card">

          <div className="nh-spirit-stat-label">
            Total Entities
          </div>

          <div className="nh-spirit-stat-value">
            {String(
              totalEntities
            ).padStart(
              2,
              "0"
            )}
          </div>

        </div>


        <div className="nh-spirit-stat nh-card">

          <div className="nh-spirit-stat-label">
            Demons
          </div>

          <div className="nh-spirit-stat-value">
            {String(
              demonCount
            ).padStart(
              2,
              "0"
            )}
          </div>

        </div>


        <div className="nh-spirit-stat nh-card">

          <div className="nh-spirit-stat-label">
            Human Spirits
          </div>

          <div className="nh-spirit-stat-value">
            {String(
              humanSpiritCount
            ).padStart(
              2,
              "0"
            )}
          </div>

        </div>


        <div className="nh-spirit-stat nh-card">

          <div className="nh-spirit-stat-label">
            Angelic Entities
          </div>

          <div className="nh-spirit-stat-value">
            {String(
              angelCount
            ).padStart(
              2,
              "0"
            )}
          </div>

        </div>

      </section>


      {/* =====================================================
          SEARCH / FILTER
          ===================================================== */}

      <section className="nh-spirit-controls nh-card">

        <div className="nh-search-wrapper">

          <input
            type="text"
            placeholder="Search entities, IDs, names, types..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="nh-search-input"
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

          <option value="Demon">
            Demon
          </option>

          <option value="Angel">
            Angel
          </option>

          <option value="Human Spirit">
            Human Spirit
          </option>

          <option value="Unknown">
            Unknown
          </option>

        </select>

      </section>


      {/* =====================================================
          ENTITY RECORDS
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Entity Records
            </h2>

            <p className="nh-section-subtitle">
              Known entities documented by
              New Horizon.
            </p>

          </div>


          <span className="nh-member-count">
            {filteredEntities.length} records
          </span>

        </div>


        {/* =================================================
            TABLE
            ================================================= */}

        <div className="nh-card nh-spirit-table">

          {/* =================================================
              TABLE HEADER
              ================================================= */}

          <div className="nh-spirit-row nh-spirit-header">

            <div>
              Entity
            </div>

            <div>
              Type
            </div>

            <div>
              Class / Function
            </div>

            <div>
              Cases
            </div>

            <div>
              Action
            </div>

          </div>


          {/* =================================================
              LOADING STATE
              ================================================= */}

          {loading ? (

            <div className="nh-spirit-empty">
              Loading entity records...
            </div>

          ) : (

            filteredEntities.map(
              (entity) => (

                <div
                  className="nh-spirit-row"
                  key={
                    entity.firestoreId ||
                    entity.id
                  }
                >

                  {/* =========================================
                      ENTITY
                      ========================================= */}

                  <div className="nh-spirit-identity">

                    <div className="nh-spirit-icon">
                      ◈
                    </div>

                    <div>

                      <div className="nh-list-title">
                        {entity.name}
                      </div>

                      <div className="nh-list-meta">
                        {entity.id}
                      </div>

                    </div>

                  </div>


                  {/* =========================================
                      TYPE
                      ========================================= */}

                  <div>

                    <span className="nh-spirit-classification">
                      {entity.type ||
                        entity.classification ||
                        "—"}
                    </span>

                  </div>


                  {/* =========================================
                      CLASS / FUNCTION
                      ========================================= */}

                  <div className="nh-spirit-cell">

                    {entity.classFunction ||
                      "—"}

                  </div>


                  {/* =========================================
                      CASES
                      ========================================= */}

                  <div className="nh-spirit-number">

                    {entity.cases || 0}

                  </div>


                  {/* =========================================
                      ACTION
                      ========================================= */}

                  <div className="nh-spirit-action">

                    <button
                      type="button"
                      className="nh-button nh-button-secondary nh-spirit-profile-button"
                      onClick={() =>
                        navigate(
                          `/spirits/${
                            entity.firestoreId ||
                            entity.id
                          }`
                        )
                      }
                    >
                      View Profile
                    </button>

                  </div>

                </div>

              )
            )

          )}


          {/* =================================================
              EMPTY STATE
              ================================================= */}

          {filteredEntities.length ===
            0 &&
            !loading && (

              <div className="nh-spirit-empty">
                No entities match the
                current search or
                classification.
              </div>

            )}

        </div>

      </section>


      {/* =====================================================
          ADD ENTITY MODAL
          ===================================================== */}

      {showAddEntity && (

        <div
          className="nh-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddEntity();
            }

          }}
        >

          <div
            className="nh-modal nh-entity-modal"
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
                  ENTITY REGISTRATION
                </div>

                <h2 className="nh-modal-title">
                  Add Entity
                </h2>

                <p className="nh-modal-subtitle">
                  Create a new entity record
                  in NHIS.
                </p>

              </div>


              <button
                type="button"
                className="nh-modal-close"
                onClick={closeAddEntity}
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* =================================================
                FORM
                ================================================= */}

            <form
              className="nh-entity-form"
              onSubmit={handleAddEntity}
            >

              {error && (

                <div className="nh-form-error">
                  {error}
                </div>

              )}


              {/* =================================================
                  NAME INFORMATION
                  ================================================= */}

              <div className="nh-entity-form-section">

                <div className="nh-entity-form-section-title">
                  Name Information
                </div>


                <div className="nh-entity-form-grid">

                  {/* SPIRIT NAME */}

                  <div className="nh-entity-form-field nh-entity-form-field-wide">

                    <label>
                      Spirit Name *
                    </label>

                    <input
                      type="text"
                      value={
                        newEntity.spiritName
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "spiritName",
                          event.target.value
                        )
                      }
                      placeholder="Enter spirit name..."
                      required
                    />

                  </div>


                  {/* NAME TYPE */}

                  <div className="nh-entity-form-field">

                    <label>
                      Name Type
                    </label>

                    <select
                      value={
                        newEntity.nameType
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "nameType",
                          event.target.value
                        )
                      }
                    >

                      {nameTypes.map(
                        (nameType) => (

                          <option
                            key={nameType}
                            value={nameType}
                          >
                            {nameType}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* NAME MEANING */}

                  <div className="nh-entity-form-field">

                    <label>
                      Name Meaning
                    </label>

                    <input
                      type="text"
                      value={
                        newEntity.nameMeaning
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "nameMeaning",
                          event.target.value
                        )
                      }
                      placeholder="Meaning or translation..."
                    />

                  </div>

                </div>

              </div>


              {/* =================================================
                  CLASSIFICATION
                  ================================================= */}

              <div className="nh-entity-form-section">

                <div className="nh-entity-form-section-title">
                  Classification
                </div>


                <div className="nh-entity-form-grid">

                  {/* TYPE */}

                  <div className="nh-entity-form-field">

                    <label>
                      Type
                    </label>

                    <select
                      value={
                        newEntity.type
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "type",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Select Type
                      </option>

                      {entityTypes.map(
                        (type) => (

                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* SUBTYPE */}

                  <div className="nh-entity-form-field">

                    <label>
                      Subtype
                    </label>

                    <select
                      value={
                        newEntity.subtype
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "subtype",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Select Subtype
                      </option>

                      {entitySubtypes.map(
                        (subtype) => (

                          <option
                            key={subtype}
                            value={subtype}
                          >
                            {subtype}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* CLASS / FUNCTION */}

                  <div className="nh-entity-form-field">

                    <label>
                      Class / Function
                    </label>

                    <select
                      value={
                        newEntity.classFunction
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "classFunction",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Select Class / Function
                      </option>

                      {entityClasses.map(
                        (item) => (

                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* SUBCLASS */}

                  <div className="nh-entity-form-field">

                    <label>
                      Subclass
                    </label>

                    <select
                      value={
                        newEntity.subclass
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "subclass",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Select Subclass
                      </option>

                      {entitySubclasses.map(
                        (item) => (

                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* EYE COLOR */}

                  <div className="nh-entity-form-field">

                    <label>
                      Eye Color
                    </label>

                    <select
                      value={
                        newEntity.eyeColor
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "eyeColor",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Select Eye Color
                      </option>

                      {eyeColors.map(
                        (color) => (

                          <option
                            key={color}
                            value={color}
                          >
                            {color}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* RANK */}

                  <div className="nh-entity-form-field">

                    <label>
                      Rank
                    </label>

                    <select
                      value={
                        newEntity.rank
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "rank",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Select Rank
                      </option>

                      {entityRanks.map(
                        (rank) => (

                          <option
                            key={rank}
                            value={rank}
                          >
                            {rank}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>

              </div>


              {/* =================================================
                  INVESTIGATIVE REFERENCE
                  ================================================= */}

              <div className="nh-entity-form-section">

                <div className="nh-entity-form-section-title">
                  Investigative Reference
                </div>


                <div className="nh-entity-form-grid">

                  {/* CASE */}

                  <div className="nh-entity-form-field">

                    <label>
                      Case Involved With
                    </label>

                    <select
                      value={
                        newEntity.caseId
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "caseId",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        None
                      </option>

                      {cases.map(
                        (caseItem) => (

                          <option
                            key={
                              caseItem.firestoreId
                            }
                            value={
                              caseItem.firestoreId
                            }
                          >
                            {caseItem.caseNumber
                              ? `${caseItem.caseNumber} — ${
                                  caseItem.name ||
                                  "Unnamed Case"
                                }`
                              : caseItem.name ||
                                caseItem.firestoreId}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* ENCOUNTER */}

                  <div className="nh-entity-form-field">

                    <label>
                      Encounter
                    </label>

                    <select
                      value={
                        newEntity.encounterType
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "encounterType",
                          event.target.value
                        )
                      }
                    >

                      {encounterTypes.map(
                        (encounterType) => (

                          <option
                            key={
                              encounterType
                            }
                            value={
                              encounterType
                            }
                          >
                            {encounterType}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* SOURCE */}

                  <div className="nh-entity-form-field nh-entity-form-field-wide">

                    <label>
                      Source of Encounter
                    </label>

                    <textarea
                      value={
                        newEntity.encounterSource
                      }
                      onChange={(event) =>
                        updateNewEntity(
                          "encounterSource",
                          event.target.value
                        )
                      }
                      placeholder="Describe where or how the encounter was documented..."
                      rows={4}
                    />

                  </div>

                </div>

              </div>


              {/* =================================================
                  ACTIONS
                  ================================================= */}

              <div className="nh-modal-actions">

                <button
                  type="button"
                  className="nh-button nh-button-secondary"
                  onClick={closeAddEntity}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="nh-button nh-button-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Creating..."
                    : "Create Entity"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default SpiritDatabase;