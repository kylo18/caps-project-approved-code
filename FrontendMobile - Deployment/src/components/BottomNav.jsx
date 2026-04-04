import { NavLink } from "react-router-dom";

/**
 * BottomNav Component
 * This is the primary navigation for mobile users (Student, Faculty, Dean, etc.)
 * It renders a floating bar at the bottom of the screen with role-specific icons.
 */
const BottomNav = ({ role, onPrintClick, onSubjectClick }) => {
  // Get nav items based on the user's role
  const getNavItems = () => {
    const roleId = Number(role);

    // 1. Navigation for Students
    // Order: Home → Insights → Leaderboard → AI Chat (last position)
    // AI Chat uses bx-star icon - confirmed working in Boxicons basic set
    if (roleId === 1) {
      return [
        { name: "Home", path: "/student-dashboard", icon: "bx-home" },
        { name: "Search", path: "/student-search", icon: "bx-search-alt" },
        { name: "Leaderboard", path: "/leaderboard", icon: "bx-trophy" },
        { name: "Profile", path: "/student-insights", icon: "bx-user" },
      ];
    }

    // 2. Navigation for Staff (Faculty, Program Chair, Dean)
    const homePath =
      roleId === 2 ? "/faculty-dashboard" :
        roleId === 3 ? "/program-chair-dashboard" :
          roleId === 4 ? "/dean-dashboard" : "/asso-dean-dashboard";

    return [
      { name: "Home", path: homePath, icon: "bx-home-alt-3" },
      { name: "Users", path: "/users", icon: "bx-group" },
      // "Subjects" is now a button that opens a full-screen modal instead of a simple link
      { name: "Subjects", isButton: true, icon: "bx-book", onClick: onSubjectClick },
      { name: "Analytics", path: "/admin/analytics", icon: "bx-pie-chart-alt" },
      // "Print" triggers the printing modal defined in the Layout
      { name: "Print", isButton: true, icon: "bx-printer", onClick: onPrintClick },
    ];
  };

  const navItems = getNavItems();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
      style={{
        // Safe area insets ensure the bar doesn't overlap with the iPhone notch or home bar
        paddingLeft: "calc(env(safe-area-inset-left, 0px) + 1rem)",
        paddingRight: "calc(env(safe-area-inset-right, 0px) + 1rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.85rem)",
      }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-[480px] w-[92%] items-center justify-between rounded-[26px] border border-orange-100/80 bg-white px-3 py-3 shadow-[0_18px_32px_rgba(254,105,2,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-black/88 dark:shadow-[0_20px_34px_rgba(2,6,23,0.4)]">
        {navItems.map((item) => (
          // Conditional Rendering: Check if the item is a Button or a NavLink
          item.isButton ? (
            <button
              key={item.name}
              onClick={item.onClick}
              className="flex min-w-[3.5rem] flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all duration-200 text-gray-400 hover:text-[var(--color-primary)] dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className={`bx ${item.icon} text-[1.6rem]`}></i>
              <span className="text-[clamp(0.65rem,2vw,0.74rem)] leading-none font-medium opacity-75">
                {item.name}
              </span>
            </button>
          ) : (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all duration-200 ${isActive
                  ? "bg-orange-50 text-[var(--color-primary)]"
                  : "text-gray-400 hover:text-[var(--color-primary)] dark:text-gray-400 dark:hover:text-gray-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <i className={`bx ${item.icon} text-[1.6rem]`}></i>
                  <span
                    className={`text-[clamp(0.65rem,2vw,0.74rem)] leading-none font-medium ${isActive ? "opacity-100" : "opacity-75"}`}
                  >
                    {item.name}
                  </span>
                  {/* Small dot below the icon for the active page */}
                  {isActive && (
                    <span className="mt-1 h-1 w-4 rounded-full bg-[var(--color-primary)]" />
                  )}
                </>
              )}
            </NavLink>
          )
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
