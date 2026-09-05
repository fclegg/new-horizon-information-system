import { useEffect, useMemo, useState } from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase/config";

function Dashboard() {
  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [cases, setCases] = useState([]);
  const [investigations, setInvestigations] = useState([]);

  const [casesLoading, setCasesLoading] = useState(true);
  const [investigationsLoading, setInvestigationsLoading] =
    useState(true);

  const [casesError, setCasesError] = useState("");
  const [investigationsError, setInvestigationsError] =
    useState("");


  /*
   * =========================================================
   * FIRESTORE — CASES
   * =========================================================
   *
   * Cases are the source of truth for:
   *
   * - Active Cases
   * - Case names
   * - Case numbers
   * - Case locations
   * - Case creation/update activity
   *
   * onSnapshot keeps the Dashboard live.
   */

  useEffect(() => {
    const casesRef = collection(db, "cases");

    const unsubscribe = onSnapshot(
      casesRef,
      (snapshot) => {
        const caseRecords = [];

        snapshot.forEach((doc) => {
          caseRecords.push({
            firestoreId: doc.id,
            ...doc.data(),
          });
        });

        setCases(caseRecords);
        setCasesLoading(false);
        setCasesError("");
      },
      (err) => {
        console.error(
          "Error loading dashboard cases:",
          err
        );

        setCasesError(
          "Unable to load case data."
        );

        setCasesLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  /*
   * =========================================================
   * FIRESTORE — INVESTIGATIONS
   * =========================================================
   *
   * Investigations are the source of truth for:
   *
   * - Scheduled investigations
   * - Completed investigations
   * - Upcoming investigation dates
   * - Investigation creation/update activity
   *
   * onSnapshot keeps the Dashboard live.
   */

  useEffect(() => {
    const investigationsRef = collection(
      db,
      "investigations"
    );

    const unsubscribe = onSnapshot(
      investigationsRef,
      (snapshot) => {
        const investigationRecords = [];

        snapshot.forEach((doc) => {
          investigationRecords.push({
            firestoreId: doc.id,
            ...doc.data(),
          });
        });

        setInvestigations(investigationRecords);
        setInvestigationsLoading(false);
        setInvestigationsError("");
      },
      (err) => {
        console.error(
          "Error loading dashboard investigations:",
          err
        );

        setInvestigationsError(
          "Unable to load investigation data."
        );

        setInvestigationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  const loading =
    casesLoading ||
    investigationsLoading;


  /*
   * =========================================================
   * CASE STATUS
   * =========================================================
   *
   * A case is considered active when its status is one of
   * the active/open investigation states.
   */

  const isCaseActive = (caseItem) => {
    const status = String(
      caseItem.status || ""
    ).toLowerCase();

    return (
      status === "active" ||
      status === "open" ||
      status === "in progress" ||
      status === "investigating"
    );
  };


  /*
   * =========================================================
   * INVESTIGATION STATUS
   * =========================================================
   */

  const isInvestigationCompleted = (
    investigation
  ) => {
    const status = String(
      investigation.status || ""
    ).toLowerCase();

    return (
      status === "completed" ||
      status === "complete" ||
      status === "closed"
    );
  };


  /*
   * =========================================================
   * INVESTIGATION SCHEDULED
   * =========================================================
   *
   * An investigation with a date and which has not been
   * completed is treated as scheduled.
   *
   * Explicit scheduled/planned/pending statuses are also
   * supported.
   */

  const isInvestigationScheduled = (
    investigation
  ) => {
    const status = String(
      investigation.status || ""
    ).toLowerCase();

    if (
      investigation.date &&
      !isInvestigationCompleted(investigation)
    ) {
      return true;
    }

    return (
      status === "scheduled" ||
      status === "planned" ||
      status === "pending"
    );
  };


  /*
   * =========================================================
   * ACTIVE CASE COUNT
   * =========================================================
   */

  const activeCaseCount = useMemo(() => {
    return cases.filter(isCaseActive).length;
  }, [cases]);


  /*
   * =========================================================
   * SCHEDULED INVESTIGATION COUNT
   * =========================================================
   */

  const scheduledInvestigationCount =
    useMemo(() => {
      return investigations.filter(
        isInvestigationScheduled
      ).length;
    }, [investigations]);


  /*
   * =========================================================
   * COMPLETED INVESTIGATION COUNT
   * =========================================================
   */

  const completedInvestigationCount =
    useMemo(() => {
      return investigations.filter(
        isInvestigationCompleted
      ).length;
    }, [investigations]);


  /*
   * =========================================================
   * DASHBOARD STATISTICS
   * =========================================================
   */

  const statistics = [
    {
      label: "Active Cases",
      value: String(
        activeCaseCount
      ).padStart(2, "0"),
    },
    {
      label: "Scheduled",
      value: String(
        scheduledInvestigationCount
      ).padStart(2, "0"),
    },
    {
      label: "Completed",
      value: String(
        completedInvestigationCount
      ).padStart(2, "0"),
    },
  ];


  /*
   * =========================================================
   * ACTIVE CASES
   * =========================================================
   *
   * IMPORTANT:
   *
   * This section displays CASES.
   *
   * A case can have multiple investigations, so we do NOT
   * loop through investigations here.
   *
   * Each Firestore case appears exactly once.
   */

  const activeCases = useMemo(() => {
    return cases
      .filter(isCaseActive)
      .slice(0, 5)
      .map((caseItem) => {
        const caseNumber =
          caseItem.caseNumber ||
          caseItem.id ||
          caseItem.firestoreId;

        const caseName =
          caseItem.caseName ||
          caseItem.name ||
          caseItem.title ||
          caseItem.locationName ||
          "Unnamed Case";

        const locationParts = [
          caseItem.locationName,
          caseItem.address,
          caseItem.city,
          caseItem.state,
        ].filter(Boolean);

        const location =
          locationParts.length > 0
            ? locationParts.join(", ")
            : "Location not specified";

        return {
          id: caseItem.firestoreId,
          caseNumber: caseNumber,
          name: caseName,
          location: location,
        };
      });
  }, [cases]);


  /*
   * =========================================================
   * UPCOMING EVENTS
   * =========================================================
   *
   * Upcoming events come directly from investigations.
   *
   * Cases do NOT provide investigation dates.
   */

  const upcomingEvents = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return investigations
      .filter((investigation) => {
        if (!investigation.date) {
          return false;
        }

        if (
          isInvestigationCompleted(
            investigation
          )
        ) {
          return false;
        }

        const eventDate = new Date(
          investigation.date +
            "T12:00:00"
        );

        if (
          Number.isNaN(
            eventDate.getTime()
          )
        ) {
          return false;
        }

        return eventDate >= today;
      })
      .sort((a, b) => {
        return String(a.date).localeCompare(
          String(b.date)
        );
      })
      .slice(0, 5)
      .map((investigation) => {
        const eventDate = new Date(
          investigation.date +
            "T12:00:00"
        );

        const investigationNumber =
          investigation.investigationNumber ||
          investigation.id ||
          investigation.firestoreId;

        let time = "Scheduled";

        if (
          investigation.startTime &&
          investigation.endTime
        ) {
          time =
            investigation.startTime +
            " — " +
            investigation.endTime;
        } else if (
          investigation.startTime
        ) {
          time =
            investigation.startTime;
        } else if (
          investigation.endTime
        ) {
          time =
            investigation.endTime;
        }

        return {
          id: investigation.firestoreId,

          date: String(
            eventDate.getDate()
          ).padStart(2, "0"),

          month: eventDate
            .toLocaleString(
              "default",
              {
                month: "short",
              }
            )
            .toUpperCase(),

          title:
            "Investigation — " +
            investigationNumber,

          time: time,
        };
      });
  }, [investigations]);


  /*
   * =========================================================
   * RECENT ACTIVITY
   * =========================================================
   *
   * Until NHIS has a dedicated audit/activity collection,
   * activity is derived from actual Firestore records.
   *
   * We use:
   *
   * - createdAt
   * - updatedAt
   *
   * rather than fake activity entries.
   */

  const recentActivity = useMemo(() => {
    const activity = [];


    /*
     * -------------------------------------------------------
     * CASE ACTIVITY
     * -------------------------------------------------------
     */

    cases.forEach((caseItem) => {
      const caseNumber =
        caseItem.caseNumber ||
        caseItem.id ||
        caseItem.firestoreId;

      const caseName =
        caseItem.caseName ||
        caseItem.name ||
        caseItem.title ||
        caseItem.locationName ||
        "Unnamed Case";

      if (caseItem.createdAt) {
        activity.push({
          id:
            caseItem.firestoreId +
            "-created",

          action:
            "New case created",

          details:
            caseNumber +
            " — " +
            caseName,

          timestamp:
            caseItem.createdAt,
        });
      }

      if (
        caseItem.updatedAt &&
        !caseItem.createdAt
      ) {
        activity.push({
          id:
            caseItem.firestoreId +
            "-updated",

          action:
            "Case updated",

          details:
            caseNumber +
            " — " +
            caseName,

          timestamp:
            caseItem.updatedAt,
        });
      }
    });


    /*
     * -------------------------------------------------------
     * INVESTIGATION ACTIVITY
     * -------------------------------------------------------
     */

    investigations.forEach(
      (investigation) => {
        const investigationNumber =
          investigation.investigationNumber ||
          investigation.id ||
          investigation.firestoreId;

        if (investigation.createdAt) {
          activity.push({
            id:
              investigation.firestoreId +
              "-created",

            action:
              "Investigation created",

            details:
              investigationNumber,

            timestamp:
              investigation.createdAt,
          });
        }

        if (
          investigation.updatedAt &&
          !investigation.createdAt
        ) {
          activity.push({
            id:
              investigation.firestoreId +
              "-updated",

            action:
              "Investigation updated",

            details:
              investigationNumber,

            timestamp:
              investigation.updatedAt,
          });
        }
      }
    );


    /*
     * -------------------------------------------------------
     * SORT NEWEST FIRST
     * -------------------------------------------------------
     */

    return activity
      .filter(
        (item) => item.timestamp
      )
      .sort((a, b) => {
        const dateA =
          a.timestamp &&
          typeof a.timestamp.toDate ===
            "function"
            ? a.timestamp.toDate()
            : new Date(
                a.timestamp
              );

        const dateB =
          b.timestamp &&
          typeof b.timestamp.toDate ===
            "function"
            ? b.timestamp.toDate()
            : new Date(
                b.timestamp
              );

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [cases, investigations]);


  /*
   * =========================================================
   * FORMAT ACTIVITY TIME
   * =========================================================
   */

  const formatActivityTime = (
    timestamp
  ) => {
    if (!timestamp) {
      return "";
    }

    const date =
      timestamp &&
      typeof timestamp.toDate ===
        "function"
        ? timestamp.toDate()
        : new Date(timestamp);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    const now = new Date();

    const isToday =
      date.toDateString() ===
      now.toDateString();

    const yesterday =
      new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const isYesterday =
      date.toDateString() ===
      yesterday.toDateString();

    const timeString =
      date.toLocaleTimeString(
        "default",
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );

    if (isToday) {
      return (
        "Today, " +
        timeString
      );
    }

    if (isYesterday) {
      return (
        "Yesterday, " +
        timeString
      );
    }

    return (
      date.toLocaleDateString(
        "default",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      ) +
      ", " +
      timeString
    );
  };


  /*
   * =========================================================
   * DATABASE STATUS
   * =========================================================
   */

  const databaseConnected =
    !casesError &&
    !investigationsError &&
    !casesLoading &&
    !investigationsLoading;


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="nh-page">

      {/* =====================================================
          COMMAND CENTER HEADER
          ===================================================== */}

      <div className="nh-command-header">

        <div className="nh-command-label">
          COMMAND CENTER
        </div>

        <h1 className="nh-command-title">
          Welcome, New Horizon Director
        </h1>

        <p className="nh-command-subtitle">
          Manage New Horizon investigations and personnel.
        </p>

      </div>


      {/* =====================================================
          DATABASE ERROR
          ===================================================== */}

      {(casesError ||
        investigationsError) && (
        <div className="nh-form-error">
          {casesError ||
            investigationsError}
        </div>
      )}


      {/* =====================================================
          STATISTICS
          ===================================================== */}

      <section className="nh-command-stats">

        {statistics.map((stat) => (
          <div
            className="nh-card nh-command-stat"
            key={stat.label}
          >

            <div className="nh-command-stat-label">
              {stat.label}
            </div>

            <div className="nh-command-stat-value">
              {loading
                ? "—"
                : stat.value}
            </div>

          </div>
        ))}

      </section>


      {/* =====================================================
          ACTIVE CASES
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <h2 className="nh-section-title">
            Active Cases
          </h2>

          <a
            href="/cases"
            className="nh-dashboard-link"
          >
            View Cases →
          </a>

        </div>


        <div className="nh-card nh-dashboard-list">

          {loading ? (

            <div className="nh-event-empty">
              Loading cases...
            </div>

          ) : activeCases.length === 0 ? (

            <div className="nh-event-empty">
              No active cases.
            </div>

          ) : (

            activeCases.map(
              (caseItem) => (
                <div
                  className="nh-list-item"
                  key={caseItem.id}
                >

                  <div>

                    <div className="nh-list-title">
                      {caseItem.name}
                    </div>

                    <div className="nh-list-meta">
                      {caseItem.caseNumber}
                      {" · "}
                      {caseItem.location}
                    </div>

                  </div>

                  <span className="nh-status nh-status-active">
                    Active
                  </span>

                </div>
              )
            )

          )}

        </div>

      </section>


      {/* =====================================================
          UPCOMING EVENTS
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <h2 className="nh-section-title">
            Upcoming Events
          </h2>

          <a
            href="/calendar"
            className="nh-dashboard-link"
          >
            Calendar →
          </a>

        </div>


        <div className="nh-card nh-dashboard-list">

          {loading ? (

            <div className="nh-event-empty">
              Loading schedule...
            </div>

          ) : upcomingEvents.length === 0 ? (

            <div className="nh-event-empty">
              No upcoming investigations scheduled.
            </div>

          ) : (

            upcomingEvents.map(
              (event) => (
                <div
                  className="nh-list-item"
                  key={event.id}
                >

                  <div className="nh-event-date">

                    <strong>
                      {event.date}
                    </strong>

                    <span>
                      {event.month}
                    </span>

                  </div>


                  <div className="nh-event-info">

                    <div className="nh-list-title">
                      {event.title}
                    </div>

                    <div className="nh-list-meta">
                      {event.time}
                    </div>

                  </div>

                </div>
              )
            )

          )}

        </div>

      </section>


      {/* =====================================================
          RECENT ACTIVITY
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <h2 className="nh-section-title">
            Recent Activity
          </h2>

        </div>


        <div className="nh-card nh-dashboard-list">

          {loading ? (

            <div className="nh-event-empty">
              Loading activity...
            </div>

          ) : recentActivity.length === 0 ? (

            <div className="nh-event-empty">
              No recent activity.
            </div>

          ) : (

            recentActivity.map(
              (activity) => (
                <div
                  className="nh-list-item"
                  key={activity.id}
                >

                  <div>

                    <div className="nh-list-title">
                      {activity.action}
                    </div>

                    <div className="nh-list-meta">
                      {activity.details}
                    </div>

                  </div>

                  <span className="nh-activity-time">
                    {formatActivityTime(
                      activity.timestamp
                    )}
                  </span>

                </div>
              )
            )

          )}

        </div>

      </section>


      {/* =====================================================
          SYSTEM STATUS
          ===================================================== */}

      <section className="nh-section">

        <div className="nh-section-header">

          <h2 className="nh-section-title">
            System Status
          </h2>

        </div>


        <div className="nh-card nh-system-card">

          {/* =================================================
              INFORMATION SYSTEM
              ================================================= */}

          <div className="nh-system-row">

            <div>

              <div className="nh-list-title">
                Information System
              </div>

              <div className="nh-list-meta">
                Core application
              </div>

            </div>

            <span className="nh-status nh-status-active">
              Online
            </span>

          </div>


          {/* =================================================
              DATABASE
              ================================================= */}

          <div className="nh-system-row">

            <div>

              <div className="nh-list-title">
                Database
              </div>

              <div className="nh-list-meta">
                Firebase connection
              </div>

            </div>

            <span
              className={
                databaseConnected
                  ? "nh-status nh-status-active"
                  : "nh-status nh-status-warning"
              }
            >
              {databaseConnected
                ? "Connected"
                : "Disconnected"}
            </span>

          </div>


          {/* =================================================
              AUTHORIZATION
              ================================================= */}

          <div className="nh-system-row">

            <div>

              <div className="nh-list-title">
                Authorization
              </div>

              <div className="nh-list-meta">
                Personnel access
              </div>

            </div>

            <span className="nh-status nh-status-active">
              Active
            </span>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;