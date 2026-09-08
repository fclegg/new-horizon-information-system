import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/config";

function MainLayout() {
  const [isDirector, setIsDirector] = useState(false);

  /*
   * =========================================================
   * DIRECTOR AUTHORIZATION
   * =========================================================
   *
   * For now, the New Horizon Director account is hardcoded.
   *
   * Director account:
   * newhorizonparanormal@gmail.com
   *
   * This can later be replaced with Firebase custom claims
   * when we add a proper role-management system.
   */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setIsDirector(false);
          return;
        }

        const email =
          user.email?.trim().toLowerCase();

        setIsDirector(
          email === "newhorizonparanormal@gmail.com"
        );
      }
    );

    return () => unsubscribe();
  }, []);


  /*
   * =========================================================
   * MAIN NAVIGATION
   * =========================================================
   */

  const mainNavigation = [
    {
      name: "Dashboard",
      path: "/",
    },
    {
      name: "Investigation Cases",
      path: "/cases",
    },
    {
      name: "Calendar",
      path: "/calendar",
    },
  ];


  /*
   * =========================================================
   * DATABASE NAVIGATION
   * =========================================================
   */

  const databaseNavigation = [
    {
      name: "Members",
      path: "/members",
    },
    {
      name: "Spirit Database",
      path: "/spirits",
    },
    {
      name: "Cult Registry",
      path: "/cults",
    },
    {
      name: "Evidence",
      path: "/evidence",
    },
    {
      name: "Resources",
      path: "/resources",
    },
  ];


  /*
   * =========================================================
   * OPERATIONS NAVIGATION
   * =========================================================
   */

  const operationsNavigation = [
    {
      name: "Equipment",
      path: "/equipment",
    },
    {
      name: "Objects",
      path: "/objects",
    },
    {
      name: "Training",
      path: "/training",
    },
    {
      name: "Forms",
      path: "/forms",
    },
    {
      name: "Operations",
      path: "/operations",
    },
    {
      name: "Hauntings Map",
      path: "/map",
    },
  ];


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="nh-app">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="nh-sidebar">

        {/* =================================================
            BRAND
            ================================================= */}

        <div className="nh-brand">

          <div className="nh-brand-mark">
            NH
          </div>

          <div>
            <div className="nh-brand-name">
              NEW HORIZON
            </div>

            <div className="nh-brand-subtitle">
              INFORMATION SYSTEM
            </div>
          </div>

        </div>


        {/* =================================================
            NAVIGATION
            ================================================= */}

        <div className="nh-sidebar-content">

          {/* MAIN */}

          <NavSection
            title="MAIN"
            items={mainNavigation}
          />


          {/* DATABASE */}

          <NavSection
            title="DATABASE"
            items={databaseNavigation}
          />


          {/* OPERATIONS */}

          <NavSection
            title="OPERATIONS"
            items={operationsNavigation}
          />


          {/* =================================================
              DIRECTOR
              ================================================= */}

          {isDirector && (
            <NavSection
              title="DIRECTOR"
              items={[
                {
                  name: "Applications",
                  path: "/applications",
                },
              ]}
            />
          )}

        </div>


        {/* =================================================
            SIDEBAR FOOTER
            ================================================= */}

        <div className="nh-sidebar-footer">

          <div className="nh-system-status">

            <span className="nh-status-dot"></span>

            System Online

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div className="nh-content">

        {/* TOP BAR */}

        <header className="nh-topbar">

          <div className="nh-topbar-title">
            New Horizon Information System
          </div>

          <div className="nh-user-area">
            Authorized Personnel
          </div>

        </header>


        {/* PAGE CONTENT */}

        <main className="nh-main">
          <Outlet />
        </main>

      </div>

    </div>
  );
}


/* =========================================================
   NAVIGATION SECTION COMPONENT
   ========================================================= */

function NavSection({ title, items }) {
  return (
    <div className="nh-nav-section">

      <div className="nh-nav-section-title">
        {title}
      </div>

      <nav className="nh-nav">

        {items.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `nh-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >
            {item.name}
          </NavLink>

        ))}

      </nav>

    </div>
  );
}


export default MainLayout;