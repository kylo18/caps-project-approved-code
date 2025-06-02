import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import AllSubjectsDropDown from "./subjectsDean";
import AllSubjectsDropDownProgramChair from "./subjectsProgramChair";
import AssignedSubjectsDropDown from "./subjectsFaculty";
import SideBarToolTip from "./sidebarTooltip";
import PrintExamModal from "./PrintExamModal";

// Displays the main sidebar
const Sidebar = ({
  role_id,
  setSelectedSubject,
  isExpanded,
  setIsExpanded,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const collegeLogo = new URL("../assets/college-logo.png", import.meta.url)
    .href;
  const [isSubjectFocused, setIsSubjectFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const sidebarRef = useRef();

  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isMobile &&
        isExpanded
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isExpanded]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const parsedRoleId = Number(role_id);

  const homePath =
    parsedRoleId === 1
      ? "/student"
      : parsedRoleId === 2
        ? "/faculty-dashboard"
        : parsedRoleId === 3
          ? "/program-chair-dashboard"
          : parsedRoleId === 4
            ? "/admin-dashboard"
            : "/";

  const baseMenuItems = [
    { icon: "bx-bar-chart-alt-2", label: "Dashboard", path: homePath },
  ];
  const facultyItems = [
    {
      icon: "bx-printer",
      label: "Print",
      onClick: () => alert("Print feature is under development, Stay Tuned!"),
      isButton: true,
    },
  ];
  const adminItems = [{ icon: "bx-group", label: "Users", path: "/users" }];
  const classes = [{ icon: "bx-book-bookmark", label: "Classes" }];

  let menuItems = [];

  if (parsedRoleId !== 1) {
    // if NOT student
    menuItems = [...baseMenuItems];

    if (parsedRoleId >= 2) menuItems = [...menuItems, ...facultyItems];
    if (parsedRoleId >= 4) menuItems = [...menuItems, ...adminItems];
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {isMobile && !isExpanded && (
        <button
          onClick={() => {
            setIsExpanded(true);
            setIsSubjectFocused(false);
          }}
          className="fixed top-2 left-3 z-55 cursor-pointer rounded"
        >
          <i className="bx bx-menu text-3xl"></i>
        </button>
      )}
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`border-color fixed top-0 z-55 h-screen border-r bg-white p-4 text-gray-700 transition-all duration-300 ease-in-out ${
          isMobile ? (isExpanded ? "left-0" : "-left-full") : "left-0"
        } ${isExpanded ? "w-[200px]" : "w-[64.5px]"}`}
      >
        {/* Logo & CAPS text */}
        {!isMobile && (
          <div className="flex gap-4">
            <img
              key={role_id}
              src={collegeLogo}
              alt="College Logo"
              className="-mt-1.5 mb-5 size-[32px]"
            />
            <span
              className={`-mt-[5px] text-lg font-semibold text-black transition-all duration-200 ease-in-out ${
                isExpanded ? "ml-0 opacity-100" : "ml-[-20px] opacity-0"
              }`}
            >
              CAPS
            </span>
          </div>
        )}

        {/* Sidebar Toggle Button */}
        {!isMobile && (
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              setIsSubjectFocused(false);
            }}
            className="mb-[22px] flex cursor-pointer items-center gap-3 rounded px-[4px] py-[4px] hover:bg-[rgb(255,230,214)]"
          >
            <i
              className={`bx ${isExpanded ? "bx-chevron-left" : "bx-menu"} text-2xl`}
            ></i>
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="mb-5 flex cursor-pointer items-center gap-3 rounded px-[4px] py-[4px] hover:bg-[rgb(255,230,214)]"
          >
            <i className="bx bx-chevron-left text-3xl"></i>
          </button>
        )}

        {/* Sidebar menu items */}
        {!isSubjectFocused && (
          <ul className="-mt-2 mb-5 space-y-[14px]">
            {menuItems.map((item, index) => (
              <li key={index}>
                <SideBarToolTip label={item.label} isExpanded={isExpanded}>
                  {item.isButton ? (
                    <button
                      onClick={item.onClick}
                      className={`flex w-full items-center gap-3 rounded px-[4px] py-[4px] transition-colors hover:text-gray-700`}
                    >
                      <i className={`bx ${item.icon} text-2xl`}></i>
                      <span
                        className={`text-sm font-semibold transition-all duration-150 ease-in-out ${
                          isExpanded
                            ? "pointer-events-auto visible ml-0 opacity-100"
                            : "pointer-events-none invisible ml-0 opacity-0"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 rounded px-[4px] py-[4px] transition-colors ${
                        isActive(item.path)
                          ? "bg-orange-500 text-white"
                          : "hover:text-gray-700"
                      }`}
                    >
                      <i className={`bx ${item.icon} text-2xl`}></i>
                      <span
                        className={`text-sm font-semibold transition-all duration-150 ease-in-out ${
                          isExpanded
                            ? "pointer-events-auto visible ml-0 opacity-100"
                            : "pointer-events-none invisible ml-0 opacity-0"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )}
                </SideBarToolTip>
              </li>
            ))}
          </ul>
        )}

        {/* Different Dropdowns for Different Roles*/}
        {parsedRoleId === 4 && (
          <>
            {!isSubjectFocused && (
              <>
                <div className="mb-7 h-[1px] w-full bg-[rgb(168,168,168)]"></div>
              </>
            )}
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <AllSubjectsDropDown
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/Dean/subjects"}
                  />
                ))}
              </ul>
            </div>
          </>
        )}

        {parsedRoleId === 3 && (
          <>
            {!isSubjectFocused && (
              <>
                {/* Focused Subject Dropdown (move to top if focused) */}
                <div className="mb-7 h-[1px] w-full bg-[rgb(168,168,168)]"></div>
              </>
            )}
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <AllSubjectsDropDownProgramChair
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/program-chair/subjects"}
                  />
                ))}
              </ul>
            </div>
          </>
        )}

        {parsedRoleId === 2 && (
          <>
            {!isSubjectFocused && (
              <>
                <div className="mb-7 h-[1px] w-full bg-[rgb(168,168,168)]"></div>
              </>
            )}
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <AssignedSubjectsDropDown
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/faculty/subjects"}
                  />
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
      <PrintExamModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </>
  );
};

export default Sidebar;
