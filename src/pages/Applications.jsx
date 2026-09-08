import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

import {
  useNavigate,
} from "react-router-dom";


function Applications() {

  const navigate = useNavigate();

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [isDirector, setIsDirector] =
    useState(false);

  const [applications, setApplications] =
    useState([]);

  const [error, setError] =
    useState("");


  /*
   * =========================================================
   * DIRECTOR ACCOUNT
   * =========================================================
   *
   * This account is currently hardcoded as the
   * New Horizon Director account.
   */

  const DIRECTOR_EMAIL =
    "newhorizonparanormal@gmail.com";


  /*
   * =========================================================
   * CHECK DIRECTOR ACCESS
   * =========================================================
   */

  useEffect(() => {

    let unsubscribeApplications = null;


    const checkDirectorAccess = () => {

      const user = auth.currentUser;


      /*
       * -------------------------------------------------------
       * NO USER
       * -------------------------------------------------------
       */

      if (!user) {

        setIsDirector(false);
        setCheckingAccess(false);

        navigate("/login", {
          replace: true,
        });

        return;
      }


      /*
       * -------------------------------------------------------
       * CHECK EMAIL
       * -------------------------------------------------------
       */

      const userEmail =
        user.email?.trim().toLowerCase();


      const director =
        userEmail ===
        DIRECTOR_EMAIL.toLowerCase();


      /*
       * -------------------------------------------------------
       * NOT A DIRECTOR
       * -------------------------------------------------------
       */

      if (!director) {

        console.warn(
          "Applications access denied for:",
          user.email
        );

        setIsDirector(false);
        setCheckingAccess(false);

        navigate("/", {
          replace: true,
        });

        return;
      }


      /*
       * -------------------------------------------------------
       * DIRECTOR ACCESS GRANTED
       * -------------------------------------------------------
       */

      setIsDirector(true);
      setCheckingAccess(false);


      /*
       * -------------------------------------------------------
       * LOAD APPLICATIONS
       * -------------------------------------------------------
       */

      const applicationsQuery =
        query(
          collection(
            db,
            "applications"
          ),
          orderBy(
            "submittedAt",
            "desc"
          )
        );


      unsubscribeApplications =
        onSnapshot(
          applicationsQuery,

          (snapshot) => {

            const applicationData =
              snapshot.docs.map(
                (doc) => ({
                  id: doc.id,
                  ...doc.data(),
                })
              );

            setApplications(
              applicationData
            );

          },

          (err) => {

            console.error(
              "Application loading error:",
              err
            );

            setError(
              "Unable to load applications."
            );

          }
        );

    };


    /*
     * Firebase authentication can take a moment
     * to initialize. Wait for the auth state before
     * checking the account.
     */

    const unsubscribeAuth =
      auth.onAuthStateChanged
        ? auth.onAuthStateChanged(checkDirectorAccess)
        : null;


    /*
     * If onAuthStateChanged isn't available through
     * the auth object, perform the check immediately.
     */

    if (!unsubscribeAuth) {
      checkDirectorAccess();
    }


    /*
     * -------------------------------------------------------
     * CLEANUP
     * -------------------------------------------------------
     */

    return () => {

      if (unsubscribeAuth) {
        unsubscribeAuth();
      }

      if (unsubscribeApplications) {
        unsubscribeApplications();
      }

    };

  }, [navigate]);


  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (checkingAccess) {

    return (
      <div className="nh-page-loading">

        <div className="nh-loading-spinner"></div>

        <p>
          VERIFYING DIRECTOR ACCESS...
        </p>

      </div>
    );

  }


  /*
   * =========================================================
   * ACCESS DENIED
   * =========================================================
   */

  if (!isDirector) {
    return null;
  }


  /*
   * =========================================================
   * DATE FORMATTER
   * =========================================================
   */

  const formatDate = (timestamp) => {

    if (!timestamp) {
      return "Unknown";
    }

    try {

      return timestamp
        .toDate()
        .toLocaleDateString(
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
  };


  /*
   * =========================================================
   * STATUS CLASS
   * =========================================================
   */

  const getStatusClass = (status) => {

    switch (status) {

      case "approved":
        return "approved";

      case "denied":
        return "denied";

      case "needs_info":
        return "needs-info";

      default:
        return "pending";

    }
  };


  /*
   * =========================================================
   * COUNTS
   * =========================================================
   */

  const pendingCount =
    applications.filter(
      (application) =>
        application.status === "pending"
    ).length;


  const approvedCount =
    applications.filter(
      (application) =>
        application.status === "approved"
    ).length;


  const deniedCount =
    applications.filter(
      (application) =>
        application.status === "denied"
    ).length;


  /*
   * =========================================================
   * NEEDS INFORMATION COUNT
   * =========================================================
   */

  const needsInfoCount =
    applications.filter(
      (application) =>
        application.status === "needs_info"
    ).length;


  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (

    <div className="nh-applications-page">

      <div className="nh-applications-container">


        {/* =================================================
            HEADER
            ================================================= */}

        <div className="nh-applications-header">

          <div>

            <div className="nh-page-eyebrow">
              DIRECTOR ACCESS
            </div>

            <h1>
              APPLICATIONS
            </h1>

            <p>
              Review and manage New Horizon
              membership applications.
            </p>

          </div>


          <button
            className="nh-applications-back"
            onClick={() => navigate("/")}
          >
            ← DASHBOARD
          </button>

        </div>


        {/* =================================================
            STATISTICS
            ================================================= */}

        <div className="nh-application-stats">


          <div className="nh-application-stat">

            <span className="nh-stat-label">
              TOTAL APPLICATIONS
            </span>

            <strong>
              {applications.length}
            </strong>

          </div>


          <div className="nh-application-stat">

            <span className="nh-stat-label">
              PENDING
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>


          <div className="nh-application-stat">

            <span className="nh-stat-label">
              APPROVED
            </span>

            <strong>
              {approvedCount}
            </strong>

          </div>


          <div className="nh-application-stat">

            <span className="nh-stat-label">
              DENIED
            </span>

            <strong>
              {deniedCount}
            </strong>

          </div>


          <div className="nh-application-stat">

            <span className="nh-stat-label">
              NEEDS INFO
            </span>

            <strong>
              {needsInfoCount}
            </strong>

          </div>

        </div>


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="nh-applications-error">
            {error}
          </div>
        )}


        {/* =================================================
            APPLICATION LIST
            ================================================= */}

        <div className="nh-applications-list">

          {applications.length === 0 ? (

            <div className="nh-applications-empty">

              <div className="nh-empty-icon">
                ✓
              </div>

              <h2>
                NO APPLICATIONS
              </h2>

              <p>
                There are currently no submitted
                applications to review.
              </p>

            </div>

          ) : (

            applications.map(
              (application) => (

                <div
                  className="nh-application-card"
                  key={application.id}
                >


                  {/* =======================================
                      APPLICANT
                      ======================================= */}

                  <div className="nh-application-card-main">

                    <div className="nh-application-avatar">

                      {application.firstName
                        ?.charAt(0)
                        .toUpperCase()}

                      {application.lastName
                        ?.charAt(0)
                        .toUpperCase()}

                    </div>


                    <div className="nh-application-card-info">

                      <div className="nh-application-card-name">

                        {application.firstName}{" "}

                        {application.lastName}

                      </div>


                      <div className="nh-application-card-position">

                        {application.desiredPosition ||
                          "Position not specified"}

                      </div>


                      <div className="nh-application-card-date">

                        Submitted{" "}

                        {formatDate(
                          application.submittedAt
                        )}

                      </div>

                    </div>

                  </div>


                  {/* =======================================
                      STATUS / REVIEW
                      ======================================= */}

                  <div className="nh-application-card-right">


                    <span
                      className={
                        `nh-application-status ${
                          getStatusClass(
                            application.status
                          )
                        }`
                      }
                    >
                      {application.status === "needs_info"
                        ? "NEEDS INFO"
                        : application.status ||
                          "pending"}
                    </span>


                    <button
                      className="nh-application-review"
                      onClick={() =>
                        navigate(
                          `/applications/${application.id}`
                        )
                      }
                    >
                      REVIEW
                    </button>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </div>

    </div>

  );
}

export default Applications;