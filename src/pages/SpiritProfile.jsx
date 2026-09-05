import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase/config";


/*
 * =========================================================
 * TEST ENTITY DATA
 * =========================================================
 *
 * These correspond to the test entries currently displayed
 * in the Spirit Database.
 *
 * They remain available until replaced by real records.
 * =========================================================
 */

const testEntities = [
  {
    id: "ENT-001",
    name: "Example Entity",

    nameType: "Pseudonym",
    nameMeaning: "Example meaning",

    type: "Humanoid / Humanoids",
    subtype: "Daeva",
    classFunction: "Oppressor / Oppressors",
    subclass: "Warden / Wardens",

    eyeColor: "Red",
    rank: "Regionem",

    caseIds: [],
    evidenceIds: [],

    encounterType: "First-hand",

    encounterSource:
      "Test investigation record",

    status: "Active",

    aliases: [
      "Example Name",
      "Alternate Name",
    ],

    characteristics: [
      "Intelligent",
      "Aggressive",
      "Auditory",
    ],

    description:
      "Test entity record used for development of the New Horizon Spirit Database.",

    notes:
      "This is a test record and should not be treated as an actual investigation record.",
  },

  {
    id: "ENT-002",
    name: "Unknown Male Entity",

    nameType: "Pseudonym",
    nameMeaning: "",

    type: "",
    subtype: "",
    classFunction: "",
    subclass: "",

    eyeColor: "",
    rank: "",

    caseIds: [],
    evidenceIds: [],

    encounterType: "Second-hand",

    encounterSource:
      "Test witness account",

    status: "Unconfirmed",

    aliases: [
      "The Man",
    ],

    characteristics: [
      "Intelligent",
      "Vocal",
      "Apparition",
    ],

    description:
      "Test human-spirit record.",

    notes:
      "Development test record.",
  },

  {
    id: "ENT-003",
    name: "Example Angelic Entity",

    nameType: "Pseudonym",
    nameMeaning: "",

    type: "Seraph / Seraphim",
    subtype: "",
    classFunction: "",
    subclass: "",

    eyeColor: "White",
    rank: "",

    caseIds: [],
    evidenceIds: [],

    encounterType: "Second-hand",

    encounterSource:
      "Test reference",

    status: "Reference",

    aliases: [
      "Unknown Messenger",
    ],

    characteristics: [
      "Visual",
      "Protective",
    ],

    description:
      "Test angelic entity record.",

    notes:
      "Development test record.",
  },
];


/*
 * =========================================================
 * HELPER
 * =========================================================
 */

function displayValue(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "N/A";
  }

  return value;
}


/*
 * =========================================================
 * SPIRIT PROFILE
 * =========================================================
 */

