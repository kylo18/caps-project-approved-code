import { NavLink } from "react-router-dom";

const BottomNav = ({ role }) => {
const getNavItems = () => {
    const studentItems = [
      { name: "Home", path: "/student-dashboard", icon: "bx-home" },
      { name: "Leaderboard", path: "/leaderboard", icon: "bx-trophy" },
    ];
    return studentItems;
  };

  const navItems = getNavItems();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50"
      style={{
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.85rem)',
      }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-[28px] border border-slate-200/80 bg-white/88 px-5 py-3 shadow-[0_18px_32px_rgba(148,163,184,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-black/88 dark:shadow-[0_20px_34px_rgba(2,6,23,0.4)]">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex min-w-[4.4rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all duration-200 ${
                isActive 
                  ? 'text-[var(--color-primary)] scale-110' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i className={`${item.icon} text-[1.6rem]`}></i>
                <span className={`text-[clamp(0.68rem,2.1vw,0.74rem)] font-medium leading-none ${isActive ? 'opacity-100' : 'opacity-75'}`}>
                  {item.name}
                </span>
                {isActive && (
                  <span className="w-1 h-1 mt-1 rounded-full bg-[var(--color-primary)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
