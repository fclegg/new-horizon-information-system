import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getApps,
  initializeApp,
} from "firebase/app";

import {
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

/*
 * =========================================================
 * LEGACY OKLAHOMA INVESTIGATION MAP FIREBASE
 * =========================================================
 *
 * This connects to the original Oklahoma Investigation Map
 * Firebase project so the existing location records do NOT
 * have to be entered again.
 */

const oldMapFirebaseConfig = {
  apiKey: "AIzaSyAfAk1hl11uDpC3JB7m0JvwnPf8rVXxJTg",
  authDomain:
    "oklahoma-investigation-map.firebaseapp.com",
  projectId:
    "oklahoma-investigation-map",
  storageBucket:
    "oklahoma-investigation-map.firebasestorage.app",
  messagingSenderId: "809288424180",
  appId:
    "1:809288424180:web:6b6989762ea7db99151ca1",
};

const oldMapApp =
  getApps().find(
    (app) =>
      app.name ===
      "old-oklahoma-investigation-map"
  ) ||
  initializeApp(
    oldMapFirebaseConfig,
    "old-oklahoma-investigation-map"
  );

const oldMapDb = getFirestore(oldMapApp);

/*
 * =========================================================
 * MAP SETTINGS
 * =========================================================
 */

const OKLAHOMA_CENTER = [
  35.4676,
  -97.5164,
];

const DEFAULT_ZOOM = 7;

/*
 * =========================================================
 * FILTER OPTIONS
 * =========================================================
 */

const DEFAULT_FILTER = "All";

const LOCATION_TYPES = [
  "All",
  "Cemetery",
  "Structure (In Use)",
  "Structure (Abandoned)",
  "Park",
  "Lake",
  "Road/Bridge",
  "Other",
  "Unknown",
];

const STATUSES = [
  "All",
  "Active",
  "Closed",
  "Unknown",
];

const PERMISSIONS = [
  "All",
  "Required",
  "Not Required",
  "Unknown",
];

const ENTITIES = [
  "All",
  "Ghost",
  "Spirit",
  "Demon",
  "Cryptid",
  "Unknown",
];

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function cleanValue(
  value,
  fallback = "Unknown"
) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value).trim();
}

function getRegion(location) {
  const county = cleanValue(
    location.county
  ).toLowerCase();

  const tulsaCounties = [
    "tulsa",
    "wagoner",
    "rogers",
    "creek",
    "osage",
    "washington",
    "okmulgee",
  ];

  const okcCounties = [
    "oklahoma",
    "cleveland",
    "canadian",
    "logan",
    "pottawatomie",
    "mcclain",
    "grady",
  ];

  if (
    tulsaCounties.some((item) =>
      county.includes(item)
    )
  ) {
    return "Tulsa Area";
  }

  if (
    okcCounties.some((item) =>
      county.includes(item)
    )
  ) {
    return "Oklahoma City Area";
  }

  return "Eastern / Western Oklahoma";
}

function markerClass(location) {
  const type = cleanValue(
    location.type
  ).toLowerCase();

  const status = cleanValue(
    location.status
  ).toLowerCase();

  const entity = cleanValue(
    location.entity
  ).toLowerCase();

  if (
    entity.includes("demon") ||
    entity.includes("negative")
  ) {
    return "case";
  }

  if (status === "active") {
    return "investigation";
  }

  if (
    type.includes("cemetery") ||
    type.includes("lake") ||
    type.includes("park")
  ) {
    return "reported";
  }

  return "investigation";
}

