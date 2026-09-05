import { NavLink, Outlet } from "react-router-dom";

function MainLayout() {
  const mainNavigation = [
    { name: "Dashboard", path: "/" },
    { name: "Investigation Cases", path: "/cases" },
    { name: "Calendar", path: "/calendar" },
  ];

  const databaseNavigation = [
    { name: "Members", path: "/members" },
    { name: "Spirit Database", path: "/spirits" },
    { name: "Cult Registry", path: "/cults" },
    { name: "Evidence", path: "/evidence" },
    { name: "Resources", path: "/resources" },
  ];

  const operationsNavigation = [
    { name: "Equipment", path: "/equipment" },
    { name: "Objects", path: "/objects" },
    { name: "Training", path: "/training" },
    { name: "Forms", path: "/forms" },
    { name: "Operations", path: "/operations" },
    { name: "Hauntings Map", path: "/map" },
  ];

  return (
    <div className="nh-app">
      <aside className="nh-sidebar">
        <div className="nh-brand">
          <div className="nh-brand-mark">NH</div>

          <div>
            <div className="nh-brand-name">
              NEW HORIZON
            </div>

            <div className="nh-brand-subtitle">
              INFORMATION SYSTEM
            </div>
          </div>
        </div>

        <div className="nh-sidebar-content">
          <NavSection title="MAIN" items={mainNavigation} />
          <NavSection title="DATABASE" items={databaseNavigation} />
          <NavSection title="OPERATIONS" items={operationsNavigation} />
        </div>

        <div className="nh-sidebar-footer">
          <div className="nh-system-status">
            <span className="nh-status-dot"></span>
            System Online
          </div>
        </div>
      </aside>

      <div className="nh-content">
        <header className="nh-topbar">
          <div className="nh-topbar-title">
            New Horizon Information System
          </div>

          <div className="nh-user-area">
            Authorized Personnel
          </div>
        </header>

        <main className="nh-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

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
              `nh-nav-link ${isActive ? "active" : ""}`
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