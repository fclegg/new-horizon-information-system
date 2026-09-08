import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "../firebase/config";

const categories = [
  "Operations",
  "Demonology",
  "History",
  "Investigation",
  "Spirit Research",
  "Training",
  "Research",
  "Reference",
  "Other",
];

const emptyForm = {
  title: "",
  category: "Research",
  author: "",
  description: "",
};

function Resources() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);

  const [error, setError] = useState("");

  /* =====================================================
     LOAD RESOURCES
     ===================================================== */

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(
        collection(db, "resources")
      );

      const loadedResources = snapshot.docs.map(
        (resourceDoc) => {
          const data = resourceDoc.data();

          return {
            firestoreId: resourceDoc.id,

            resourceId:
              data.resourceId ||
              "RES-???",

            title:
              data.title ||
              "Untitled Resource",

            type:
              data.type ||
              "PDF Document",

            category:
              data.category ||
              "Other",

            author:
              data.author ||
              "Unknown",

            description:
              data.description ||
              "",

            date:
              data.date ||
              data.createdAt ||
              null,

            fileName:
              data.fileName ||
              "Document.pdf",

            fileUrl:
              data.fileUrl ||
              "",

            filePath:
              data.filePath ||
              "",

            uploadedBy:
              data.uploadedBy ||
              "Unknown",
          };
        }
      );

      setResources(loadedResources);
    } catch (err) {
      console.error(
        "Error loading resources:",
        err
      );

      setError(
        "Unable to load resources. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     GENERATE RESOURCE ID
     ===================================================== */

  function generateResourceId(existingResources) {
    let highestNumber = 0;

    existingResources.forEach((resource) => {
      const match = String(
        resource.resourceId || ""
      ).match(/^RES-(\d+)$/);

      if (match) {
        highestNumber = Math.max(
          highestNumber,
          Number(match[1])
        );
      }
    });

    return `RES-${String(
      highestNumber + 1
    ).padStart(3, "0")}`;
  }

  /* =====================================================
     DATE FORMAT
     ===================================================== */

  function formatDate(dateValue) {
    if (!dateValue) {
      return "Unknown";
    }

    try {
      if (
        typeof dateValue === "object" &&
        typeof dateValue.toDate === "function"
      ) {
        return dateValue
          .toDate()
          .toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
      }

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return String(dateValue);
      }

      return date.toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );
    } catch {
      return "Unknown";
    }
  }

  /* =====================================================
     FILE SIZE
     ===================================================== */

  function formatFileSize(bytes) {
    if (!bytes) {
      return "0 KB";
    }

    const mb = bytes / 1024 / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${Math.max(
      1,
      Math.round(bytes / 1024)
    )} KB`;
  }

  /* =====================================================
     FORM
     ===================================================== */

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openAddModal() {
    setForm(emptyForm);
    setSelectedFile(null);
    setError("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    if (saving) {
      return;
    }

    setShowAddModal(false);
    setForm(emptyForm);
    setSelectedFile(null);
    setError("");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setError(
        "Only PDF files can be uploaded as resources."
      );

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  }

  /* =====================================================
     UPLOAD RESOURCE
     ===================================================== */

  async function handleAddResource(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Please enter a resource title.");
      return;
    }

    if (!form.author.trim()) {
      setError("Please enter the author or source.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const resourceId =
        generateResourceId(resources);

      /*
       * Create the Firestore document ID first.
       */
      const resourceRef = doc(
        collection(db, "resources")
      );

      /*
       * Store the PDF in Firebase Storage.
       */
      const storagePath =
        `resources/${resourceRef.id}/${selectedFile.name}`;

      const storageRef = ref(
        storage,
        storagePath
      );

      await uploadBytes(
        storageRef,
        selectedFile,
        {
          contentType: "application/pdf",
        }
      );

      /*
       * Get the public/authenticated download URL.
       */
      const fileUrl =
        await getDownloadURL(storageRef);

      /*
       * Save the resource metadata.
       */
      await setDoc(resourceRef, {
        resourceId,

        title: form.title.trim(),

        type: "PDF Document",

        category: form.category,

        author: form.author.trim(),

        description:
          form.description.trim(),

        fileName:
          selectedFile.name,

        fileSize:
          selectedFile.size,

        fileType:
          selectedFile.type,

        fileUrl,

        filePath:
          storagePath,

        uploadedBy:
          "New Horizon Personnel",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      });

      setShowAddModal(false);
      setForm(emptyForm);
      setSelectedFile(null);

      await loadResources();
    } catch (err) {
      console.error(
        "Error uploading resource:",
        err
      );

      setError(
        "Unable to upload the resource. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     FILTER
     ===================================================== */

  const filteredResources = resources.filter(
    (resource) => {
      const searchText =
        search.toLowerCase();

      const matchesSearch =
        resource.title
          .toLowerCase()
          .includes(searchText) ||
        resource.resourceId
          .toLowerCase()
          .includes(searchText) ||
        resource.author
          .toLowerCase()
          .includes(searchText) ||
        resource.category
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        categoryFilter === "All" ||
        resource.category ===
          categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );

  /* =====================================================
     STATISTICS
     ===================================================== */

  const totalResources =
    resources.length;

  const totalDocuments =
    resources.filter(
      (resource) =>
        resource.type === "PDF Document"
    ).length;

  const categoryCount = useMemo(
    () =>
      resources.filter(
        (resource) =>
          resource.category ===
          "Research"
      ).length,
    [resources]
  );

  const referenceCount = useMemo(
    () =>
      resources.filter(
        (resource) =>
          resource.category ===
            "Reference" ||
          resource.category ===
            "History"
      ).length,
    [resources]
  );

  /* =====================================================
     RESOURCE ICON
     ===================================================== */

  function getResourceIcon() {
    return "▤";
  }

  /* =====================================================
     VIEW RESOURCE
     ===================================================== */

  function openResource(resource) {
    if (!resource.fileUrl) {
      setError(
        "This resource does not have a PDF attached."
      );

      return;
    }

    setSelectedResource(resource);
  }

  function closeResourceViewer() {
    setSelectedResource(null);
  }

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <div className="nh-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="nh-page-header">

        <div>
          <h1 className="nh-page-title">
            Resources
          </h1>

          <p className="nh-page-subtitle">
            Research materials, documents,
            references, and investigative
            resources.
          </p>
        </div>

        <button
          className="nh-button nh-button-primary"
          onClick={openAddModal}
          type="button"
        >
          + Add Resource
        </button>

      </div>


      {/* =================================================
          ERROR
          ================================================= */}

      {error &&
        !showAddModal && (
          <div className="nh-error">
            {error}
          </div>
        )}


      {/* =================================================
          STATISTICS
          ================================================= */}

      <section className="nh-resource-overview">

        <div className="nh-resource-stat nh-card">

          <div className="nh-resource-stat-label">
            Total Resources
          </div>

          <div className="nh-resource-stat-value">
            {String(
              totalResources
            ).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-resource-stat nh-card">

          <div className="nh-resource-stat-label">
            PDF Documents
          </div>

          <div className="nh-resource-stat-value">
            {String(
              totalDocuments
            ).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-resource-stat nh-card">

          <div className="nh-resource-stat-label">
            Research
          </div>

          <div className="nh-resource-stat-value">
            {String(
              categoryCount
            ).padStart(2, "0")}
          </div>

        </div>


        <div className="nh-resource-stat nh-card">

          <div className="nh-resource-stat-label">
            References
          </div>

          <div className="nh-resource-stat-value">
            {String(
              referenceCount
            ).padStart(2, "0")}
          </div>

        </div>

      </section>


      {/* =================================================
          SEARCH / FILTERS
          ================================================= */}

      <section className="nh-resource-controls nh-card">

        <div className="nh-search-wrapper">

          <input
            type="text"
            className="nh-search-input"
            placeholder="Search resources, IDs, or authors..."
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
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value
            )
          }
        >

          <option value="All">
            All Categories
          </option>

          {categories.map(
            (category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            )
          )}

        </select>

      </section>


      {/* =================================================
          RESOURCE LIBRARY
          ================================================= */}

      <section className="nh-section">

        <div className="nh-section-header">

          <div className="nh-resource-section-title">

            <h2 className="nh-section-title">
              Resource Library
            </h2>

            <p className="nh-section-subtitle">
              Reference material available
              to New Horizon personnel.
            </p>

          </div>

          <span className="nh-member-count">
            {filteredResources.length} resources
          </span>

        </div>


        <div className="nh-card nh-resource-table">

          {/* =================================================
              TABLE HEADER
              ================================================= */}

          <div className="nh-resource-row nh-resource-header">

            <div>
              Resource
            </div>

            <div>
              Type
            </div>

            <div>
              Category
            </div>

            <div>
              Author
            </div>

            <div>
              Date
            </div>

            <div>
              Action
            </div>

          </div>


          {/* =================================================
              LOADING
              ================================================= */}

          {loading && (
            <div className="nh-resource-empty">
              Loading resources...
            </div>
          )}


          {/* =================================================
              RESOURCES
              ================================================= */}

          {!loading &&
            filteredResources.map(
              (resource) => (

                <div
                  className="nh-resource-row"
                  key={
                    resource.firestoreId
                  }
                >

                  <div className="nh-resource-identity">

                    <div className="nh-resource-icon">
                      {getResourceIcon()}
                    </div>

                    <div>

                      <div className="nh-list-title">
                        {resource.title}
                      </div>

                      <div className="nh-list-meta">
                        {resource.resourceId}
                        {" · "}
                        {resource.fileName}
                      </div>

                    </div>

                  </div>


                  <div className="nh-resource-type">
                    PDF Document
                  </div>


                  <div>

                    <span className="nh-resource-category">
                      {resource.category}
                    </span>

                  </div>


                  <div className="nh-resource-author">
                    {resource.author}
                  </div>


                  <div className="nh-resource-date">
                    {formatDate(
                      resource.date
                    )}
                  </div>


                  <div>

                    <button
                      type="button"
                      className="nh-resource-view-button"
                      onClick={() =>
                        openResource(
                          resource
                        )
                      }
                    >
                      View PDF
                    </button>

                  </div>

                </div>

              )
            )}


          {/* =================================================
              EMPTY
              ================================================= */}

          {!loading &&
            filteredResources.length ===
              0 && (

              <div className="nh-resource-empty">

                {resources.length === 0 ? (
                  <>
                    <strong>
                      No resources have been
                      uploaded yet.
                    </strong>

                    <span>
                      Upload a PDF resource
                      to begin building the
                      New Horizon Resource
                      Library.
                    </span>

                    <button
                      type="button"
                      className="nh-button nh-button-primary"
                      onClick={
                        openAddModal
                      }
                    >
                      + Add Resource
                    </button>
                  </>
                ) : (
                  <>
                    No resources match the
                    current search or category.
                  </>
                )}

              </div>

            )}

        </div>

      </section>


      {/* =====================================================
          ADD RESOURCE MODAL
          ===================================================== */}

      {showAddModal && (

        <div className="nh-modal-backdrop">

          <div className="nh-resource-modal">

            <div className="nh-modal-header">

              <div>

                <div className="nh-eyebrow">
                  RESOURCE DATABASE
                </div>

                <h2>
                  Add Resource
                </h2>

                <p>
                  Upload a PDF document to
                  the New Horizon Resource
                  Library.
                </p>

              </div>

              <button
                type="button"
                className="nh-modal-close"
                onClick={
                  closeAddModal
                }
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              className="nh-resource-form"
              onSubmit={
                handleAddResource
              }
            >

              {/* =================================================
                  RESOURCE INFORMATION
                  ================================================= */}

              <section className="nh-resource-form-section">

                <h3>
                  Resource Information
                </h3>

                <label>

                  Resource Title *

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Enter resource title"
                    required
                  />

                </label>


                <div className="nh-resource-form-grid">

                  <label>

                    Category *

                    <select
                      value={
                        form.category
                      }
                      onChange={(event) =>
                        updateForm(
                          "category",
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
                            {category}
                          </option>
                        )
                      )}

                    </select>

                  </label>


                  <label>

                    Author / Source *

                    <input
                      type="text"
                      value={
                        form.author
                      }
                      onChange={(event) =>
                        updateForm(
                          "author",
                          event.target.value
                        )
                      }
                      placeholder="Author, organization, or source"
                      required
                    />

                  </label>

                </div>


                <label>

                  Description

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Brief description of the resource..."
                  />

                </label>

              </section>


              {/* =================================================
                  PDF UPLOAD
                  ================================================= */}

              <section className="nh-resource-form-section">

                <h3>
                  PDF Document
                </h3>

                <div className="nh-resource-upload-box">

                  <div className="nh-resource-upload-icon">
                    ▤
                  </div>

                  <div>

                    <strong>
                      Select PDF Document
                    </strong>

                    <span>
                      Only PDF files are
                      accepted.
                    </span>

                  </div>

                  <label className="nh-resource-file-button">

                    Choose PDF

                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={
                        handleFileChange
                      }
                    />

                  </label>

                </div>


                {selectedFile && (

                  <div className="nh-resource-selected-file">

                    <div>

                      <strong>
                        {selectedFile.name}
                      </strong>

                      <span>
                        {formatFileSize(
                          selectedFile.size
                        )}
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFile(
                          null
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                )}

              </section>


              {/* =================================================
                  ERROR
                  ================================================= */}

              {error && (
                <div className="nh-error">
                  {error}
                </div>
              )}


              {/* =================================================
                  FOOTER
                  ================================================= */}

              <div className="nh-resource-form-footer">

                <button
                  type="button"
                  className="nh-button nh-button-secondary"
                  onClick={
                    closeAddModal
                  }
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
                    ? "Uploading..."
                    : "Upload Resource"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          PDF VIEWER
          ===================================================== */}

      {selectedResource && (

        <div className="nh-modal-backdrop">

          <div className="nh-resource-viewer">

            <div className="nh-resource-viewer-header">

              <div>

                <div className="nh-eyebrow">
                  {selectedResource.resourceId}
                </div>

                <h2>
                  {selectedResource.title}
                </h2>

                <p>
                  {selectedResource.author}
                  {" · "}
                  {selectedResource.category}
                </p>

              </div>


              <div className="nh-resource-viewer-actions">

                <a
                  href={
                    selectedResource.fileUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nh-button nh-button-secondary"
                >
                  Open in New Tab
                </a>

                <button
                  type="button"
                  className="nh-modal-close"
                  onClick={
                    closeResourceViewer
                  }
                >
                  ×
                </button>

              </div>

            </div>


            <div className="nh-resource-pdf-container">

              <iframe
                src={
                  selectedResource.fileUrl
                }
                title={
                  selectedResource.title
                }
                className="nh-resource-pdf"
              />

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Resources;