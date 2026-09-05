import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { db } from "../firebase/config";

/*
 * =========================================================
 * GOOGLE DRIVE CONFIGURATION
 * =========================================================
 *
 * The OAuth client ID is safe to expose in a browser app.
 * For the eventual handoff, move this value to:
 *
 * VITE_GOOGLE_CLIENT_ID=...
 *
 * in the recipient's .env file.
 */

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "401281266165-03dapkedu7fg5gf8ntg6idjrrqacrt70.apps.googleusercontent.com";

const GOOGLE_DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.file";

const GOOGLE_IDENTITY_SCRIPT =
  "https://accounts.google.com/gsi/client";

const DRIVE_API_BASE =
  "https://www.googleapis.com/drive/v3";

const DRIVE_UPLOAD_BASE =
  "https://www.googleapis.com/upload/drive/v3/files";

const DRIVE_FOLDER_MIME =
  "application/vnd.google-apps.folder";

const MAX_FILE_SIZE = 250 * 1024 * 1024;

const INITIAL_FORM = {
  evidenceTitle: "",
  evidenceType: "",
  collectionDate: new Date()
    .toISOString()
    .split("T")[0],
  collectionTime: "",
  location: "",
  investigator: "",
  equipmentUsed: "",
  description: "",
  initialAnalysis: "",
  possibleExplanation: "",
  status: "Unexplained",
  reviewerNotes: "",
};

const EVIDENCE_TYPES = [
  "Audio",
  "Video",
  "Photograph",
  "Environmental Reading",
  "EMF Reading",
  "Temperature Reading",
  "Motion Detection",
  "SLS / Visual Tracking",
  "Instrument Reading",
  "Document",
  "Other",
];

const STATUS_OPTIONS = [
  "Confirmed",
  "Unexplained",
  "Debunked",
];

/* =========================================================
   GOOGLE IDENTITY SERVICES
   ========================================================= */

function loadGoogleIdentityServices() {
  if (
    typeof window === "undefined"
  ) {
    return Promise.reject(
      new Error("Google authentication is unavailable.")
    );
  }

  if (
    window.google &&
    window.google.accounts &&
    window.google.accounts.oauth2
  ) {
    return Promise.resolve();
  }

  const existingScript =
    document.querySelector(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`
    );

  if (existingScript) {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(
          new Error(
            "Google authentication took too long to load."
          )
        );
      }, 10000);

      const check = () => {
        if (
          window.google &&
          window.google.accounts &&
          window.google.accounts.oauth2
        ) {
          window.clearTimeout(timeout);
          resolve();
          return;
        }

        window.setTimeout(check, 50);
      };

      check();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error(
          "Unable to load Google authentication."
        )
      );

    document.head.appendChild(script);
  });
}

/* =========================================================
   DRIVE API HELPERS
   ========================================================= */

async function driveRequest(
  accessToken,
  url,
  options = {}
) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let message = "";

    try {
      const data = await response.json();

      message =
        data?.error?.message ||
        data?.error_description ||
        "";
    } catch {
      // Ignore JSON parsing failure.
    }

    throw new Error(
      message ||
        `Google Drive request failed (${response.status}).`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function findDriveFolder(
  accessToken,
  name,
  parentId
) {
  const escapedName =
    name.replaceAll("'", "\\'");

  const query = [
    `name = '${escapedName}'`,
    `mimeType = '${DRIVE_FOLDER_MIME}'`,
    "trashed = false",
    `'${parentId}' in parents`,
  ].join(" and ");

  const params = new URLSearchParams({
    q: query,
    spaces: "drive",
    fields: "files(id,name,parents)",
    pageSize: "10",
  });

  const data = await driveRequest(
    accessToken,
    `${DRIVE_API_BASE}/files?${params.toString()}`
  );

  return data.files?.[0] || null;
}

async function createDriveFolder(
  accessToken,
  name,
  parentId
) {
  return driveRequest(
    accessToken,
    `${DRIVE_API_BASE}/files?fields=id,name,parents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: DRIVE_FOLDER_MIME,
        parents: [parentId],
      }),
    }
  );
}

