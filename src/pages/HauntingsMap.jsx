import React, { useMemo, useState } from "react";

const locations = [
  {
    id: "LOC-001",
    name: "Example Residential Case",
    city: "Tulsa",
    county: "Tulsa County",
    type: "Residential",
    recordType: "Investigation",
    status: "Active Case",
    caseNumber: "CASE-001",
    coordinates: "36.1540, -95.9928",
  },
  {
    id: "LOC-002",
    name: "Example Cemetery",
    city: "Broken Arrow",
    county: "Tulsa County",
    type: "Cemetery",
    recordType: "Reported Haunting",
    status: "Reported",
    caseNumber: "N/A",
    coordinates: "36.0526, -95.7908",
  },
  {
    id: "LOC-003",
    name: "Example Commercial Location",
    city: "Oklahoma City",
    county: "Oklahoma County",
    type: "Commercial",
    recordType: "Investigation",
    status: "Closed Case",
    caseNumber: "CASE-004",
    coordinates: "35.4676, -97.5164",
  },
  {
    id: "LOC-004",
    name: "Example Lake",
    city: "Mounds",
    county: "Creek County",
    type: "Lake / Water",
    recordType: "Reported Haunting",
    status: "Reported",
    caseNumber: "N/A",
    coordinates: "35.8790, -96.0650",
  },
  {
    id: "LOC-005",
    name: "Example Park",
    city: "Tulsa",
    county: "Tulsa County",
    type: "Park",
    recordType: "Investigation",
    status: "Active Case",
    caseNumber: "CASE-007",
    coordinates: "36.1300, -95.9400",
  },
  {
    id: "LOC-006",
    name: "Example Historic Property",
    city: "Muskogee",
    county: "Muskogee County",
    type: "Historic Property",
    recordType: "Case Location",
    status: "Closed Case",
    caseNumber: "CASE-009",
    coordinates: "35.7479, -95.3697",
  },
];

const filters = {
  region: ["All Regions", "Tulsa Area", "Oklahoma City Area", "Eastern Oklahoma"],
  type: [
    "All Location Types",
    "Residential",
    "Commercial",
    "Cemetery",
    "Lake / Water",
    "Park",
    "Historic Property",
  ],
  record: [
    "All Records",
    "Investigation",
    "Reported Haunting",
    "Case Location",
  ],
  status: [
    "All Statuses",
    "Active Case",
    "Reported",
    "Closed Case",
  ],
};

function getRegion(location) {
  if (location.city === "Tulsa" || location.city === "Broken Arrow") {
    return "Tulsa Area";
  }

  if (location.city === "Oklahoma City") {
    return "Oklahoma City Area";
  }

  return "Eastern Oklahoma";
}

function markerClass(recordType) {
  if (recordType === "Reported Haunting") return "reported";
  if (recordType === "Case Location") return "case";
  return "investigation";
}