function SpiritProfile() {
  const navigate = useNavigate();
  const { spiritId } = useParams();

  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /*
   * =========================================================
   * LOAD ENTITY
   * =========================================================
   */

  useEffect(() => {
    loadEntity();
  }, [spiritId]);


  async function loadEntity() {
    try {
      setLoading(true);
      setError("");

      /*
       * First check the test records.
       */

      const testEntity =
        testEntities.find(
          (item) =>
            item.id === spiritId
        );

      if (testEntity) {
        setEntity(testEntity);
        setLoading(false);
        return;
      }


      /*
       * Load real Firestore entities.
       *
       * We search by entityId because the
       * visible ID is ENT-0001 etc., while
       * Firestore's document ID is different.
       */

      const snapshot =
        await getDocs(
          collection(
            db,
            "entities"
          )
        );


      let foundEntity = null;

      snapshot.forEach(
        (entityDoc) => {
          const data =
            entityDoc.data();

          if (
            entityDoc.id === spiritId ||
            data.entityId === spiritId
          ) {
            foundEntity = {
              firestoreId:
                entityDoc.id,

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

              caseIds:
                Array.isArray(
                  data.caseIds
                )
                  ? data.caseIds
                  : [],

              evidenceIds:
                Array.isArray(
                  data.evidenceIds
                )
                  ? data.evidenceIds
                  : [],

              encounterType:
                data.encounterType ||
                "",

              encounterSource:
                data.encounterSource ||
                "",

              status:
                data.status ||
                "Unconfirmed",

              aliases:
                Array.isArray(
                  data.aliases
                )
                  ? data.aliases
                  : [],

              characteristics:
                Array.isArray(
                  data.characteristics
                )
                  ? data.characteristics
                  : [],

              description:
                data.description ||
                "",

              notes:
                data.notes ||
                "",
            };
          }
        }
      );


      if (!foundEntity) {
        setError(
          "Entity record could not be found."
        );

        setEntity(null);
        return;
      }


      setEntity(
        foundEntity
      );

    } catch (err) {
      console.error(
        "Error loading entity profile:",
        err
      );

      setError(
        "Unable to load the entity profile."
      );

    } finally {
      setLoading(false);
    }
  }


  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="nh-page">

        <div className="nh-profile-loading">
          Loading entity profile...
        </div>

      </div>
    );
  }


  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (!entity) {
    return (
      <div className="nh-page">

        <div className="nh-page-header">

          <div>

            <div className="nh-command-label">
              ENTITY DATABASE
            </div>

            <h1 className="nh-page-title">
              Entity Not Found
            </h1>

            <p className="nh-page-subtitle">
              {error ||
                "The requested entity record does not exist."}
            </p>

          </div>

          <button
            type="button"
            className="nh-button nh-button-secondary"
            onClick={() =>
              navigate("/spirits")
            }
          >
            ← Back to Database
          </button>

        </div>

      </div>
    );
  }


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="nh-page nh-spirit-profile-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="nh-page-header">

        <div>

          <div className="nh-command-label">
            ENTITY PROFILE
          </div>

          <h1 className="nh-page-title">
            {entity.name}
          </h1>

          <p className="nh-page-subtitle">
            {entity.id}
          </p>

        </div>


        <div className="nh-profile-header-actions">

          <button
            type="button"
            className="nh-button nh-button-secondary"
            onClick={() =>
              navigate("/spirits")
            }
          >
            ← Back to Database
          </button>

        </div>

      </div>


      {/* =====================================================
          IDENTITY BANNER
          ===================================================== */}

      <section className="nh-spirit-profile-banner nh-card">

        <div className="nh-spirit-profile-symbol">
          ◈
        </div>


        <div className="nh-spirit-profile-banner-info">

          <div className="nh-spirit-profile-name">
            {entity.name}
          </div>

          <div className="nh-spirit-profile-id">
            {entity.id}
          </div>

        </div>


        <div className="nh-spirit-profile-status">

          <span className="nh-status nh-status-active">
            {displayValue(
              entity.status
            )}
          </span>

        </div>

      </section>


      {/* =====================================================
          NAME INFORMATION
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Name Information
            </h2>

            <p className="nh-section-subtitle">
              Recorded names and naming information.
            </p>

          </div>

        </div>


        <div className="nh-spirit-profile-grid nh-card">

          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Spirit Name
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.name
              )}
            </div>

          </div>


          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Name Type
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.nameType
              )}
            </div>

          </div>


          <div className="nh-profile-field nh-profile-field-wide">

            <div className="nh-profile-field-label">
              Name Meaning
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.nameMeaning
              )}
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CLASSIFICATION
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Classification
            </h2>

            <p className="nh-section-subtitle">
              Entity classification within the New Horizon
              reference system.
            </p>

          </div>

        </div>


        <div className="nh-spirit-profile-grid nh-card">

          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Type
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.type
              )}
            </div>

          </div>


          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Subtype
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.subtype
              )}
            </div>

          </div>


          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Class / Function
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.classFunction
              )}
            </div>

          </div>


          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Subclass
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.subclass
              )}
            </div>

          </div>


          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Rank
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.rank
              )}
            </div>

          </div>


          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Eye Color
            </div>

            <div className="nh-profile-field-value">

              {entity.eyeColor ? (

                <span className="nh-eye-color-value">

                  <span
                    className={`nh-eye-color-dot nh-eye-${entity.eyeColor.toLowerCase()}`}
                  />

                  {entity.eyeColor}

                </span>

              ) : (
                "N/A"
              )}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          ENCOUNTER INFORMATION
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Encounter Information
            </h2>

            <p className="nh-section-subtitle">
              Investigative origin and encounter
              documentation.
            </p>

          </div>

        </div>


        <div className="nh-spirit-profile-grid nh-card">

          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Encounter Type
            </div>

            <div className="nh-profile-field-value">
              {displayValue(
                entity.encounterType
              )}
            </div>

          </div>


          <div className="nh-profile-field">

            <div className="nh-profile-field-label">
              Cases Involved
            </div>

            <div className="nh-profile-field-value">
              {entity.caseIds?.length || 0}
            </div>

          </div>


          <div className="nh-profile-field nh-profile-field-wide">

            <div className="nh-profile-field-label">
              Source of Encounter
            </div>

            <div className="nh-profile-field-value nh-profile-long-text">
              {displayValue(
                entity.encounterSource
              )}
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          KNOWN NAMES
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Known Names
            </h2>

            <p className="nh-section-subtitle">
              Other names associated with this entity.
            </p>

          </div>

        </div>


        <div className="nh-card nh-profile-list-card">

          {entity.aliases &&
          entity.aliases.length > 0 ? (

            <div className="nh-profile-tag-list">

              {entity.aliases.map(
                (alias, index) => (

                  <span
                    key={index}
                    className="nh-profile-tag"
                  >
                    {alias}
                  </span>

                )
              )}

            </div>

          ) : (

            <div className="nh-profile-empty">
              No additional names recorded.
            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          CHARACTERISTICS
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Characteristics
            </h2>

            <p className="nh-section-subtitle">
              Observed or documented characteristics.
            </p>

          </div>

        </div>


        <div className="nh-card nh-profile-list-card">

          {entity.characteristics &&
          entity.characteristics.length > 0 ? (

            <div className="nh-profile-tag-list">

              {entity.characteristics.map(
                (characteristic, index) => (

                  <span
                    key={index}
                    className="nh-profile-tag"
                  >
                    {characteristic}
                  </span>

                )
              )}

            </div>

          ) : (

            <div className="nh-profile-empty">
              No characteristics recorded.
            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          CASES / EVIDENCE
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Investigative References
            </h2>

            <p className="nh-section-subtitle">
              Records associated with this entity.
            </p>

          </div>

        </div>


        <div className="nh-spirit-profile-reference-grid">

          <div className="nh-card nh-profile-reference-card">

            <div className="nh-profile-reference-label">
              CASES
            </div>

            <div className="nh-profile-reference-number">
              {entity.caseIds?.length || 0}
            </div>

            <div className="nh-profile-reference-description">
              Investigation cases involving this entity.
            </div>

          </div>


          <div className="nh-card nh-profile-reference-card">

            <div className="nh-profile-reference-label">
              EVIDENCE
            </div>

            <div className="nh-profile-reference-number">
              {entity.evidenceIds?.length || 0}
            </div>

            <div className="nh-profile-reference-description">
              Evidence records associated with this entity.
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          DESCRIPTION
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Description
            </h2>

          </div>

        </div>


        <div className="nh-card nh-profile-text-card">

          <div className="nh-profile-long-text">

            {displayValue(
              entity.description
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          NOTES
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              Notes
            </h2>

          </div>

        </div>


        <div className="nh-card nh-profile-text-card">

          <div className="nh-profile-long-text">

            {displayValue(
              entity.notes
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          SYSTEM INFORMATION
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div>

            <h2 className="nh-section-title">
              System Information
            </h2>

          </div>

        </div>


        <div className="nh-card nh-spirit-profile-system">

          <div>

            <span>
              Entity ID
            </span>

            <strong>
              {entity.id}
            </strong>

          </div>


          <div>

            <span>
              Record Type
            </span>

            <strong>
              {entity.firestoreId
                ? "Firestore Record"
                : "Development Test Record"}
            </strong>

          </div>

        </div>

      </section>


    </div>
  );
}

export default SpiritProfile;