async function getOrCreateDriveFolder(
  accessToken,
  name,
  parentId
) {
  const existing =
    await findDriveFolder(
      accessToken,
      name,
      parentId
    );

  if (existing) {
    return existing;
  }

  return createDriveFolder(
    accessToken,
    name,
    parentId
  );
}

async function getOrCreateEvidenceRoot(
  accessToken
) {
  const storedRootId =
    localStorage.getItem(
      "nhis_google_drive_evidence_root_id"
    );

  if (storedRootId) {
    try {
      const existing = await driveRequest(
        accessToken,
        `${DRIVE_API_BASE}/files/${storedRootId}?fields=id,name,trashed`
      );

      if (
        existing &&
        !existing.trashed
      ) {
        return existing;
      }
    } catch {
      localStorage.removeItem(
        "nhis_google_drive_evidence_root_id"
      );
    }
  }

  const root =
    await getOrCreateDriveFolder(
      accessToken,
      "NHIS Evidence",
      "root"
    );

  localStorage.setItem(
    "nhis_google_drive_evidence_root_id",
    root.id
  );

  return root;
}

async function uploadDriveFile(
  accessToken,
  file,
  parentId,
  evidenceId
) {
  const metadata = {
    name: file.name,
    parents: [parentId],
    description:
      `NHIS Evidence ${evidenceId}. Original evidence file uploaded through New Horizon Information System.`,
    appProperties: {
      nhisEvidenceId: evidenceId,
    },
  };

  const boundary =
    `nhis_boundary_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}`;

  const multipartBody = new Blob(
    [
      `--${boundary}\r\n`,
      "Content-Type: application/json; charset=UTF-8\r\n\r\n",
      JSON.stringify(metadata),
      "\r\n",
      `--${boundary}\r\n`,
      `Content-Type: ${
        file.type || "application/octet-stream"
      }\r\n\r\n`,
      file,
      "\r\n",
      `--${boundary}--`,
    ],
    {
      type: `multipart/related; boundary=${boundary}`,
    }
  );

  const params = new URLSearchParams({
    uploadType: "multipart",
    fields:
      "id,name,mimeType,size,webViewLink,webContentLink,createdTime",
  });

  return driveRequest(
    accessToken,
    `${DRIVE_UPLOAD_BASE}?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

function EvidenceSubmission() {
  const navigate = useNavigate();
  const { investigationId } =
    useParams();

  const tokenClientRef =
    useRef(null);

  const accessTokenRef =
    useRef("");

  const [googleReady, setGoogleReady] =
    useState(false);

  const [googleConnected, setGoogleConnected] =
    useState(false);

  const [googleAccount, setGoogleAccount] =
    useState("");

  const [investigation, setInvestigation] =
    useState(null);

  const [caseData, setCaseData] =
    useState(null);

  const [members, setMembers] =
    useState([]);

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [files, setFiles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const selectedFileSize =
    useMemo(
      () =>
        files.reduce(
          (total, file) =>
            total + file.size,
          0
        ),
      [files]
    );

  const formattedSelectedSize =
    useMemo(() => {
      if (selectedFileSize < 1024) {
        return `${selectedFileSize} B`;
      }

      if (
        selectedFileSize <
        1024 * 1024
      ) {
        return `${(
          selectedFileSize /
          1024
        ).toFixed(1)} KB`;
      }

      return `${(
        selectedFileSize /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }, [selectedFileSize]);

  /* =========================================================
     LOAD INVESTIGATION / CASE / MEMBERS
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        if (!investigationId) {
          throw new Error(
            "No investigation was provided."
          );
        }

        const investigationRef =
          doc(
            db,
            "investigations",
            investigationId
          );

        const investigationSnap =
          await getDoc(
            investigationRef
          );

        if (
          !investigationSnap.exists()
        ) {
          throw new Error(
            "Investigation record could not be found."
          );
        }

        const investigationData = {
          firestoreId:
            investigationSnap.id,
          ...investigationSnap.data(),
        };

        let loadedCase = null;

        const parentCaseId =
          investigationData.caseFirestoreId ||
          investigationData.caseId;

        if (parentCaseId) {
          const caseRef =
            doc(
              db,
              "cases",
              parentCaseId
            );

          const caseSnap =
            await getDoc(caseRef);

          if (caseSnap.exists()) {
            loadedCase = {
              firestoreId:
                caseSnap.id,
              ...caseSnap.data(),
            };
          }
        }

        const membersSnap =
          await getDocs(
            collection(
              db,
              "members"
            )
          );

        const loadedMembers =
          membersSnap.docs.map(
            (memberDoc) => ({
              firestoreId:
                memberDoc.id,
              ...memberDoc.data(),
            })
          );

        if (!mounted) return;

        setInvestigation(
          investigationData
        );

        setCaseData(loadedCase);
        setMembers(
          loadedMembers
        );

        setForm((previous) => ({
          ...previous,
          location:
            loadedCase?.locationName ||
            loadedCase?.location ||
            loadedCase?.address ||
            "",
          investigator:
            investigationData.leadInvestigator ||
            "",
          collectionDate:
            investigationData.date ||
            previous.collectionDate,
          collectionTime:
            investigationData.startTime ||
            "",
        }));
      } catch (err) {
        console.error(
          "Error loading evidence submission:",
          err
        );

        if (mounted) {
          setError(
            err.message ||
              "Unable to load the evidence submission."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [investigationId]);

  /* =========================================================
     LOAD GOOGLE IDENTITY SERVICES
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    loadGoogleIdentityServices()
      .then(() => {
        if (!mounted) return;

        setGoogleReady(true);

        if (
          !window.google?.accounts?.oauth2
        ) {
          return;
        }

        tokenClientRef.current =
          window.google.accounts.oauth2.initTokenClient(
            {
              client_id:
                GOOGLE_CLIENT_ID,
              scope:
                GOOGLE_DRIVE_SCOPE,
              callback: () => {},
            }
          );
      })
      .catch((err) => {
        console.error(
          "Google Identity Services error:",
          err
        );

        if (mounted) {
          setError(
            "Google Drive authentication could not be loaded. Check your internet connection and OAuth configuration."
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     FORM HELPERS
     ========================================================= */

  function updateField(
    field,
    value
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleFilesSelected(
    event
  ) {
    const selected =
      Array.from(
        event.target.files || []
      );

    if (
      selected.length === 0
    ) {
      return;
    }

    const oversized =
      selected.find(
        (file) =>
          file.size > MAX_FILE_SIZE
      );

    if (oversized) {
      setError(
        `"${oversized.name}" exceeds the 250 MB per-file limit.`
      );
      event.target.value = "";
      return;
    }

    setError("");

    setFiles((previous) => [
      ...previous,
      ...selected,
    ]);

    event.target.value = "";
  }

  function removeFile(index) {
    setFiles((previous) =>
      previous.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );
  }

  function formatFileSize(
    size
  ) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (
      size <
      1024 * 1024
    ) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function fileTypeLabel(
    file
  ) {
    const type =
      file.type || "";

    if (
      type.startsWith("video/")
    ) {
      return "VIDEO";
    }

    if (
      type.startsWith("audio/")
    ) {
      return "AUDIO";
    }

    if (
      type.startsWith("image/")
    ) {
      return "IMAGE";
    }

    if (
      type.includes("pdf")
    ) {
      return "PDF";
    }

    return "FILE";
  }

  /* =========================================================
     GOOGLE DRIVE AUTHENTICATION
     ========================================================= */

  function connectGoogleDrive() {
    return new Promise(
      (resolve, reject) => {
        if (
          !googleReady ||
          !window.google?.accounts?.oauth2
        ) {
          reject(
            new Error(
              "Google authentication is not ready yet."
            )
          );
          return;
        }

        const tokenClient =
          window.google.accounts.oauth2.initTokenClient(
            {
              client_id:
                GOOGLE_CLIENT_ID,
              scope:
                GOOGLE_DRIVE_SCOPE,
              callback: (response) => {
                if (
                  response?.error
                ) {
                  reject(
                    new Error(
                      response.error_description ||
                        response.error ||
                        "Google authorization was denied."
                    )
                  );
                  return;
                }

                accessTokenRef.current =
                  response.access_token;

                setGoogleConnected(
                  true
                );

                setGoogleAccount(
                  "Google Drive connected"
                );

                resolve(
                  response.access_token
                );
              },
            }
          );

        tokenClient.requestAccessToken(
          {
            prompt: "consent",
          }
        );
      }
    );
  }

  async function ensureGoogleDriveAccess() {
    if (
      accessTokenRef.current
    ) {
      return accessTokenRef.current;
    }

    return connectGoogleDrive();
  }

  /* =========================================================
     EVIDENCE NUMBER
     ========================================================= */

  async function generateEvidenceNumber() {
    const snapshot =
      await getDocs(
        collection(
          db,
          "evidence"
        )
      );

    let highest = 0;

    snapshot.docs.forEach(
      (evidenceDoc) => {
        const data =
          evidenceDoc.data();

        const value =
          String(
            data.evidenceId ||
              ""
          );

        const match =
          value.match(
            /^EVD-(\d+)$/
          );

        if (match) {
          highest =
            Math.max(
              highest,
              Number(
                match[1]
              )
            );
        }
      }
    );

    return `EVD-${String(
      highest + 1
    ).padStart(4, "0")}`;
  }

  /* =========================================================
     VALIDATION
     ========================================================= */

  function validateForm() {
    if (
      !form.evidenceTitle.trim()
    ) {
      return "Evidence title is required.";
    }

    if (!form.evidenceType) {
      return "Evidence type is required.";
    }

    if (!form.collectionDate) {
      return "Collection date is required.";
    }

    if (!form.location.trim()) {
      return "Location is required.";
    }

    if (!form.investigator.trim()) {
      return "Investigator is required.";
    }

    if (!form.description.trim()) {
      return "Evidence description is required.";
    }

    if (files.length === 0) {
      return "At least one evidence file is required.";
    }

    return "";
  }

  /* =========================================================
     SAVE EVIDENCE
     ========================================================= */

  async function saveEvidence() {
    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      const accessToken =
        await ensureGoogleDriveAccess();

      const evidenceNumber =
        await generateEvidenceNumber();

      const parentCaseId =
        investigation?.caseFirestoreId ||
        investigation?.caseId ||
        caseData?.firestoreId ||
        "";

      /*
       * Create the Firestore evidence record first.
       * This gives the Drive upload a stable EVD number.
       */
      const evidenceRef =
        await addDoc(
          collection(
            db,
            "evidence"
          ),
          {
            evidenceId:
              evidenceNumber,

            title:
              form.evidenceTitle.trim(),

            evidenceTitle:
              form.evidenceTitle.trim(),

            evidenceType:
              form.evidenceType,

            collectionDate:
              form.collectionDate,

            collectionTime:
              form.collectionTime,

            location:
              form.location.trim(),

            investigator:
              form.investigator.trim(),

            equipmentUsed:
              form.equipmentUsed.trim(),

            description:
              form.description.trim(),

            initialAnalysis:
              form.initialAnalysis.trim(),

            possibleExplanation:
              form.possibleExplanation.trim(),

            status:
              form.status,

            reviewerNotes:
              form.reviewerNotes.trim(),

            investigationId:
              investigation?.investigationId ||
              investigationId,

            investigationFirestoreId:
              investigationId,

            investigationNumber:
              investigation?.investigationNumber ||
              "",

            caseId:
              caseData?.caseId ||
              parentCaseId,

            caseFirestoreId:
              parentCaseId,

            caseNumber:
              caseData?.caseNumber ||
              "",

            files: [],

            fileCount:
              files.length,

            primaryFile: null,

            reviewStatus:
              "Pending Review",

            submitted: true,

            evidenceRepository:
              "Google Drive",

            driveFolderId:
              null,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

      /*
       * Create:
       *
       * NHIS Evidence
       *   CASE-XXXX
       *     INV-XXXX
       *       EVD-XXXX
       */
      const rootFolder =
        await getOrCreateEvidenceRoot(
          accessToken
        );

      const caseFolder =
        await getOrCreateDriveFolder(
          accessToken,
          caseData?.caseNumber ||
            caseData?.caseId ||
            parentCaseId ||
            "UNASSIGNED-CASE",
          rootFolder.id
        );

      const investigationFolder =
        await getOrCreateDriveFolder(
          accessToken,
          investigation?.investigationNumber ||
            `INV-${investigationId}`,
          caseFolder.id
        );

      const evidenceFolder =
        await getOrCreateDriveFolder(
          accessToken,
          evidenceNumber,
          investigationFolder.id
        );

      const uploadedFiles = [];

      for (
        let index = 0;
        index < files.length;
        index += 1
      ) {
        const file =
          files[index];

        const driveFile =
          await uploadDriveFile(
            accessToken,
            file,
            evidenceFolder.id,
            evidenceNumber
          );

        uploadedFiles.push({
          driveFileId:
            driveFile.id,

          name:
            driveFile.name ||
            file.name,

          mimeType:
            driveFile.mimeType ||
            file.type ||
            "application/octet-stream",

          size:
            Number(
              driveFile.size ||
                file.size ||
                0
            ),

          webViewLink:
            driveFile.webViewLink ||
            `https://drive.google.com/file/d/${driveFile.id}/view`,

          webContentLink:
            driveFile.webContentLink ||
            "",

          createdTime:
            driveFile.createdTime ||
            null,
        });

        setUploadProgress(
          Math.round(
            ((index + 1) /
              files.length) *
              100
          )
        );
      }

      /*
       * Update the evidence record with the actual
       * Google Drive repository information.
       */
      await updateDoc(
        evidenceRef,
        {
          files:
            uploadedFiles,

          fileCount:
            uploadedFiles.length,

          primaryFile:
            uploadedFiles[0] ||
            null,

          driveFolderId:
            evidenceFolder.id,

          driveFolderLink:
            `https://drive.google.com/drive/folders/${evidenceFolder.id}`,

          uploadCompleted:
            true,

          uploadedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      /*
       * Update investigation count/reference list.
       */
      const investigationRef =
        doc(
          db,
          "investigations",
          investigationId
        );

      const currentEvidenceIds =
        Array.isArray(
          investigation?.evidenceIds
        )
          ? investigation.evidenceIds
          : [];

      const updatedEvidenceIds =
        Array.from(
          new Set([
            ...currentEvidenceIds,
            evidenceRef.id,
          ])
        );

      await updateDoc(
        investigationRef,
        {
          evidenceIds:
            updatedEvidenceIds,

          evidenceCount:
            updatedEvidenceIds.length,

          updatedAt:
            serverTimestamp(),
        }
      );

      /*
       * Update the case-level evidence references too.
       */
      if (parentCaseId) {
        const caseRef =
          doc(
            db,
            "cases",
            parentCaseId
          );

        const currentCaseEvidenceIds =
          Array.isArray(
            caseData?.evidenceIds
          )
            ? caseData.evidenceIds
            : [];

        const updatedCaseEvidenceIds =
          Array.from(
            new Set([
              ...currentCaseEvidenceIds,
              evidenceRef.id,
            ])
          );

        await updateDoc(
          caseRef,
          {
            evidenceIds:
              updatedCaseEvidenceIds,

            evidenceCount:
              updatedCaseEvidenceIds.length,

            updatedAt:
              serverTimestamp(),
          }
        );
      }

      setSuccess(
        `${evidenceNumber} was submitted successfully.`
      );

      window.setTimeout(() => {
        navigate(
          `/investigations/${investigationId}`
        );
      }, 900);
    } catch (err) {
      console.error(
        "Error saving evidence:",
        err
      );

      setError(
        err.message ||
          "Unable to save the evidence record."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function navigateBack() {
    navigate(
      `/investigations/${investigationId}`
    );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  if (loading) {
    return (
      <div className="nh-final-page">
        <div className="nh-final-loading">
          Loading evidence submission...
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="nh-final-page">
        <div className="nh-final-error">
          {error ||
            "Investigation record could not be loaded."}
        </div>
      </div>
    );
  }

  return (
    <div className="nh-final-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="nh-final-header">

        <div>
          <div className="nh-command-label">
            EVIDENCE SUBMISSION
          </div>

          <h1>
            Submit Evidence
          </h1>

          <p>
            Record and archive evidence collected
            during this investigation.
          </p>
        </div>

        <div className="nh-final-header-meta">

          <div className="nh-final-header-id">
            {investigation.investigationNumber ||
              "INVESTIGATION"}
          </div>

          <div>
            {caseData?.caseNumber ||
              "CASE"}
          </div>

        </div>

      </div>

      {/* =====================================================
          GOOGLE DRIVE STATUS
          ===================================================== */}

      <section className="nh-final-section">

        <div className="nh-final-section-header">

          <div>
            <span>
              01
            </span>

            <div>
              <h2>
                Evidence Repository
              </h2>

              <p>
                Evidence files are stored directly in
                the authorized New Horizon Google Drive.
              </p>
            </div>
          </div>

          <div
            className={
              googleConnected
                ? "nh-drive-status nh-drive-status-connected"
                : "nh-drive-status"
            }
          >
            <span className="nh-drive-status-dot" />

            {googleConnected
              ? "DRIVE CONNECTED"
              : "DRIVE NOT CONNECTED"}
          </div>

        </div>

        {!googleConnected ? (
          <div className="nh-drive-connect-panel">

            <div>
              <strong>
                Connect Google Drive
              </strong>

              <p>
                NHIS needs permission to create the
                evidence folder and upload your selected
                files. It only requests access to files
                created through this application.
              </p>
            </div>

            <button
              className="nh-btn nh-btn-primary"
              onClick={() => {
                setError("");
                connectGoogleDrive().catch(
                  (err) =>
                    setError(
                      err.message ||
                        "Unable to connect Google Drive."
                    )
                );
              }}
              disabled={
                !googleReady ||
                saving
              }
            >
              {!googleReady
                ? "Loading Google..."
                : "Connect Google Drive"}
            </button>

          </div>
        ) : (
          <div className="nh-drive-connected-panel">

            <div>
              <strong>
                Google Drive Ready
              </strong>

              <p>
                Files will be organized automatically
                under the NHIS Evidence repository.
              </p>
            </div>

            <span>
              {googleAccount}
            </span>

          </div>
        )}

      </section>

      {/* =====================================================
          BASIC INFORMATION
          ===================================================== */}

      <section className="nh-final-section">

        <div className="nh-final-section-header">

          <div>
            <span>
              02
            </span>

            <div>
              <h2>
                Evidence Identification
              </h2>

              <p>
                Identify the material and establish its
                collection context.
              </p>
            </div>
          </div>

        </div>

        <div className="nh-form-grid">

          <div className="nh-form-field">
            <label>
              Evidence Title *
            </label>

            <input
              value={
                form.evidenceTitle
              }
              onChange={(event) =>
                updateField(
                  "evidenceTitle",
                  event.target.value
                )
              }
              placeholder="Example: Unexplained voice in hallway recording"
              disabled={saving}
            />
          </div>

          <div className="nh-form-field">
            <label>
              Evidence Type *
            </label>

            <select
              value={
                form.evidenceType
              }
              onChange={(event) =>
                updateField(
                  "evidenceType",
                  event.target.value
                )
              }
              disabled={saving}
            >
              <option value="">
                Select evidence type
              </option>

              {EVIDENCE_TYPES.map(
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

          <div className="nh-form-field">
            <label>
              Collection Date *
            </label>

            <input
              type="date"
              value={
                form.collectionDate
              }
              onChange={(event) =>
                updateField(
                  "collectionDate",
                  event.target.value
                )
              }
              disabled={saving}
            />
          </div>

          <div className="nh-form-field">
            <label>
              Collection Time
            </label>

            <input
              type="time"
              value={
                form.collectionTime
              }
              onChange={(event) =>
                updateField(
                  "collectionTime",
                  event.target.value
                )
              }
              disabled={saving}
            />
          </div>

          <div className="nh-form-field">
            <label>
              Location *
            </label>

            <input
              value={
                form.location
              }
              onChange={(event) =>
                updateField(
                  "location",
                  event.target.value
                )
              }
              placeholder="Location where evidence was collected"
              disabled={saving}
            />
          </div>

          <div className="nh-form-field">
            <label>
              Investigator *
            </label>

            <input
              list="nh-evidence-members"
              value={
                form.investigator
              }
              onChange={(event) =>
                updateField(
                  "investigator",
                  event.target.value
                )
              }
              placeholder="Investigator who collected the evidence"
              disabled={saving}
            />

            <datalist id="nh-evidence-members">
              {members.map(
                (member) => (
                  <option
                    key={
                      member.firestoreId
                    }
                    value={
                      member.name ||
                      [
                        member.firstName,
                        member.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                  />
                )
              )}
            </datalist>
          </div>

          <div className="nh-form-field nh-form-field-full">
            <label>
              Equipment Used
            </label>

            <input
              value={
                form.equipmentUsed
              }
              onChange={(event) =>
                updateField(
                  "equipmentUsed",
                  event.target.value
                )
              }
              placeholder="Camera, audio recorder, EMF meter, SLS, etc."
              disabled={saving}
            />
          </div>

        </div>

      </section>

      {/* =====================================================
          FILES
          ===================================================== */}

      <section className="nh-final-section">

        <div className="nh-final-section-header">

          <div>
            <span>
              03
            </span>

            <div>
              <h2>
                Evidence Files
              </h2>

              <p>
                Upload the original evidence files. Raw
                material should be preserved before any
                enhancement or editing.
              </p>
            </div>
          </div>

          <span className="nh-member-count">
            {files.length} files
          </span>

        </div>

        <div className="nh-final-upload-area">

          <label className="nh-final-upload-box">

            <div className="nh-final-upload-icon">
              +
            </div>

            <strong>
              Select Evidence Files
            </strong>

            <span>
              Photos, video, audio, documents, and
              instrument records can be uploaded directly
              to Google Drive.
            </span>

            <small>
              Maximum 250 MB per file
            </small>

            <input
              className="nh-final-file-input"
              type="file"
              multiple
              onChange={
                handleFilesSelected
              }
              disabled={saving}
            />

          </label>

        </div>

        {files.length > 0 && (
          <div className="nh-final-file-list">

            <div className="nh-final-file-list-header">

              <strong>
                Selected Files
              </strong>

              <span>
                {files.length} file
                {files.length === 1
                  ? ""
                  : "s"}{" "}
                ·{" "}
                {formattedSelectedSize}
              </span>

            </div>

            {files.map(
              (file, index) => (
                <div
                  className="nh-final-file-row"
                  key={`${file.name}-${file.size}-${index}`}
                >

                  <div className="nh-final-file-type">
                    {fileTypeLabel(
                      file
                    )}
                  </div>

                  <div className="nh-final-file-info">

                    <strong>
                      {file.name}
                    </strong>

                    <span>
                      {formatFileSize(
                        file.size
                      )}{" "}
                      ·{" "}
                      {file.type ||
                        "Unknown file type"}
                    </span>

                  </div>

                  <button
                    type="button"
                    className="nh-final-file-remove"
                    onClick={() =>
                      removeFile(
                        index
                      )
                    }
                    disabled={saving}
                    title="Remove file"
                  >
                    ×
                  </button>

                </div>
              )
            )}

          </div>
        )}

        {saving && (
          <div className="nh-final-upload-progress">

            <div className="nh-final-upload-progress-top">

              <span>
                Uploading evidence to Google Drive
              </span>

              <strong>
                {uploadProgress}%
              </strong>

            </div>

            <div className="nh-final-progress-track">

              <div
                className="nh-final-progress-bar"
                style={{
                  width: `${uploadProgress}%`,
                }}
              />

            </div>

          </div>
        )}

      </section>

      {/* =====================================================
          ANALYSIS
          ===================================================== */}

      <section className="nh-final-section">

        <div className="nh-final-section-header">

          <div>
            <span>
              04
            </span>

            <div>
              <h2>
                Initial Analysis
              </h2>

              <p>
                Document what was observed without
                prematurely treating an anomaly as paranormal.
              </p>
            </div>
          </div>

        </div>

        <div className="nh-form-grid">

          <div className="nh-form-field nh-form-field-full">
            <label>
              Evidence Description *
            </label>

            <textarea
              rows="6"
              value={
                form.description
              }
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              placeholder="Describe what the original file contains, including relevant timestamps, locations, and observations."
              disabled={saving}
            />
          </div>

          <div className="nh-form-field nh-form-field-full">
            <label>
              Initial Analysis
            </label>

            <textarea
              rows="6"
              value={
                form.initialAnalysis
              }
              onChange={(event) =>
                updateField(
                  "initialAnalysis",
                  event.target.value
                )
              }
              placeholder="Record the initial review of the evidence."
              disabled={saving}
            />
          </div>

          <div className="nh-form-field nh-form-field-full">
            <label>
              Possible Explanation
            </label>

            <textarea
              rows="5"
              value={
                form.possibleExplanation
              }
              onChange={(event) =>
                updateField(
                  "possibleExplanation",
                  event.target.value
                )
              }
              placeholder="Record possible natural, technical, environmental, or other explanations."
              disabled={saving}
            />
          </div>

          <div className="nh-form-field">
            <label>
              Current Status
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
              disabled={saving}
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="nh-form-field nh-form-field-full">
            <label>
              Reviewer Notes
            </label>

            <textarea
              rows="5"
              value={
                form.reviewerNotes
              }
              onChange={(event) =>
                updateField(
                  "reviewerNotes",
                  event.target.value
                )
              }
              placeholder="Administrative or future review notes."
              disabled={saving}
            />
          </div>

        </div>

      </section>

      {/* =====================================================
          ERROR / SUCCESS
          ===================================================== */}

      {error && (
        <div className="nh-final-alert nh-final-alert-error">
          <strong>
            Unable to submit evidence
          </strong>

          <span>
            {error}
          </span>
        </div>
      )}

      {success && (
        <div className="nh-final-alert nh-final-alert-success">
          <strong>
            Evidence Submitted
          </strong>

          <span>
            {success}
          </span>
        </div>
      )}

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="nh-final-footer">

        <div>
          <span>
            * Required field
          </span>

          <span>
            Evidence is archived in Google Drive.
          </span>
        </div>

        <div className="nh-page-actions">

          <button
            type="button"
            className="nh-btn nh-btn-secondary"
            onClick={
              navigateBack
            }
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="nh-btn nh-btn-primary"
            onClick={
              saveEvidence
            }
            disabled={
              saving ||
              !googleReady
            }
          >
            {saving
              ? `Uploading ${uploadProgress}%...`
              : "Submit Evidence"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default EvidenceSubmission;