export default function HauntingsMap() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [type, setType] = useState("All Location Types");
  const [record, setRecord] = useState("All Records");
  const [status, setStatus] = useState("All Statuses");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [view, setView] = useState("map");

  const filteredLocations = useMemo(() => {
    const query = search.toLowerCase();

    return locations.filter((location) => {
      const matchesSearch =
        location.name.toLowerCase().includes(query) ||
        location.city.toLowerCase().includes(query) ||
        location.county.toLowerCase().includes(query) ||
        location.caseNumber.toLowerCase().includes(query);

      const matchesRegion =
        region === "All Regions" || getRegion(location) === region;

      const matchesType =
        type === "All Location Types" || location.type === type;

      const matchesRecord =
        record === "All Records" || location.recordType === record;

      const matchesStatus =
        status === "All Statuses" || location.status === status;

      return (
        matchesSearch &&
        matchesRegion &&
        matchesType &&
        matchesRecord &&
        matchesStatus
      );
    });
  }, [search, region, type, record, status]);

  return (
    <div className="nh-page nh-map-page">
      <div className="nh-page-header">
        <div>
          <div className="nh-eyebrow">NEW HORIZON GEOGRAPHIC DATABASE</div>
          <h1>Hauntings Map</h1>
          <p>
            Geographic record of reported hauntings, investigation locations,
            and case activity.
          </p>
        </div>

        <div className="nh-map-view-toggle">
          <button
            className={view === "map" ? "active" : ""}
            onClick={() => setView("map")}
          >
            Map
          </button>

          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>

      <div className="nh-map-controls">
        <div className="nh-map-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search location, city, county, or case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          {filters.region.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          {filters.type.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select value={record} onChange={(e) => setRecord(e.target.value)}>
          {filters.record.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {filters.status.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="nh-map-stats">
        <div>
          <span>VISIBLE LOCATIONS</span>
          <strong>{filteredLocations.length}</strong>
        </div>

        <div>
          <span>INVESTIGATIONS</span>
          <strong>
            {
              filteredLocations.filter(
                (item) => item.recordType === "Investigation"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>REPORTED HAUNTINGS</span>
          <strong>
            {
              filteredLocations.filter(
                (item) => item.recordType === "Reported Haunting"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>ACTIVE CASES</span>
          <strong>
            {
              filteredLocations.filter(
                (item) => item.status === "Active Case"
              ).length
            }
          </strong>
        </div>
      </div>

      {view === "map" ? (
        <div className="nh-map-layout">
          <div className="nh-map-canvas">
            <div className="nh-map-grid"></div>

            <div className="nh-map-label nh-map-label-one">TULSA</div>
            <div className="nh-map-label nh-map-label-two">OKLAHOMA CITY</div>
            <div className="nh-map-label nh-map-label-three">EASTERN OKLAHOMA</div>

            {filteredLocations.map((location, index) => (
              <button
                key={location.id}
                className={`nh-map-marker ${markerClass(
                  location.recordType
                )}`}
                style={{
                  left: `${18 + ((index * 17) % 67)}%`,
                  top: `${20 + ((index * 23) % 57)}%`,
                }}
                onClick={() => setSelectedLocation(location)}
                title={location.name}
              >
                <span></span>
              </button>
            ))}

            <div className="nh-map-overlay">
              <div className="nh-map-overlay-title">MAP VIEW</div>
              <div>NHIS LOCATION DATABASE</div>
            </div>

            <div className="nh-map-legend">
              <div className="nh-map-legend-title">LEGEND</div>

              <div>
                <span className="legend-dot investigation"></span>
                Investigation
              </div>

              <div>
                <span className="legend-dot reported"></span>
                Reported Haunting
              </div>

              <div>
                <span className="legend-dot case"></span>
                Case Location
              </div>
            </div>
          </div>

          <div className="nh-map-sidebar">
            <div className="nh-map-sidebar-header">
              <div>
                <div className="nh-eyebrow">LOCATION RECORDS</div>
                <h2>Locations</h2>
              </div>

              <span>{filteredLocations.length}</span>
            </div>

            <div className="nh-map-location-list">
              {filteredLocations.map((location) => (
                <button
                  key={location.id}
                  className={`nh-map-location ${
                    selectedLocation?.id === location.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedLocation(location)}
                >
                  <span
                    className={`nh-location-dot ${markerClass(
                      location.recordType
                    )}`}
                  ></span>

                  <span className="nh-location-info">
                    <strong>{location.name}</strong>
                    <small>
                      {location.city}, {location.county}
                    </small>
                    <small>{location.recordType}</small>
                  </span>

                  <span className="nh-location-arrow">→</span>
                </button>
              ))}

              {filteredLocations.length === 0 && (
                <div className="nh-map-empty">
                  No locations match the current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="nh-map-list-view">
          <div className="nh-map-table">
            <div className="nh-map-table-header">
              <span>LOCATION</span>
              <span>TYPE</span>
              <span>RECORD</span>
              <span>CASE</span>
              <span>STATUS</span>
            </div>

            {filteredLocations.map((location) => (
              <button
                key={location.id}
                className="nh-map-table-row"
                onClick={() => setSelectedLocation(location)}
              >
                <div>
                  <strong>{location.name}</strong>
                  <small>
                    {location.city}, {location.county}
                  </small>
                </div>

                <span>{location.type}</span>
                <span>{location.recordType}</span>
                <span>{location.caseNumber}</span>
                <span className="nh-map-status">{location.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="nh-location-panel">
          <div className="nh-location-panel-header">
            <div>
              <div className="nh-eyebrow">{selectedLocation.id}</div>
              <h2>{selectedLocation.name}</h2>
            </div>

            <button
              className="nh-location-close"
              onClick={() => setSelectedLocation(null)}
            >
              ×
            </button>
          </div>

          <div className="nh-location-panel-grid">
            <div>
              <span>LOCATION TYPE</span>
              <strong>{selectedLocation.type}</strong>
            </div>

            <div>
              <span>RECORD TYPE</span>
              <strong>{selectedLocation.recordType}</strong>
            </div>

            <div>
              <span>STATUS</span>
              <strong>{selectedLocation.status}</strong>
            </div>

            <div>
              <span>CASE</span>
              <strong>{selectedLocation.caseNumber}</strong>
            </div>

            <div>
              <span>CITY</span>
              <strong>{selectedLocation.city}</strong>
            </div>

            <div>
              <span>COUNTY</span>
              <strong>{selectedLocation.county}</strong>
            </div>

            <div>
              <span>COORDINATES</span>
              <strong>{selectedLocation.coordinates}</strong>
            </div>

            <div>
              <span>LOCATION ID</span>
              <strong>{selectedLocation.id}</strong>
            </div>
          </div>

          <div className="nh-location-panel-actions">
            <button>Open Location Record →</button>

            {selectedLocation.caseNumber !== "N/A" && (
              <button>Open Case →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}