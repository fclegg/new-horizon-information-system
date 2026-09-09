import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/config";

function MainLayout() {
  const [isDirector, setIsDirector] = useState(false);

  // Desktop starts expanded.
  // Mobile starts collapsed.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 768;
    }

    return false;
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /*
   * =========================================================
   * DIRECTOR AUTHORIZATION
   * =========================================================
   */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setIsDirector(false);
          return;
        }

        const email = user.email?.trim().toLowerCase();

        setIsDirector(
          email === "newhorizonparanormal@gmail.com"
        );
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * =========================================================
   * MOBILE DETECTION
   * =========================================================
   */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /*
   * =========================================================
   * CLOSE MOBILE SIDEBAR WHEN NAVIGATING
   * =========================================================
   */

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen(false);
    }
  };

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
    <div
      className={`nh-app ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      } ${mobileSidebarOpen ? "mobile-sidebar-open" : ""}`}
    >

      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}

      <div
        className="nh-sidebar-overlay"
        onClick={() => setMobileSidebarOpen(false)}
      />


      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="nh-sidebar">

        {/* =================================================
            SIDEBAR HEADER
            ================================================= */}

        <div className="nh-sidebar-header">

          <div className="nh-brand">

            <div className="nh-brand-mark">
              NH
            </div>

            <div className="nh-brand-text">

              <div className="nh-brand-name">
                NEW HORIZON
              </div>

              <div className="nh-brand-subtitle">
                INFORMATION SYSTEM
              </div>

            </div>

          </div>


          {/* Desktop collapse button */}

          <button
            className="nh-sidebar-toggle"
            onClick={() =>
              setSidebarCollapsed(!sidebarCollapsed)
            }
            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>

        </div>


        {/* =================================================
            NAVIGATION
            ================================================= */}

        <div className="nh-sidebar-content">

          <NavSection
            title="MAIN"
            items={mainNavigation}
            collapsed={sidebarCollapsed}
            onNavigate={closeMobileSidebar}
          />

          <NavSection
            title="DATABASE"
            items={databaseNavigation}
            collapsed={sidebarCollapsed}
            onNavigate={closeMobileSidebar}
          />

          <NavSection
            title="OPERATIONS"
            items={operationsNavigation}
            collapsed={sidebarCollapsed}
            onNavigate={closeMobileSidebar}
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
              collapsed={sidebarCollapsed}
              onNavigate={closeMobileSidebar}
            />
          )}

        </div>


        {/* =================================================
            SIDEBAR FOOTER
            ================================================= */}

        <div className="nh-sidebar-footer">

          <div className="nh-system-status">

            <span className="nh-status-dot"></span>

            <span className="nh-system-status-text">
              System Online
            </span>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}

      <div className="nh-content">

        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="nh-topbar">

          <div className="nh-topbar-left">

            {/* Mobile menu button */}

            <button
              className="nh-mobile-menu"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              aria-label="Open navigation"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>


            <div className="nh-topbar-title">
              New Horizon Information System
            </div>

          </div>


          <div className="nh-user-area">
            Authorized Personnel
          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
            ================================================= */}

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

function NavSection({
  title,
  items,
  collapsed,
  onNavigate,
}) {
  return (
    <div className="nh-nav-section">

      <div
        className={`nh-nav-section-title ${
          collapsed ? "hidden" : ""
        }`}
      >
        {title}
      </div>

      <nav className="nh-nav">

        {items.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={onNavigate}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              `nh-nav-link ${
                isActive ? "active" : ""
              }`
            }
          >

            {/* Icon placeholder */}

            <span className="nh-nav-icon">
              <span></span>
            </span>

            <span className="nh-nav-label">
              {item.name}
            </span>

          </NavLink>

        ))}

      </nav>

    </div>
  );
}


export default MainLayout;