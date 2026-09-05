import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/config";


/*
 * =========================================================
 * NHIS FORM REGISTRY
 * =========================================================
 *
 * These are the authorized New Horizon forms currently
 * registered in the Information System.
 *
 * IMPORTANT:
 * This registry stores the form itself.
 * The actual questions will be added to the individual
 * form pages later.
 *
 * Do NOT invent or replace the questions here.
 * Existing finalized New Horizon forms will be used when
 * we build the actual digital forms.
 * =========================================================
 */

const INITIAL_FORMS = [
  {
    formId: "FRM-001",
    name: "Pre-Investigation Form",
    category: "Investigation",
    description:
      "Pre-investigation documentation and planning record.",
    status: "Active",
  },

  {
    formId: "FRM-002",
    name: "Investigation Report",
    category: "Investigation",
    description:
      "Official documentation of an investigation.",
    status: "Active",
  },

  {
    formId: "FRM-003",
    name: "Post-Investigation Report",
    category: "Investigation",
    description:
      "Post-investigation documentation and findings.",
    status: "Active",
  },

  {
    formId: "FRM-004",
    name: "Final Assessment",
    category: "Investigation",
    description:
      "Final assessment used when determining the disposition of a case.",
    status: "Active",
  },

  {
    formId: "FRM-005",
    name: "Property Access",
    category: "Investigation",
    description:
      "Authorization and documentation for access to an investigation property.",
    status: "Active",
  },

  {
    formId: "FRM-006",
    name: "Liability Waiver",
    category: "Personnel",
    description:
      "Personnel liability and participation documentation.",
    status: "Active",
  },

  {
    formId: "FRM-007",
    name: "Team Evaluation",
    category: "Personnel",
    description:
      "Evaluation of team performance and conduct.",
    status: "Active",
  },

  {
    formId: "FRM-008",
    name: "Cult Registration",
    category: "Cult Registry",
    description:
      "Registration record for an organization documented by New Horizon.",
    status: "Active",
  },

  {
    formId: "FRM-009",
    name: "Incident Report",
    category: "Incident",
    description:
      "Documentation of a significant incident requiring formal reporting.",
    status: "Active",
  },
];


/*
 * =========================================================
 * STATUS HELPERS
 * =========================================================
 */