function createMarkerIcon(
  location,
  selected = false
) {
  const markerType =
    markerClass(location);

  return L.divIcon({
    className:
      "nh-leaflet-marker-wrapper",

    html: `
      <div class="nh-leaflet-marker ${markerType} ${
        selected ? "selected" : ""
      }">
        <span></span>
      </div>
    `,

    iconSize: [28, 28],

    iconAnchor: [14, 14],
  });
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function HauntingsMap() {
  /*
   * =======================================================
   * DATABASE STATE
   * =======================================================
   */

  const [locations, setLocations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * =======================================================
   * FILTER STATE
   * =======================================================
   */

  const [search, setSearch] =
    useState("");

  const [type, setType] =
    useState(DEFAULT_FILTER);

  const [status, setStatus] =
    useState(DEFAULT_FILTER);

  const [permission, setPermission] =
    useState(DEFAULT_FILTER);

  const [entity, setEntity] =
    useState(DEFAULT_FILTER);

  const [showArchived, setShowArchived] =
    useState(false);

  /*
   * =======================================================
   * VIEW STATE
   * =======================================================
   */

  const [view, setView] =
    useState("map");

  const [selectedLocation, setSelectedLocation] =
    useState(null);

  /*
   * =======================================================
   * EDITOR STATE
   * =======================================================
   */

  const [editorOpen, setEditorOpen] =
    useState(false);

  const [editingLocation, setEditingLocation] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState("");

  /*
   * =======================================================
   * MAP PICKER STATE
   * =======================================================
   *
   * When the user chooses "Pick From Map", we temporarily
   * close the editor and wait for the next map click.
   */

  const [pickCoordinates, setPickCoordinates] =
    useState(false);

  const [pendingCoordinates, setPendingCoordinates] =
    useState(null);

  /*
   * =======================================================
   * MAP REFS
   * =======================================================
   */

  const mapContainerRef =
    useRef(null);

  const mapRef =
    useRef(null);

  const markersLayerRef =
    useRef(null);

  /*
   * =======================================================
   * LOAD EXISTING FIRESTORE LOCATIONS
   * =======================================================
   */

  useEffect(() => {
    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      collection(
        oldMapDb,
        "locations"
      ),

      (snapshot) => {
        const loadedLocations = [];

        snapshot.forEach((docSnap) => {
          const data =
            docSnap.data();

          const lat =
            Number(data.lat);

          const lng =
            Number(data.lng);

          /*
           * Ignore malformed records without
           * usable coordinates.
           */

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            return;
          }

          loadedLocations.push({
            id: docSnap.id,

            name: cleanValue(
              data.name,
              "Unnamed Location"
            ),

            county: cleanValue(
              data.county,
              "Unknown County"
            ),

            type: cleanValue(
              data.type
            ),

            status: cleanValue(
              data.status
            ),

            permission: cleanValue(
              data.permission
            ),

            entity: cleanValue(
              data.entity
            ),

            details: cleanValue(
              data.details,
              "No details recorded."
            ),

            lat,

            lng,

            archived:
              data.archived === true,
          });
        });

        loadedLocations.sort(
          (a, b) =>
            a.name.localeCompare(
              b.name
            )
        );

        setLocations(
          loadedLocations
        );

        setLoading(false);
      },

      (firebaseError) => {
        console.error(
          "Hauntings Map Firestore error:",
          firebaseError
        );

        setError(
          "Unable to load the existing location database. Check the Firestore connection and database rules."
        );

        setLoading(false);
      }
    );

    return () =>
      unsubscribe();
  }, []);

  /*
   * =======================================================
   * FILTER LOCATIONS
   * =======================================================
   */

  const filteredLocations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return locations.filter(
        (location) => {
          const searchableText = [
            location.name,
            location.county,
            location.type,
            location.status,
            location.permission,
            location.entity,
            location.details,
            location.id,
          ]
            .join(" ")
            .toLowerCase();

          const matchesArchived =
            showArchived ||
            !location.archived;

          const matchesSearch =
            query === "" ||
            searchableText.includes(
              query
            );

          const matchesType =
            type === "All" ||
            location.type === type;

          const matchesStatus =
            status === "All" ||
            location.status === status;

          const matchesPermission =
            permission === "All" ||
            location.permission ===
              permission;

          const matchesEntity =
            entity === "All" ||
            location.entity === entity;

          return (
            matchesArchived &&
            matchesSearch &&
            matchesType &&
            matchesStatus &&
            matchesPermission &&
            matchesEntity
          );
        }
      );
    }, [
      locations,
      search,
      type,
      status,
      permission,
      entity,
      showArchived,
    ]);

  /*
   * =======================================================
   * STATISTICS
   * =======================================================
   */

  const activeCount =
    filteredLocations.filter(
      (location) =>
        location.status ===
        "Active"
    ).length;

  const closedCount =
    filteredLocations.filter(
      (location) =>
        location.status ===
        "Closed"
    ).length;

  const archivedCount =
    locations.filter(
      (location) =>
        location.archived
    ).length;

  /*
   * =======================================================
   * INITIALIZE LEAFLET MAP
   * =======================================================
   */

  useEffect(() => {
    if (
      loading ||
      view !== "map" ||
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const map = L.map(
      mapContainerRef.current,
      {
        center:
          OKLAHOMA_CENTER,

        zoom:
          DEFAULT_ZOOM,

        zoomControl:
          true,

        attributionControl:
          true,
      }
    );

    /*
     * =====================================================
     * BASE MAPS
     * =====================================================
     */

    const streetMap =
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,

          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }
      );

    const satelliteMap =
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,

          attribution:
            "Tiles &copy; Esri",
        }
      );

    /*
     * Default to street view.
     */

    streetMap.addTo(map);

    /*
     * Marker layer.
     */

    markersLayerRef.current =
      L.layerGroup().addTo(
        map
      );

    /*
     * Plain / Satellite selector.
     */

    L.control
      .layers(
        {
          "Plain Map":
            streetMap,

          Satellite:
            satelliteMap,
        },
        null,
        {
          position:
            "topright",

          collapsed:
            false,
        }
      )
      .addTo(map);

    /*
     * =====================================================
     * MAP CLICK
     * =====================================================
     *
     * Used when the user is adding/editing a location
     * and has selected "Pick From Map".
     */

    map.on(
      "click",
      (event) => {
        if (!pickCoordinates) {
          return;
        }

        const {
          lat,
          lng,
        } = event.latlng;

        setPendingCoordinates({
          lat:
            Number(
              lat.toFixed(6)
            ),

          lng:
            Number(
              lng.toFixed(6)
            ),
        });

        setPickCoordinates(
          false
        );

        setEditorOpen(true);
      }
    );

    mapRef.current =
      map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();

      mapRef.current =
        null;

      markersLayerRef.current =
        null;
    };
  }, [
    view,
    loading,
    pickCoordinates,
  ]);

  /*
   * =======================================================
   * UPDATE MAP MARKERS
   * =======================================================
   */

  useEffect(() => {
    if (
      view !== "map" ||
      !mapRef.current ||
      !markersLayerRef.current
    ) {
      return;
    }

    const map =
      mapRef.current;

    const markerLayer =
      markersLayerRef.current;

    markerLayer.clearLayers();

    filteredLocations.forEach(
      (location) => {
        const marker =
          L.marker(
            [
              location.lat,
              location.lng,
            ],
            {
              icon:
                createMarkerIcon(
                  location,
                  selectedLocation?.id ===
                    location.id
                ),

              title:
                location.name,
            }
          );

        marker.on(
          "click",
          () => {
            setSelectedLocation(
              location
            );

            map.flyTo(
              [
                location.lat,
                location.lng,
              ],

              Math.max(
                map.getZoom(),
                12
              ),

              {
                duration:
                  0.7,
              }
            );
          }
        );

        marker.addTo(
          markerLayer
        );
      }
    );

    /*
     * Clear selection if filtering removed
     * the selected location.
     */

    if (
      selectedLocation &&
      !filteredLocations.some(
        (location) =>
          location.id ===
          selectedLocation.id
      )
    ) {
      setSelectedLocation(
        null
      );
    }
  }, [
    filteredLocations,
    selectedLocation,
    view,
  ]);

  /*
   * =======================================================
   * MAP RESIZE
   * =======================================================
   */

  useEffect(() => {
    if (
      view !== "map" ||
      !mapRef.current
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 200);

    return () =>
      clearTimeout(timer);
  }, [view]);

  /*
   * =======================================================
   * SELECT LOCATION
   * =======================================================
   */

  function selectLocation(
    location
  ) {
    setSelectedLocation(
      location
    );

    if (
      mapRef.current
    ) {
      mapRef.current.flyTo(
        [
          location.lat,
          location.lng,
        ],

        Math.max(
          mapRef.current.getZoom(),
          12
        ),

        {
          duration:
            0.7,
        }
      );
    }
  }

  /*
   * =======================================================
   * RESET FILTERS
   * =======================================================
   */

  function resetFilters() {
    setSearch("");
    setType("All");
    setStatus("All");
    setPermission("All");
    setEntity("All");
  }

  /*
   * =======================================================
   * OPEN ADD LOCATION
   * =======================================================
   */

  function openAddLocation() {
    setEditingLocation(
      null
    );

    setPendingCoordinates(
      null
    );

    setSaveError("");

    setEditorOpen(true);
  }

  /*
   * =======================================================
   * OPEN EDIT LOCATION
   * =======================================================
   */

  function openEditLocation(
    location
  ) {
    setEditingLocation({
      ...location,

      lat: String(
        location.lat
      ),

      lng: String(
        location.lng
      ),
    });

    setPendingCoordinates(
      null
    );

    setSaveError("");

    setEditorOpen(true);
  }

  /*
   * =======================================================
   * CLOSE EDITOR
   * =======================================================
   */

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditorOpen(
      false
    );

    setEditingLocation(
      null
    );

    setSaveError("");

    setPendingCoordinates(
      null
    );

    setPickCoordinates(
      false
    );
  }

  /*
   * =======================================================
   * PICK COORDINATES
   * =======================================================
   */

  function startCoordinatePicker() {
    /*
     * Close the modal so the map can receive
     * the click.
     */

    setEditorOpen(false);

    setSaveError("");

    setPickCoordinates(
      true
    );
  }

  /*
   * =======================================================
   * SAVE LOCATION
   * =======================================================
   */

  async function saveLocation(
    event
  ) {
    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const name =
      String(
        form.get("name") ||
          ""
      ).trim();

    const county =
      String(
        form.get("county") ||
          ""
      ).trim();

    const locationType =
      String(
        form.get("type") ||
          ""
      ).trim();

    const locationStatus =
      String(
        form.get("status") ||
          ""
      ).trim();

    const locationPermission =
      String(
        form.get(
          "permission"
        ) || ""
      ).trim();

    const locationEntity =
      String(
        form.get("entity") ||
          ""
      ).trim();

    const details =
      String(
        form.get("details") ||
          ""
      ).trim();

    const lat =
      Number(
        form.get("lat")
      );

    const lng =
      Number(
        form.get("lng")
      );

    /*
     * Validation.
     */

    if (!name) {
      setSaveError(
        "Location name is required."
      );

      return;
    }

    if (
      !Number.isFinite(
        lat
      ) ||
      lat < -90 ||
      lat > 90
    ) {
      setSaveError(
        "Enter a valid latitude."
      );

      return;
    }

    if (
      !Number.isFinite(
        lng
      ) ||
      lng < -180 ||
      lng > 180
    ) {
      setSaveError(
        "Enter a valid longitude."
      );

      return;
    }

    setSaving(true);

    setSaveError("");

    const locationData = {
      name,

      county:
        county ||
        "Unknown County",

      type:
        locationType ||
        "Other",

      status:
        locationStatus ||
        "Unknown",

      permission:
        locationPermission ||
        "Unknown",

      entity:
        locationEntity ||
        "Unknown",

      details:
        details ||
        "No details recorded.",

      lat,

      lng,
    };

    try {
      /*
       * EDIT EXISTING LOCATION
       */

      if (editingLocation) {
        await updateDoc(
          doc(
            oldMapDb,
            "locations",
            editingLocation.id
          ),

          {
            ...locationData,

            updatedAt:
              serverTimestamp(),
          }
        );

        /*
         * Update selected panel immediately.
         */

        setSelectedLocation(
          (current) => {
            if (
              !current ||
              current.id !==
                editingLocation.id
            ) {
              return current;
            }

            return {
              ...current,

              ...locationData,
            };
          }
        );
      }

      /*
       * CREATE NEW LOCATION
       */

      else {
        const newLocation =
          await addDoc(
            collection(
              oldMapDb,
              "locations"
            ),

            {
              ...locationData,

              archived:
                false,

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );

        /*
         * Select the new record.
         *
         * Firestore onSnapshot will subsequently
         * provide the complete record.
         */

        setSelectedLocation({
          id: newLocation.id,

          ...locationData,

          archived:
            false,
        });
      }

      setEditorOpen(
        false
      );

      setEditingLocation(
        null
      );

      setPendingCoordinates(
        null
      );
    } catch (
      firebaseError
    ) {
      console.error(
        "Unable to save location:",
        firebaseError
      );

      setSaveError(
        "Unable to save this location. Check your Firestore permissions."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * ARCHIVE LOCATION
   * =======================================================
   */

  async function archiveLocation(
    location
  ) {
    const confirmed =
      window.confirm(
        `Archive "${location.name}"?\n\n` +
          "This will remove it from the normal map and list, " +
          "but will NOT permanently delete the record."
      );

    if (!confirmed) {
      return;
    }

    try {
      await updateDoc(
        doc(
          oldMapDb,
          "locations",
          location.id
        ),

        {
          archived: true,

          archivedAt:
            serverTimestamp(),

          status: "Closed",

          updatedAt:
            serverTimestamp(),
        }
      );

      setSelectedLocation(
        null
      );
    } catch (
      firebaseError
    ) {
      console.error(
        "Unable to archive location:",
        firebaseError
      );

      setError(
        "Unable to archive this location. Check your Firestore permissions."
      );
    }
  }

  /*
   * =======================================================
   * RESTORE LOCATION
   * =======================================================
   */

  async function restoreLocation(
    location
  ) {
    try {
      await updateDoc(
        doc(
          oldMapDb,
          "locations",
          location.id
        ),

        {
          archived: false,

          archivedAt: null,

          updatedAt:
            serverTimestamp(),
        }
      );

      setSelectedLocation({
        ...location,

        archived: false,
      });
    } catch (
      firebaseError
    ) {
      console.error(
        "Unable to restore location:",
        firebaseError
      );

      setError(
        "Unable to restore this location."
      );
    }
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div className="nh-page nh-map-page">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="nh-page-header">

        <div>

          <div className="nh-eyebrow">
            NEW HORIZON GEOGRAPHIC DATABASE
          </div>

          <h1>
            Hauntings Map
          </h1>

          <p>
            Geographic record of reported
            hauntings, investigation locations,
            and case activity.
          </p>

        </div>

        <div className="nh-map-header-actions">

          <button
            className="nh-map-add-button"
            onClick={
              openAddLocation
            }
          >
            + Add Location
          </button>

          <div className="nh-map-view-toggle">

            <button
              className={
                view === "map"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("map")
              }
            >
              Map
            </button>

            <button
              className={
                view === "list"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setView("list")
              }
            >
              List
            </button>

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* COORDINATE PICKER NOTICE */}
      {/* ================================================= */}

      {pickCoordinates && (
        <div className="nh-map-picker-notice">

          <strong>
            LOCATION PICKER ACTIVE
          </strong>

          <span>
            Click anywhere on the map to set
            the new location coordinates.
          </span>

          <button
            onClick={() =>
              setPickCoordinates(
                false
              )
            }
          >
            Cancel
          </button>

        </div>
      )}

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="nh-map-error">

          <strong>
            DATABASE CONNECTION ERROR
          </strong>

          <span>
            {error}
          </span>

        </div>
      )}

      {/* ================================================= */}
      {/* CONTROLS */}
      {/* ================================================= */}

      <div className="nh-map-controls">

        <div className="nh-map-search">

          <span>
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search location, county, type, entity..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <select
          value={type}
          onChange={(e) =>
            setType(
              e.target.value
            )
          }
        >
          {LOCATION_TYPES.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Location Types"
                  : item}
              </option>
            )
          )}
        </select>

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          {STATUSES.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Statuses"
                  : item}
              </option>
            )
          )}
        </select>

        <select
          value={permission}
          onChange={(e) =>
            setPermission(
              e.target.value
            )
          }
        >
          {PERMISSIONS.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Permissions"
                  : item}
              </option>
            )
          )}
        </select>

        <select
          value={entity}
          onChange={(e) =>
            setEntity(
              e.target.value
            )
          }
        >
          {ENTITIES.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Entities"
                  : item}
              </option>
            )
          )}
        </select>

        <label className="nh-map-archive-toggle">

          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) =>
              setShowArchived(
                e.target.checked
              )
            }
          />

          <span>
            Include Archived
          </span>

        </label>

        <button
          className="nh-map-reset"
          onClick={
            resetFilters
          }
        >
          Reset
        </button>

      </div>

      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      <div className="nh-map-stats">

        <div>

          <span>
            VISIBLE LOCATIONS
          </span>

          <strong>
            {loading
              ? "—"
              : filteredLocations.length}
          </strong>

        </div>

        <div>

          <span>
            ACTIVE
          </span>

          <strong>
            {loading
              ? "—"
              : activeCount}
          </strong>

        </div>

        <div>

          <span>
            CLOSED
          </span>

          <strong>
            {loading
              ? "—"
              : closedCount}
          </strong>

        </div>

        <div>

          <span>
            ARCHIVED
          </span>

          <strong>
            {loading
              ? "—"
              : archivedCount}
          </strong>

        </div>

      </div>

      {/* ================================================= */}
      {/* LOADING */}
      {/* ================================================= */}

      {loading ? (

        <div className="nh-map-loading">

          <div className="nh-eyebrow">
            NHIS DATABASE
          </div>

          <h2>
            Loading location records...
          </h2>

          <p>
            Connecting to the existing
            Oklahoma Investigation Map
            database.
          </p>

        </div>

      ) : view === "map" ? (

        /* =================================================
           MAP VIEW
        ================================================= */

        <div className="nh-map-layout">

          <div className="nh-map-canvas">

            <div
              ref={
                mapContainerRef
              }
              className="nh-leaflet-map"
            />

            <div className="nh-map-overlay">

              <div className="nh-map-overlay-title">
                MAP VIEW
              </div>

              <div>
                NHIS LOCATION DATABASE
              </div>

            </div>

            <div className="nh-map-legend">

              <div className="nh-map-legend-title">
                LEGEND
              </div>

              <div>
                <span className="legend-dot investigation"></span>
                Active / Investigation
              </div>

              <div>
                <span className="legend-dot reported"></span>
                Reported Location
              </div>

              <div>
                <span className="legend-dot case"></span>
                Other / Special Case
              </div>

            </div>

          </div>

        </div>

      ) : (

        /* =================================================
           LIST VIEW
        ================================================= */

        <div className="nh-map-list-view">

          <div className="nh-map-table">

            <div className="nh-map-table-header">

              <span>
                LOCATION
              </span>

              <span>
                TYPE
              </span>

              <span>
                COUNTY
              </span>

              <span>
                ENTITY
              </span>

              <span>
                STATUS
              </span>

            </div>

            {filteredLocations.map(
              (location) => (

                <button
                  key={
                    location.id
                  }
                  className={`nh-map-table-row ${
                    location.archived
                      ? "archived"
                      : ""
                  }`}
                  onClick={() =>
                    selectLocation(
                      location
                    )
                  }
                >

                  <div>

                    <strong>
                      {location.name}
                    </strong>

                    <small>
                      {location.id}
                    </small>

                  </div>

                  <span>
                    {location.type}
                  </span>

                  <span>
                    {location.county}
                  </span>

                  <span>
                    {location.entity}
                  </span>

                  <span className="nh-map-status">

                    {location.archived
                      ? "Archived"
                      : location.status}

                  </span>

                </button>

              )
            )}

            {filteredLocations.length ===
              0 && (

              <div className="nh-map-empty">

                No locations match
                the current filters.

              </div>

            )}

          </div>

        </div>

      )}

      {/* ================================================= */}
      {/* LOCATION DETAIL PANEL */}
      {/* ================================================= */}

      {selectedLocation && (

        <div className="nh-location-panel">

          <div className="nh-location-panel-header">

            <div>

              <div className="nh-eyebrow">

                {selectedLocation.id}

                {selectedLocation.archived &&
                  " · ARCHIVED"}

              </div>

              <h2>
                {selectedLocation.name}
              </h2>

            </div>

            <button
              className="nh-location-close"
              onClick={() =>
                setSelectedLocation(
                  null
                )
              }
            >
              ×
            </button>

          </div>

          <div className="nh-location-panel-grid">

            <div>

              <span>
                LOCATION TYPE
              </span>

              <strong>
                {selectedLocation.type}
              </strong>

            </div>

            <div>

              <span>
                STATUS
              </span>

              <strong>
                {selectedLocation.status}
              </strong>

            </div>

            <div>

              <span>
                COUNTY
              </span>

              <strong>
                {selectedLocation.county}
              </strong>

            </div>

            <div>

              <span>
                PERMISSION
              </span>

              <strong>
                {selectedLocation.permission}
              </strong>

            </div>

            <div>

              <span>
                ENTITY
              </span>

              <strong>
                {selectedLocation.entity}
              </strong>

            </div>

            <div>

              <span>
                REGION
              </span>

              <strong>
                {getRegion(
                  selectedLocation
                )}
              </strong>

            </div>

            <div>

              <span>
                LATITUDE
              </span>

              <strong>
                {selectedLocation.lat}
              </strong>

            </div>

            <div>

              <span>
                LONGITUDE
              </span>

              <strong>
                {selectedLocation.lng}
              </strong>

            </div>

          </div>

          <div className="nh-location-panel-details">

            <span>
              DETAILS
            </span>

            <p>
              {selectedLocation.details}
            </p>

          </div>

          <div className="nh-location-panel-actions">

            <button
              onClick={() => {

                if (
                  mapRef.current
                ) {

                  mapRef.current.flyTo(
                    [
                      selectedLocation.lat,
                      selectedLocation.lng,
                    ],

                    16,

                    {
                      duration:
                        0.7,
                    }
                  );

                }

                setView(
                  "map"
                );

              }}
            >
              View On Map →
            </button>

            <button
              onClick={() =>
                openEditLocation(
                  selectedLocation
                )
              }
            >
              Edit Location
            </button>

            {selectedLocation.archived ? (

              <button
                onClick={() =>
                  restoreLocation(
                    selectedLocation
                  )
                }
              >
                Restore Location
              </button>

            ) : (

              <button
                className="nh-danger-button"
                onClick={() =>
                  archiveLocation(
                    selectedLocation
                  )
                }
              >
                Archive Location
              </button>

            )}

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.lat},${selectedLocation.lng}`}
              target="_blank"
              rel="noreferrer"
              className="nh-map-external-link"
            >
              Open Coordinates →
            </a>

          </div>

        </div>

      )}

      {/* ================================================= */}
      {/* ADD / EDIT LOCATION MODAL */}
      {/* ================================================= */}

      {editorOpen && (

        <div className="nh-location-modal-backdrop">

          <div className="nh-location-modal">

            <div className="nh-location-modal-header">

              <div>

                <div className="nh-eyebrow">
                  NEW HORIZON GEOGRAPHIC DATABASE
                </div>

                <h2>
                  {editingLocation
                    ? "Edit Location"
                    : "Add Location"}
                </h2>

                <p>
                  {editingLocation
                    ? "Update the location record."
                    : "Create a new location record."}
                </p>

              </div>

              <button
                className="nh-location-close"
                onClick={
                  closeEditor
                }
              >
                ×
              </button>

            </div>

            <form
              className="nh-location-form"
              onSubmit={
                saveLocation
              }
            >

              <div className="nh-form-grid">

                <label>

                  <span>
                    LOCATION NAME *
                  </span>

                  <input
                    name="name"
                    defaultValue={
                      editingLocation?.name ||
                      ""
                    }
                    placeholder="Location name"
                    required
                  />

                </label>

                <label>

                  <span>
                    COUNTY
                  </span>

                  <input
                    name="county"
                    defaultValue={
                      editingLocation?.county ||
                      ""
                    }
                    placeholder="Example: Tulsa County"
                  />

                </label>

                <label>

                  <span>
                    LOCATION TYPE
                  </span>

                  <select
                    name="type"
                    defaultValue={
                      editingLocation?.type ||
                      "Other"
                    }
                  >

                    {LOCATION_TYPES
                      .filter(
                        (item) =>
                          item !==
                          "All"
                      )
                      .map(
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

                </label>

                <label>

                  <span>
                    STATUS
                  </span>

                  <select
                    name="status"
                    defaultValue={
                      editingLocation?.status ||
                      "Unknown"
                    }
                  >

                    {STATUSES
                      .filter(
                        (item) =>
                          item !==
                          "All"
                      )
                      .map(
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

                </label>

                <label>

                  <span>
                    PERMISSION
                  </span>

                  <select
                    name="permission"
                    defaultValue={
                      editingLocation?.permission ||
                      "Unknown"
                    }
                  >

                    {PERMISSIONS
                      .filter(
                        (item) =>
                          item !==
                          "All"
                      )
                      .map(
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

                </label>

                <label>

                  <span>
                    ENTITY
                  </span>

                  <select
                    name="entity"
                    defaultValue={
                      editingLocation?.entity ||
                      "Unknown"
                    }
                  >

                    {ENTITIES
                      .filter(
                        (item) =>
                          item !==
                          "All"
                      )
                      .map(
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

                </label>

              </div>

              <label>

                <span>
                  DETAILS
                </span>

                <textarea
                  name="details"
                  defaultValue={
                    editingLocation?.details ||
                    ""
                  }
                  placeholder="Historical information, reported activity, investigation notes, etc."
                  rows="5"
                />

              </label>

              <div className="nh-location-coordinate-header">

                <div>

                  <span>
                    COORDINATES
                  </span>

                  <small>
                    Required for the map marker.
                  </small>

                </div>

                {view === "map" && (

                  <button
                    type="button"
                    onClick={
                      startCoordinatePicker
                    }
                  >
                    Pick From Map
                  </button>

                )}

              </div>

              <div className="nh-form-grid coordinates">

                <label>

                  <span>
                    LATITUDE *
                  </span>

                  <input
                    name="lat"
                    type="number"
                    step="any"
                    defaultValue={
                      pendingCoordinates
                        ? pendingCoordinates.lat
                        : editingLocation?.lat ||
                          ""
                    }
                    placeholder="35.4676"
                    required
                  />

                </label>

                <label>

                  <span>
                    LONGITUDE *
                  </span>

                  <input
                    name="lng"
                    type="number"
                    step="any"
                    defaultValue={
                      pendingCoordinates
                        ? pendingCoordinates.lng
                        : editingLocation?.lng ||
                          ""
                    }
                    placeholder="-97.5164"
                    required
                  />

                </label>

              </div>

              {pendingCoordinates && (

                <div className="nh-map-coordinate-success">

                  Coordinates selected from map:

                  <strong>
                    {pendingCoordinates.lat},{" "}
                    {pendingCoordinates.lng}
                  </strong>

                </div>

              )}

              {saveError && (

                <div className="nh-map-error">

                  <strong>
                    SAVE ERROR
                  </strong>

                  <span>
                    {saveError}
                  </span>

                </div>

              )}

              <div className="nh-location-modal-actions">

                <button
                  type="button"
                  onClick={
                    closeEditor
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="nh-map-add-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingLocation
                      ? "Save Changes"
                      : "Create Location"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}