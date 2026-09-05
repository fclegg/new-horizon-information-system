import { useEffect, useMemo, useState } from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase/config";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(
    new Date()
  );

  const [investigations, setInvestigations] = useState([]);
  const [cases, setCases] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD INVESTIGATIONS
   * =========================================================
   *
   * Calendar dates come from the top-level
   * "investigations" collection.
   *
   * Each investigation has its own scheduled date.
   *
   * onSnapshot keeps the calendar live.
   */

  useEffect(() => {
    const investigationsRef = collection(
      db,
      "investigations"
    );

    const investigationsQuery = query(
      investigationsRef,
      orderBy("date")
    );

    const unsubscribe = onSnapshot(
      investigationsQuery,
      (snapshot) => {
        const investigationRecords = [];

        snapshot.forEach((doc) => {
          const investigation = doc.data();

          /*
           * Ignore investigations that do not have
           * a scheduled date.
           */
          if (!investigation.date) {
            return;
          }

          investigationRecords.push({
            firestoreId: doc.id,
            ...investigation,
          });
        });

        setInvestigations(investigationRecords);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error(
          "Error loading investigations:",
          err
        );

        setError(
          "Unable to load investigations from the database."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * =========================================================
   * LOAD CASES
   * =========================================================
   *
   * Cases are NOT used for investigation dates.
   *
   * They are only loaded so the calendar can resolve:
   *
   * investigation
   *      ↓
   * caseFirestoreId / caseId
   *      ↓
   * case
   *      ↓
   * location
   *
   * This keeps the case as the source of truth for
   * property/location information.
   */

  useEffect(() => {
    const casesRef = collection(db, "cases");

    const unsubscribe = onSnapshot(
      casesRef,
      (snapshot) => {
        const caseRecords = [];

        snapshot.forEach((doc) => {
          const caseData = doc.data();

          caseRecords.push({
            firestoreId: doc.id,
            ...caseData,
          });
        });

        setCases(caseRecords);
      },
      (err) => {
        console.error(
          "Error loading cases:",
          err
        );

        setError(
          "Unable to load cases from the database."
        );
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * =========================================================
   * BUILD CALENDAR EVENTS
   * =========================================================
   *
   * This converts investigation records into the event
   * structure used by the Calendar UI.
   */

  const events = useMemo(() => {
    return investigations.map((investigation) => {
      /*
       * -------------------------------------------------------
       * RESOLVE PARENT CASE
       * -------------------------------------------------------
       *
       * Investigation Detail already supports both:
       *
       * caseFirestoreId
       * caseId
       *
       * We do the same here.
       */

      const parentCaseId =
        investigation.caseFirestoreId ||
        investigation.caseId ||
        null;

      const parentCase = cases.find(
        (caseItem) =>
          caseItem.firestoreId === parentCaseId ||
          caseItem.id === parentCaseId
      );

      /*
       * -------------------------------------------------------
       * INVESTIGATION NUMBER
       * -------------------------------------------------------
       *
       * Prefer the official investigation number.
       *
       * Expected format:
       *
       * INV-YYYY-####-##
       */

      const investigationNumber =
        investigation.investigationNumber ||
        investigation.id ||
        investigation.firestoreId;

      /*
       * -------------------------------------------------------
       * CASE NUMBER
       * -------------------------------------------------------
       */

      const caseNumber =
        parentCase?.caseNumber ||
        parentCase?.id ||
        parentCaseId ||
        "Unknown Case";

      /*
       * -------------------------------------------------------
       * LOCATION
       * -------------------------------------------------------
       *
       * Location belongs to the CASE.
       *
       * We do NOT expect investigation.location.
       */

      const locationParts = [
        parentCase?.locationName,
        parentCase?.address,
        parentCase?.city,
        parentCase?.state,
      ].filter(Boolean);

      const location =
        locationParts.length > 0
          ? locationParts.join(", ")
          : "Location not specified";

      /*
       * -------------------------------------------------------
       * TIME
       * -------------------------------------------------------
       */

      let time = "Scheduled";

      if (
        investigation.startTime &&
        investigation.endTime
      ) {
        time =
          investigation.startTime +
          " — " +
          investigation.endTime;
      } else if (investigation.startTime) {
        time = investigation.startTime;
      } else if (investigation.endTime) {
        time = investigation.endTime;
      }

      /*
       * -------------------------------------------------------
       * DESCRIPTION
       * -------------------------------------------------------
       */

      const description =
        investigation.debrief ||
        investigation.notes ||
        `Scheduled investigation ${investigationNumber}.`;

      /*
       * -------------------------------------------------------
       * RETURN CALENDAR EVENT
       * -------------------------------------------------------
       */

      return {
        id: investigation.firestoreId,

        investigationId: investigationNumber,

        caseId: caseNumber,

        date: investigation.date,

        title: `Investigation — ${investigationNumber}`,

        time,

        type: "Investigation",

        location,

        description,

        /*
         * Keep the original Firestore relationship available
         * in case the UI needs it later.
         */
        caseFirestoreId: parentCaseId,

        /*
         * Keep original investigation data available.
         */
        investigation,
        parentCase,
      };
    });
  }, [investigations, cases]);

  /*
   * =========================================================
   * MONTH INFORMATION
   * =========================================================
   */

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString(
    "default",
    {
      month: "long",
    }
  );

  /*
   * =========================================================
   * NUMBER OF DAYS IN CURRENT MONTH
   * =========================================================
   */

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  /*
   * =========================================================
   * DAY MONTH STARTS ON
   * =========================================================
   */

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  /*
   * =========================================================
   * CREATE CALENDAR CELLS
   * =========================================================
   */

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  /*
   * =========================================================
   * NAVIGATE MONTHS
   * =========================================================
   */

  const previousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  /*
   * =========================================================
   * FIND EVENTS FOR DAY
   * =========================================================
   */

  const getEventsForDay = (day) => {
    if (!day) {
      return [];
    }

    const dateString = `${year}-${String(
      month + 1
    ).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;

    return events.filter(
      (event) => event.date === dateString
    );
  };

  /*
   * =========================================================
   * UPCOMING INVESTIGATIONS
   * =========================================================
   */

  const upcomingEvents = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return [...events]
      .filter((event) => {
        if (!event.date) {
          return false;
        }

        const eventDate = new Date(
          `${event.date}T12:00:00`
        );

        return eventDate >= today;
      })
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      )
      .slice(0, 5);
  }, [events]);

  /*
   * =========================================================
   * EVENT TYPE CLASS
   * =========================================================
   */

  const getEventClass = (type) => {
    return `nh-calendar-event-${type.toLowerCase()}`;
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="nh-page nh-calendar-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="nh-page-header">

        <div>
          <div className="nh-command-label">
            OPERATIONS
          </div>

          <h1 className="nh-page-title">
            Calendar
          </h1>

          <p className="nh-page-subtitle">
            Scheduled investigations and operational activity.
          </p>
        </div>

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
          CALENDAR LAYOUT
          ===================================================== */}

      <div className="nh-calendar-layout">

        {/* ===================================================
            MAIN CALENDAR
            =================================================== */}

        <section className="nh-card nh-calendar-card">

          <div className="nh-calendar-toolbar">

            <div className="nh-calendar-navigation">

              <button
                className="nh-calendar-nav-button"
                onClick={previousMonth}
              >
                ←
              </button>

              <h2 className="nh-calendar-month">
                {monthName} {year}
              </h2>

              <button
                className="nh-calendar-nav-button"
                onClick={nextMonth}
              >
                →
              </button>

            </div>

            <button
              className="nh-calendar-today"
              onClick={goToToday}
            >
              Today
            </button>

          </div>


          {/* =================================================
              CALENDAR LEGEND
              ================================================= */}

          <div className="nh-calendar-legend">

            <span>
              <i className="nh-legend-dot nh-legend-investigation"></i>
              Investigation
            </span>

          </div>


          {/* =================================================
              WEEKDAYS
              ================================================= */}

          <div className="nh-calendar-weekdays">

            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (
              <div key={day}>
                {day}
              </div>
            ))}

          </div>


          {/* =================================================
              CALENDAR DAYS
              ================================================= */}

          <div className="nh-calendar-grid">

            {calendarDays.map((day, index) => {

              const dayEvents =
                getEventsForDay(day);

              return (
                <div
                  key={index}
                  className={`nh-calendar-day ${
                    day
                      ? ""
                      : "nh-calendar-day-empty"
                  }`}
                >

                  {day && (
                    <>
                      <div className="nh-calendar-day-number">
                        {day}
                      </div>

                      <div className="nh-calendar-day-events">

                        {loading ? (
                          <></>
                        ) : (
                          dayEvents.map(
                            (event) => (
                              <button
                                key={event.id}
                                className={`nh-calendar-event ${getEventClass(
                                  event.type
                                )}`}
                                onClick={() =>
                                  setSelectedEvent(
                                    event
                                  )
                                }
                              >
                                <span>
                                  {event.title}
                                </span>
                              </button>
                            )
                          )
                        )}

                      </div>
                    </>
                  )}

                </div>
              );
            })}

          </div>

        </section>


        {/* ===================================================
            RIGHT SIDEBAR
            =================================================== */}

        <aside className="nh-calendar-sidebar">

          {/* =================================================
              UPCOMING INVESTIGATIONS
              ================================================= */}

          <div className="nh-card nh-upcoming-card">

            <div className="nh-calendar-panel-header">

              <div>
                <div className="nh-command-label">
                  SCHEDULE
                </div>

                <h2>
                  Upcoming Investigations
                </h2>
              </div>

            </div>


            <div className="nh-upcoming-list">

              {loading ? (

                <div className="nh-event-empty">
                  Loading schedule...
                </div>

              ) : upcomingEvents.length === 0 ? (

                <div className="nh-event-empty">
                  No investigations currently scheduled.
                </div>

              ) : (

                upcomingEvents.map(
                  (event) => {

                    const eventDate =
                      new Date(
                        `${event.date}T12:00:00`
                      );

                    return (
                      <button
                        key={event.id}
                        className="nh-upcoming-event"
                        onClick={() =>
                          setSelectedEvent(
                            event
                          )
                        }
                      >

                        <div className="nh-upcoming-date">

                          <strong>
                            {eventDate.getDate()}
                          </strong>

                          <span>
                            {eventDate
                              .toLocaleString(
                                "default",
                                {
                                  month: "short",
                                }
                              )
                              .toUpperCase()}
                          </span>

                        </div>

                        <div className="nh-upcoming-info">

                          <div className="nh-upcoming-title">
                            {event.title}
                          </div>

                          <div className="nh-upcoming-time">
                            {event.time}
                          </div>

                        </div>

                      </button>
                    );
                  }
                )

              )}

            </div>

          </div>


          {/* =================================================
              INVESTIGATION DETAILS
              ================================================= */}

          <div className="nh-card nh-event-details">

            <div className="nh-command-label">
              INVESTIGATION DETAILS
            </div>

            {selectedEvent ? (

              <>
                <h2>
                  {selectedEvent.title}
                </h2>

                <div
                  className={`nh-event-type ${getEventClass(
                    selectedEvent.type
                  )}`}
                >
                  {selectedEvent.type}
                </div>


                {/* Investigation */}

                <div className="nh-event-detail-row">

                  <span>
                    Investigation
                  </span>

                  <strong>
                    {selectedEvent.investigationId}
                  </strong>

                </div>


                {/* Case */}

                <div className="nh-event-detail-row">

                  <span>
                    Case
                  </span>

                  <strong>
                    {selectedEvent.caseId}
                  </strong>

                </div>


                {/* Date */}

                <div className="nh-event-detail-row">

                  <span>
                    Date
                  </span>

                  <strong>
                    {selectedEvent.date}
                  </strong>

                </div>


                {/* Time */}

                <div className="nh-event-detail-row">

                  <span>
                    Time
                  </span>

                  <strong>
                    {selectedEvent.time}
                  </strong>

                </div>


                {/* Location */}

                <div className="nh-event-detail-row">

                  <span>
                    Location
                  </span>

                  <strong>
                    {selectedEvent.location}
                  </strong>

                </div>


                {/* Description */}

                <div className="nh-event-description">
                  {selectedEvent.description}
                </div>

              </>

            ) : (

              <div className="nh-event-empty">
                Select an investigation to view its details.
              </div>

            )}

          </div>

        </aside>

      </div>

    </div>
  );
}

export default Calendar;