function submissionClass(status) {
  return `nh-form-submission-status nh-form-submission-${String(
    status || "Unknown"
  )
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}


function categoryClass(category) {
  return `nh-form-category nh-form-category-${String(
    category || "Unknown"
  )
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}


/*
 * =========================================================
 * FORM REGISTRY PAGE
 * =========================================================
 */

function Forms() {
  /*
   * ---------------------------------------------------------
   * PAGE STATE
   * ---------------------------------------------------------
   */

  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [error, setError] = useState("");

  const [showNewForm, setShowNewForm] =
    useState(false);

  const [newForm, setNewForm] = useState({
    name: "",
    category: "Investigation",
    description: "",
  });


  /*
   * ---------------------------------------------------------
   * LOAD REGISTRY
   * ---------------------------------------------------------
   */

  useEffect(() => {
    loadRegistry();
  }, []);


  /*
   * ---------------------------------------------------------
   * LOAD FORMS + SUBMISSIONS
   * ---------------------------------------------------------
   */

  async function loadRegistry() {
    try {
      setLoading(true);
      setError("");

      /*
       * Load registered forms.
       */

      const formsSnapshot =
        await getDocs(
          collection(db, "forms")
        );

      const loadedForms =
        formsSnapshot.docs.map(
          (formDoc) => ({
            firestoreId: formDoc.id,
            ...formDoc.data(),
          })
        );


      /*
       * If this is the first time the Forms
       * Registry has been opened, make sure
       * all nine authorized forms exist.
       */

      const existingFormIds =
        new Set(
          loadedForms.map(
            (form) =>
              form.formId
          )
        );


      const missingForms =
        INITIAL_FORMS.filter(
          (form) =>
            !existingFormIds.has(
              form.formId
            )
        );


      /*
       * Add missing registry records.
       *
       * This means an existing database will
       * not be duplicated.
       */

      if (
        missingForms.length > 0
      ) {
        setSeeding(true);

        for (
          const form of missingForms
        ) {
          await addDoc(
            collection(
              db,
              "forms"
            ),
            {
              ...form,

              /*
               * These fields are intentionally
               * prepared for the form system.
               */

              version: "1.0",

              questionCount: 0,

              submissionCount: 0,

              source:
                "New Horizon authorized form",

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );
        }

        setSeeding(false);

        /*
         * Reload after creating missing
         * registry records.
         */

        return loadRegistry();
      }


      /*
       * Sort by form number.
       */

      loadedForms.sort(
        (a, b) =>
          String(
            a.formId || ""
          ).localeCompare(
            String(
              b.formId || ""
            ),
            undefined,
            {
              numeric: true,
            }
          )
      );


      setForms(
        loadedForms
      );


      /*
       * Load submissions.
       *
       * This collection may not exist yet.
       * Firestore simply returns an empty
       * collection when there are no records.
       */

      const submissionsSnapshot =
        await getDocs(
          collection(
            db,
            "formSubmissions"
          )
        );


      const loadedSubmissions =
        submissionsSnapshot.docs.map(
          (submissionDoc) => ({
            firestoreId:
              submissionDoc.id,

            ...submissionDoc.data(),
          })
        );


      /*
       * Sort newest first.
       */

      loadedSubmissions.sort(
        (a, b) => {

          const aTime =
            a.submittedAt?.seconds ||
            0;

          const bTime =
            b.submittedAt?.seconds ||
            0;

          return bTime - aTime;
        }
      );


      setSubmissions(
        loadedSubmissions
      );

    } catch (err) {
      console.error(
        "Error loading Forms Registry:",
        err
      );

      setError(
        "Unable to load the Forms Registry. Check Firestore permissions."
      );

    } finally {
      setLoading(false);
      setSeeding(false);
    }
  }


  /*
   * ---------------------------------------------------------
   * CATEGORIES
   * ---------------------------------------------------------
   */

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        forms.map(
          (form) =>
            form.category
        )
      ),
    ],
    [forms]
  );


  /*
   * ---------------------------------------------------------
   * FILTERED FORMS
   * ---------------------------------------------------------
   */

  const filteredForms = useMemo(
    () => {

      const search =
        searchTerm
          .toLowerCase()
          .trim();

      return forms.filter(
        (form) => {

          const matchesSearch =
            !search ||
            String(
              form.name || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              form.formId || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              form.category || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              form.description || ""
            )
              .toLowerCase()
              .includes(search);


          const matchesCategory =
            categoryFilter ===
              "All" ||
            form.category ===
              categoryFilter;


          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );

    },
    [
      forms,
      searchTerm,
      categoryFilter,
    ]
  );


  /*
   * ---------------------------------------------------------
   * SUBMISSION COUNTS
   * ---------------------------------------------------------
   *
   * Counts are calculated from actual
   * formSubmissions records.
   * ---------------------------------------------------------
   */

  const submissionCounts =
    useMemo(() => {

      const counts = {};

      submissions.forEach(
        (submission) => {

          const formId =
            submission.formId;

          if (!formId) {
            return;
          }

          counts[formId] =
            (counts[formId] || 0) +
            1;
        }
      );

      return counts;

    }, [submissions]);


  /*
   * ---------------------------------------------------------
   * STATISTICS
   * ---------------------------------------------------------
   */

  const totalForms =
    forms.length;


  const investigationForms =
    forms.filter(
      (form) =>
        form.category ===
        "Investigation"
    ).length;


  const personnelForms =
    forms.filter(
      (form) =>
        form.category ===
        "Personnel"
    ).length;


  const pendingSubmissions =
    submissions.filter(
      (submission) =>
        submission.status ===
          "Under Review" ||
        submission.status ===
          "Pending" ||
        submission.status ===
          "Submitted"
    ).length;


  /*
   * ---------------------------------------------------------
   * FORMAT DATE
   * ---------------------------------------------------------
   */

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    /*
     * Firestore Timestamp.
     */

    if (
      typeof value.toDate ===
      "function"
    ) {
      return value
        .toDate()
        .toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        );
    }


    /*
     * JavaScript Date.
     */

    if (
      value instanceof Date
    ) {
      return value.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    }


    /*
     * String date.
     */

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }


  /*
   * ---------------------------------------------------------
   * NEW FORM
   * ---------------------------------------------------------
   *
   * This registers a new form record.
   *
   * It does NOT create questions.
   * The actual finalized form will be connected
   * later.
   * ---------------------------------------------------------
   */

  function openNewForm() {
    setError("");

    setNewForm({
      name: "",
      category: "Investigation",
      description: "",
    });

    setShowNewForm(true);
  }


  function closeNewForm() {
    setShowNewForm(false);
    setError("");
  }


  function updateNewForm(
    field,
    value
  ) {
    setNewForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  }


  async function handleCreateForm(
    event
  ) {
    event.preventDefault();

    setError("");

    if (
      !newForm.name.trim()
    ) {
      setError(
        "Form name is required."
      );

      return;
    }


    try {
      /*
       * Generate next FRM number.
       */

      let highestNumber = 0;

      forms.forEach(
        (form) => {

          const match =
            String(
              form.formId || ""
            ).match(
              /^FRM-(\d+)$/
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


      const nextFormId =
        `FRM-${String(
          highestNumber + 1
        ).padStart(3, "0")}`;


      /*
       * Create the actual registry
       * record.
       */

      await addDoc(
        collection(
          db,
          "forms"
        ),
        {
          formId:
            nextFormId,

          name:
            newForm.name.trim(),

          category:
            newForm.category,

          description:
            newForm.description.trim(),

          status:
            "Active",

          version:
            "1.0",

          questionCount:
            0,

          submissionCount:
            0,

          source:
            "New Horizon authorized form",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );


      closeNewForm();

      await loadRegistry();

    } catch (err) {
      console.error(
        "Error creating form:",
        err
      );

      setError(
        "Unable to create the form record."
      );
    }
  }


  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="nh-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="nh-page-header nh-forms-header">

        <div>

          <div className="nh-eyebrow">
            DOCUMENT MANAGEMENT
          </div>

          <h1>
            Forms
          </h1>

          <p>
            Investigation, personnel,
            registration, incident,
            and digital form submissions.
          </p>

        </div>


        <button
          className="nh-primary-button"
          type="button"
          onClick={openNewForm}
        >
          + New Form
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
          INITIALIZATION MESSAGE
          ===================================================== */}

      {seeding && (

        <div className="nh-card nh-forms-loading">

          <strong>
            Initializing Forms Registry...
          </strong>

          <span>
            Registering authorized New Horizon
            forms in NHIS.
          </span>

        </div>

      )}


      {/* =====================================================
          STATISTICS
          ===================================================== */}

      <div className="nh-forms-stats">

        <div className="nh-forms-stat">

          <span className="nh-forms-stat-label">
            TOTAL FORMS
          </span>

          <strong>
            {totalForms}
          </strong>

          <span className="nh-forms-stat-detail">
            Registered system forms
          </span>

        </div>


        <div className="nh-forms-stat">

          <span className="nh-forms-stat-label">
            INVESTIGATION
          </span>

          <strong>
            {investigationForms}
          </strong>

          <span className="nh-forms-stat-detail">
            Investigation-related forms
          </span>

        </div>


        <div className="nh-forms-stat">

          <span className="nh-forms-stat-label">
            PERSONNEL
          </span>

          <strong>
            {personnelForms}
          </strong>

          <span className="nh-forms-stat-detail">
            Personnel documentation
          </span>

        </div>


        <div className="nh-forms-stat">

          <span className="nh-forms-stat-label">
            PENDING
          </span>

          <strong>
            {pendingSubmissions}
          </strong>

          <span className="nh-forms-stat-detail">
            Submissions requiring review
          </span>

        </div>

      </div>


      {/* =====================================================
          FORM REGISTRY
          ===================================================== */}

      <section className="nh-section nh-forms-section">

        <div className="nh-section-header">

          <div>

            <h2>
              Form Registry
            </h2>

            <p>
              Authorized forms available
              for digital submission
              through NHIS.
            </p>

          </div>

        </div>


        {/* =================================================
            SEARCH / FILTER
            ================================================= */}

        <div className="nh-forms-controls">

          <div className="nh-search-box nh-forms-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>


          <select
            className="nh-filter-select"
            value={
              categoryFilter
            }
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
          >

            {categories.map(
              (category) => (

                <option
                  key={category}
                  value={category}
                >
                  {
                    category ===
                    "All"
                      ? "All Categories"
                      : category
                  }
                </option>

              )
            )}

          </select>

        </div>


        {/* =================================================
            TABLE
            ================================================= */}

        <div className="nh-forms-table-wrap">

          <div className="nh-forms-table">

            <div className="nh-forms-row nh-forms-row-header">

              <div>
                Form
              </div>

              <div>
                Category
              </div>

              <div>
                Submissions
              </div>

              <div>
                Status
              </div>

              <div>
              </div>

            </div>


            {/* =================================================
                LOADING
                ================================================= */}

            {loading && (

              <div className="nh-forms-empty">

                <div className="nh-forms-empty-icon">
                  ▤
                </div>

                <strong>
                  Loading Forms Registry
                </strong>

                <span>
                  Loading registered forms
                  from NHIS.
                </span>

              </div>

            )}


            {/* =================================================
                FORM RECORDS
                ================================================= */}

            {!loading &&
              filteredForms.map(
                (form) => (

                  <div
                    className="nh-forms-row"
                    key={
                      form.firestoreId ||
                      form.formId
                    }
                  >

                    {/* =========================================
                        FORM
                        ========================================= */}

                    <div className="nh-form-identity">

                      <div className="nh-form-icon">
                        ▤
                      </div>


                      <div>

                        <strong>
                          {form.name}
                        </strong>

                        <span>
                          {form.formId}
                          {" · "}
                          {
                            form.description ||
                            "No description available."
                          }
                        </span>

                      </div>

                    </div>


                    {/* =========================================
                        CATEGORY
                        ========================================= */}

                    <div>

                      <span
                        className={categoryClass(
                          form.category
                        )}
                      >
                        {form.category}
                      </span>

                    </div>


                    {/* =========================================
                        SUBMISSIONS
                        ========================================= */}

                    <div className="nh-form-submission-count">

                      <strong>
                        {
                          submissionCounts[
                            form.formId
                          ] || 0
                        }
                      </strong>

                      <span>
                        submitted
                      </span>

                    </div>


                    {/* =========================================
                        STATUS
                        ========================================= */}

                    <div>

                      <span className="nh-form-active-status">
                        {form.status ||
                          "Active"}
                      </span>

                    </div>


                    {/* =========================================
                        ACTION
                        ========================================= */}

                    <div>

                      <button
                        className="nh-form-view-button"
                        type="button"
                        onClick={() => {

                          /*
                           * The form viewer will be
                           * connected here in the next
                           * phase.
                           */

                          console.log(
                            "Open form:",
                            form.formId
                          );

                        }}
                      >
                        Open
                      </button>

                    </div>

                  </div>

                )
              )}


            {/* =================================================
                EMPTY
                ================================================= */}

            {!loading &&
              filteredForms.length ===
                0 && (

                <div className="nh-forms-empty">

                  <div className="nh-forms-empty-icon">
                    ▤
                  </div>

                  <strong>
                    No forms found
                  </strong>

                  <span>
                    Try changing your
                    search or category
                    filter.
                  </span>

                </div>

              )}

          </div>

        </div>

      </section>


      {/* =====================================================
          RECENT SUBMISSIONS
          ===================================================== */}

      <section className="nh-section nh-form-submissions">

        <div className="nh-section-header">

          <div>

            <h2>
              Recent Submissions
            </h2>

            <p>
              Digital forms submitted
              through the information system.
            </p>

          </div>


          <button
            type="button"
            className="nh-secondary-button"
            onClick={() => {

              /*
               * Full submission registry
               * will be built after the form
               * viewer.
               */

              console.log(
                "View all submissions"
              );

            }}
          >
            View All
          </button>

        </div>


        <div className="nh-submissions-table">

          <div className="nh-submission-row nh-submission-row-header">

            <div>
              Submission
            </div>

            <div>
              Submitted By
            </div>

            <div>
              Reference
            </div>

            <div>
              Date
            </div>

            <div>
              Status
            </div>

          </div>


          {/* =================================================
              SUBMISSION RECORDS
              ================================================= */}

          {submissions
            .slice(0, 5)
            .map(
              (submission) => (

                <div
                  className="nh-submission-row"
                  key={
                    submission.firestoreId ||
                    submission.submissionId
                  }
                >

                  <div className="nh-submission-identity">

                    <div className="nh-submission-icon">
                      □
                    </div>


                    <div>

                      <strong>
                        {
                          submission.formName ||
                          submission.form ||
                          submission.formId ||
                          "Form Submission"
                        }
                      </strong>

                      <span>
                        {
                          submission.submissionId ||
                          submission.firestoreId
                        }
                      </span>

                    </div>

                  </div>


                  <div className="nh-submission-member">

                    {
                      submission.submittedBy ||
                      "—"
                    }

                  </div>


                  <div className="nh-submission-reference">

                    {
                      submission.reference ||
                      submission.caseId ||
                      submission.memberId ||
                      "—"
                    }

                  </div>


                  <div className="nh-submission-date">

                    {formatDate(
                      submission.submittedAt
                    )}

                  </div>


                  <div>

                    <span
                      className={submissionClass(
                        submission.status ||
                          "Submitted"
                      )}
                    >
                      {
                        submission.status ||
                        "Submitted"
                      }
                    </span>

                  </div>

                </div>

              )
            )}


          {/* =================================================
              NO SUBMISSIONS
              ================================================= */}

          {submissions.length ===
            0 && (

            <div className="nh-forms-empty">

              <div className="nh-forms-empty-icon">
                □
              </div>

              <strong>
                No submissions yet
              </strong>

              <span>
                Completed digital forms
                will appear here.
              </span>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          FORM ACTION CARDS
          ===================================================== */}

      <section className="nh-section nh-form-overview">

        <div className="nh-form-overview-card">

          <div className="nh-form-overview-icon">
            +
          </div>


          <div>

            <span className="nh-eyebrow">
              DIGITAL SUBMISSION
            </span>

            <h3>
              Submit a Form
            </h3>

            <p>
              Select an authorized form
              and complete its existing
              questions through the NHIS
              digital submission workflow.
            </p>

          </div>


          <button
            type="button"
            className="nh-secondary-button"
            onClick={() => {

              /*
               * The form selector will be
               * connected here once the
               * individual form viewer exists.
               */

              document
                .querySelector(
                  ".nh-forms-search input"
                )
                ?.focus();

            }}
          >
            Start Submission
          </button>

        </div>


        <div className="nh-form-overview-card">

          <div className="nh-form-overview-icon">
            ✓
          </div>


          <div>

            <span className="nh-eyebrow">
              REVIEW
            </span>

            <h3>
              Submission Review
            </h3>

            <p>
              Review submitted documentation,
              track approval status, and
              connect completed forms to
              the appropriate NHIS records.
            </p>

          </div>


          <button
            type="button"
            className="nh-secondary-button"
            onClick={() => {

              /*
               * Full submission review
               * will be built after the
               * submission workflow.
               */

              window.scrollTo({
                top:
                  document
                    .querySelector(
                      ".nh-form-submissions"
                    )
                    ?.offsetTop ||
                  0,

                behavior: "smooth",
              });

            }}
          >
            Review Submissions
          </button>

        </div>

      </section>


      {/* =====================================================
          NEW FORM MODAL
          ===================================================== */}

      {showNewForm && (

        <div
          className="nh-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeNewForm();
            }

          }}
        >

          <div
            className="nh-modal nh-form-registry-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* ===============================================
                MODAL HEADER
                =============================================== */}

            <div className="nh-modal-header">

              <div>

                <div className="nh-eyebrow">
                  FORM REGISTRATION
                </div>

                <h2>
                  New Form
                </h2>

                <p>
                  Register an authorized
                  New Horizon form in NHIS.
                </p>

              </div>


              <button
                type="button"
                className="nh-modal-close"
                onClick={
                  closeNewForm
                }
              >
                ×
              </button>

            </div>


            {/* ===============================================
                MODAL BODY
                =============================================== */}

            <form
              onSubmit={
                handleCreateForm
              }
              className="nh-form-registry-form"
            >

              {error && (

                <div className="nh-form-error">
                  {error}
                </div>

              )}


              <div className="nh-form-registry-field">

                <label>
                  Form Name
                </label>

                <input
                  type="text"
                  value={
                    newForm.name
                  }
                  onChange={(event) =>
                    updateNewForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter form name..."
                  required
                />

              </div>


              <div className="nh-form-registry-field">

                <label>
                  Category
                </label>

                <select
                  value={
                    newForm.category
                  }
                  onChange={(event) =>
                    updateNewForm(
                      "category",
                      event.target.value
                    )
                  }
                >

                  <option value="Investigation">
                    Investigation
                  </option>

                  <option value="Personnel">
                    Personnel
                  </option>

                  <option value="Cult Registry">
                    Cult Registry
                  </option>

                  <option value="Incident">
                    Incident
                  </option>

                  <option value="Administration">
                    Administration
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              <div className="nh-form-registry-field">

                <label>
                  Description
                </label>

                <textarea
                  value={
                    newForm.description
                  }
                  onChange={(event) =>
                    updateNewForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Brief description of the form..."
                  rows={5}
                />

              </div>


              <div className="nh-form-registry-notice">

                <strong>
                  Form Questions
                </strong>

                <span>
                  The form record will be
                  created without questions.
                  The finalized New Horizon
                  form will be connected to
                  this registry record later.
                </span>

              </div>


              {/* =============================================
                  ACTIONS
                  ============================================= */}

              <div className="nh-modal-actions">

                <button
                  type="button"
                  className="nh-secondary-button"
                  onClick={
                    closeNewForm
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="nh-primary-button"
                >
                  Register Form
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default Forms;