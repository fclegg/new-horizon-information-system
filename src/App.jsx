import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import "./App.css";
import { auth } from "./firebase/config";

import MainLayout from "./MainLayout";

import Login from "./pages/Login";

import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Resources from "./pages/Resources";
import SpiritDatabase from "./pages/SpiritDatabase";
import SpiritProfile from "./pages/SpiritProfile";
import CultRegistry from "./pages/CultRegistry";
import Evidence from "./pages/Evidence";
import Objects from "./pages/Objects";
import Equipment from "./pages/Equipment";
import Training from "./pages/Training";
import Calendar from "./pages/Calendar";
import Operations from "./pages/Operations";
import Forms from "./pages/Forms";
import HauntingsMap from "./pages/HauntingsMap";

import InvestigationDetail from "./pages/InvestigationDetail";
import WitnessReport from "./pages/WitnessReport";
import LocationHistory from "./pages/LocationHistory";
import IPO from "./pages/IPO";
import InvestigationReport from "./pages/InvestigationReport";
import IncidentReport from "./pages/IncidentReport";
import FinalAssessment from "./pages/FinalAssessment";
import EvidenceSubmission from "./pages/EvidenceSubmission";


/*
 * =========================================================
 * PROTECTED LAYOUT
 * =========================================================
 */

function ProtectedLayout() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setCheckingAuth(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * ---------------------------------------------------------
   * AUTHENTICATION CHECK
   * ---------------------------------------------------------
   */

  if (checkingAuth) {
    return (
      <div className="nh-login-page">
        <div className="nh-login-panel">

          <div className="nh-login-header">

            <div className="nh-login-mark">
              NH
            </div>

            <h1>
              NEW HORIZON
            </h1>

            <p>
              Information System
            </p>

          </div>

          <div
            style={{
              textAlign: "center",
              color: "var(--nh-muted)",
            }}
          >
            Verifying authentication...
          </div>

        </div>
      </div>
    );
  }


  /*
   * ---------------------------------------------------------
   * NOT LOGGED IN
   * ---------------------------------------------------------
   */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  /*
   * ---------------------------------------------------------
   * AUTHENTICATED
   * ---------------------------------------------------------
   */

  return <Outlet />;
}


/*
 * =========================================================
 * APPLICATION
 * =========================================================
 */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ===================================================
            LOGIN
            =================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ===================================================
            PROTECTED APPLICATION
            =================================================== */}

        <Route element={<ProtectedLayout />}>

          <Route element={<MainLayout />}>


            {/* ===============================================
                MAIN
                =============================================== */}

            <Route
              path="/"
              element={<Dashboard />}
            />


            {/* ===============================================
                CASES
                =============================================== */}

            <Route
              path="/cases"
              element={<Cases />}
            />

            <Route
              path="/cases/:caseId"
              element={<CaseDetail />}
            />


            {/* ===============================================
                INVESTIGATIONS
                =============================================== */}

            <Route
              path="/investigations/:investigationId"
              element={<InvestigationDetail />}
            />


            {/* ===============================================
                WITNESS REPORTS
                =============================================== */}

            <Route
              path="/cases/:caseId/witness-reports/new"
              element={<WitnessReport />}
            />

            <Route
              path="/cases/:caseId/witness-reports/:reportId"
              element={<WitnessReport />}
            />


            {/* ===============================================
                LOCATION HISTORY
                =============================================== */}

            <Route
              path="/cases/:caseId/location-history/new"
              element={<LocationHistory />}
            />

            <Route
              path="/cases/:caseId/location-history/:historyId"
              element={<LocationHistory />}
            />


            {/* ===============================================
                INVESTIGATION PLAN OUTLINE
                =============================================== */}

            <Route
              path="/investigations/:investigationId/ipo/new"
              element={<IPO />}
            />

            <Route
              path="/investigations/:investigationId/ipo/:ipoId"
              element={<IPO />}
            />


            {/* ===============================================
                INVESTIGATION REPORTS
                =============================================== */}

            <Route
              path="/cases/:caseId/investigation-reports/new"
              element={<InvestigationReport />}
            />

            <Route
              path="/cases/:caseId/investigation-reports/:reportId"
              element={<InvestigationReport />}
            />


            {/* ===============================================
                INCIDENT REPORTS
                =============================================== */}

            <Route
              path="/cases/:caseId/incident-reports/new"
              element={<IncidentReport />}
            />

            {/* ===============================================
                FINAL ASSESMENT
                =============================================== */}

            <Route
              path="/cases/:caseId/final-assessment/new"
              element={<FinalAssessment />}
            />

            <Route
              path="/cases/:caseId/final-assessment/:assessmentId"
              element={<FinalAssessment />}
            />

            <Route
              path="/cases/:caseId/incident-reports/:reportId"
              element={<IncidentReport />}
            />


            {/* ===============================================
                MEMBERS
                =============================================== */}

            <Route
              path="/members"
              element={<Members />}
            />

            {/* ===============================================
                EVIDENCE
                =============================================== */}
            
            <Route
              path="/investigations/:investigationId/evidence/new"
              element={<EvidenceSubmission />}
            />

            {/* ===============================================
                SPIRIT DATABASE
                =============================================== */}

            <Route
              path="/spirits"
              element={<SpiritDatabase />}
            />

            <Route
              path="/spirits/:spiritId"
              element={<SpiritProfile />}
            />


            {/* ===============================================
                CULT REGISTRY
                =============================================== */}

            <Route
              path="/cults"
              element={<CultRegistry />}
            />


            {/* ===============================================
                EVIDENCE
                =============================================== */}

            <Route
              path="/evidence"
              element={<Evidence />}
            />


            {/* ===============================================
                RESOURCES
                =============================================== */}

            <Route
              path="/resources"
              element={<Resources />}
            />


            {/* ===============================================
                OBJECTS
                =============================================== */}

            <Route
              path="/objects"
              element={<Objects />}
            />


            {/* ===============================================
                EQUIPMENT
                =============================================== */}

            <Route
              path="/equipment"
              element={<Equipment />}
            />


            {/* ===============================================
                TRAINING
                =============================================== */}

            <Route
              path="/training"
              element={<Training />}
            />


            {/* ===============================================
                CALENDAR
                =============================================== */}

            <Route
              path="/calendar"
              element={<Calendar />}
            />


            {/* ===============================================
                OPERATIONS
                =============================================== */}

            <Route
              path="/operations"
              element={<Operations />}
            />


            {/* ===============================================
                FORMS
                =============================================== */}

            <Route
              path="/forms"
              element={<Forms />}
            />


            {/* ===============================================
                HAUNTINGS MAP
                =============================================== */}

            <Route
              path="/map"
              element={<HauntingsMap />}
            />


          </Route>

        </Route>


        {/* ===================================================
            UNKNOWN ROUTES
            =================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;