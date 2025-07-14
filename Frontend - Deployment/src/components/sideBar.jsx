import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import AllSubjectsDropDown from "./subjectsDean";
import AllSubjectsDropDownProgramChair from "./subjectsProgramChair";
import AssignedSubjectsDropDown from "./subjectsFaculty";
import SideBarToolTip from "./sidebarTooltip";
import Questionnare from "./Questionnare";
import PrintExamModal from "./PrintExamModal";
import AppVersion from "./appVersion";

// Displays the main sidebar
const Sidebar = ({
  role_id,
  setSelectedSubject,
  isExpanded,
  setIsExpanded,
  selectedSubject,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const collegeLogo = new URL("/college-logo.png", import.meta.url).href;
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
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
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
            ? "/dean-dashboard"
            : "/";

  const baseMenuItems = [
    { icon: "bx-home-alt-3", label: "Dashboard", path: homePath },
  ];
  let facultyItems = [];
  if (parsedRoleId === 2) {
    facultyItems = [
      {
        icon: "bx-printer",
        label: "Print",
        onClick: () => alert("The print feature for faculty is coming soon!"),
        isButton: true,
      },
    ];
  } else {
    facultyItems = [
      {
        icon: "bx-printer",
        label: "Print",
        onClick: () => setShowPrintModal(true),
        isButton: true,
      },
    ];
  }
  const adminItems = [{ icon: "bx-group", label: "Users", path: "/users" }];
  const classes = [{ icon: "bx-book-bookmark", label: "Classes" }];

  let menuItems = [];

  if (parsedRoleId !== 1) {
    // if NOT student
    menuItems = [...baseMenuItems];

    if (parsedRoleId >= 2) menuItems = [...menuItems, ...facultyItems];
    if (parsedRoleId >= 2) menuItems = [...menuItems, ...adminItems];
  }

  const isActive = (path) => location.pathname === path;

  const handleMenuClick = () => {
    setIsExpanded(false);
    setIsSubjectFocused(false);
    setSelectedSubject(null);
  };

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <>
        <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-300 bg-white px-6 py-2 min-[500px]:px-9">
          <div className="flex items-center justify-between">
            {/* Left side - Users and Print */}
            <div className="flex items-center gap-5 min-[345px]:gap-8 min-[500px]:gap-18">
              {menuItems
                .filter(
                  (item) => item.label === "Users" || item.label === "Print",
                )
                .map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {item.isButton ? (
                      <button
                        onClick={item.onClick}
                        className="flex flex-col items-center p-2 text-gray-700 transition-colors hover:text-gray-800"
                      >
                        <i className={`bx ${item.icon} mb-[5px] text-2xl`}></i>
                        <span className="text-xs">{item.label}</span>
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={handleMenuClick}
                        className={`flex flex-col items-center p-2 transition-colors ${
                          isActive(item.path)
                            ? "text-orange-600"
                            : "text-gray-700 hover:text-gray-800"
                        }`}
                      >
                        <i className={`bx ${item.icon} mb-[5px] text-2xl`}></i>
                        <span className="text-xs">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
            </div>

            {/* Center - Dashboard with circle background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {menuItems
                .filter((item) => item.label === "Dashboard")
                .map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="mb-3 flex size-13 items-center justify-center rounded-full bg-orange-500 shadow-lg">
                      <Link
                        to={item.path}
                        onClick={handleMenuClick}
                        className={`flex size-13 items-center justify-center rounded-full transition-colors ${
                          isActive(item.path)
                            ? "text-white"
                            : "text-white hover:text-orange-100"
                        }`}
                      >
                        <i className={`bx mb-1 ${item.icon} text-2xl`}></i>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>

            {/* Right side - Subjects */}
            <div className="flex items-center gap-5 hover:text-gray-800 min-[345px]:gap-8 min-[500px]:gap-18">
              {/* Subjects for different roles */}
              {parsedRoleId === 5 && (
                <>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <AllSubjectsDropDown
                      item={classes[0]}
                      isExpanded={isExpanded}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/Dean/subjects"}
                      className="bx bx-newspaper"
                      selectedSubject={selectedSubject}
                      refreshSubjects={() => {}}
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Subjects
                    </span>
                  </div>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <Questionnare
                      selectedSubject={selectedSubject}
                      setSelectedSubject={setSelectedSubject}
                      item={classes[0]}
                      isExpanded={isExpanded}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/Dean/subjects"}
                      className="bx bx-file-detail"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Quizzes
                    </span>
                  </div>
                </>
              )}

              {parsedRoleId === 4 && (
                <>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <AllSubjectsDropDown
                      item={classes[0]}
                      selectedSubject={selectedSubject}
                      setSelectedSubject={setSelectedSubject}
                      isExpanded={isExpanded}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/Dean/subjects"}
                      className="bx bx-newspaper"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Subjects
                    </span>
                  </div>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <Questionnare
                      item={classes[0]}
                      selectedSubject={selectedSubject}
                      parsedRoleId={parsedRoleId}
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      className="bx bx-file-detail"
                      homePath={"/Dean/subjects"}
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Quizzes
                    </span>
                  </div>
                </>
              )}

              {parsedRoleId === 3 && (
                <>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <AllSubjectsDropDownProgramChair
                      item={classes[0]}
                      isExpanded={isExpanded}
                      selectedSubject={selectedSubject}
                      setSelectedSubject={setSelectedSubject}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/program-chair/subjects"}
                      className="bx bx-newspaper"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Subjects
                    </span>
                  </div>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <Questionnare
                      item={classes[0]}
                      isExpanded={isExpanded}
                      selectedSubject={selectedSubject}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/program-chair/subjects"}
                      className="bx bx-file-detail"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Quizzes
                    </span>
                  </div>
                </>
              )}

              {parsedRoleId === 2 && (
                <>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <AssignedSubjectsDropDown
                      item={classes[0]}
                      isExpanded={isExpanded}
                      selectedSubject={selectedSubject}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/faculty/subjects"}
                      className="bx bx-newspaper"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Subjects
                    </span>
                  </div>
                  <div className="-mt-[5px] flex flex-col items-center">
                    <Questionnare
                      item={classes[0]}
                      isExpanded={isExpanded}
                      selectedSubject={selectedSubject}
                      parsedRoleId={parsedRoleId}
                      setIsExpanded={setIsExpanded}
                      setSelectedSubject={setSelectedSubject}
                      isSubjectFocused={isSubjectFocused}
                      setIsSubjectFocused={setIsSubjectFocused}
                      homePath={"/faculty/subjects"}
                      className="bx bx-file-detail"
                    />
                    <span className="-mt-[6px] text-xs text-gray-600">
                      Quizzes
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <PrintExamModal
          isOpen={showPrintModal === true}
          onClose={() => setShowPrintModal(false)}
        />
      </>
    );
  }

  // Desktop sidebar (unchanged)
  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-55 h-[100vh] border-r border-gray-300 bg-white px-2 py-3 text-gray-700 transition-all duration-300 ease-in-out ${
          isExpanded ? "w-[55.5px]" : "w-[55.5px]"
        }`}
      >
        {/* Logo & CAPS text */}
        <div className="flex cursor-pointer gap-4 rounded-md px-1 py-[4px] hover:bg-gray-100">
          <img
            key={role_id}
            src={collegeLogo}
            alt="College Logo"
            className="size-[32px]"
          />
        </div>

        {/* Sidebar menu items */}
        <ul className="mt-3 mb-3 space-y-[5px]">
          {menuItems.map((item, index) => (
            <li key={index}>
              <SideBarToolTip label={item.label} isExpanded={isExpanded}>
                {item.isButton ? (
                  <button
                    onClick={item.onClick}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded px-[8px] py-[8px] transition-colors hover:bg-gray-100 hover:text-gray-800`}
                  >
                    <i className={`bx ${item.icon} text-2xl`}></i>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={handleMenuClick}
                    className={`flex cursor-pointer items-center gap-3 rounded-md px-[8px] py-[8px] transition-colors hover:bg-gray-100 hover:text-gray-800${
                      isActive(item.path) ? "" : "hover:text-gray-800"
                    }`}
                  >
                    <i
                      className={`bx ${item.icon} text-2xl hover:text-gray-800`}
                    ></i>
                  </Link>
                )}
              </SideBarToolTip>
            </li>
          ))}
        </ul>

        {parsedRoleId === 5 && (
          <div className="flex flex-col space-y-[5px]">
            <>
              <div className="mb-3 h-[1px] w-full bg-[rgb(200,200,200)]"></div>
            </>
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
                    className="bx bx-newspaper"
                    selectedSubject={selectedSubject}
                  />
                ))}
              </ul>
            </div>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <Questionnare
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    selectedSubject={selectedSubject}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/Dean/subjects"}
                    className="bx bx-file-detail"
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Different Dropdowns for Different Roles*/}
        {parsedRoleId === 4 && (
          <div className="flex flex-col space-y-[5px]">
            <>
              <div className="mb-3 flex h-[1px] w-full bg-[rgb(200,200,200)]"></div>
            </>
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
                    selectedSubject={selectedSubject}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/Dean/subjects"}
                    className="bx bx-newspaper"
                  />
                ))}
              </ul>
            </div>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <Questionnare
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    selectedSubject={selectedSubject}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/Dean/subjects"}
                    className="bx bx-file-detail"
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {parsedRoleId === 3 && (
          <div className="flex flex-col space-y-[5px]">
            <>
              {/* Focused Subject Dropdown (move to top if focused) */}
              <div className="mb-3 h-[1px] w-full bg-[rgb(200,200,200)]"></div>
            </>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <AllSubjectsDropDownProgramChair
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    selectedSubject={selectedSubject}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/program-chair/subjects"}
                    className="bx bx-newspaper"
                  />
                ))}
              </ul>
            </div>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <Questionnare
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    selectedSubject={selectedSubject}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/program-chair/subjects"}
                    className="bx bx-file-detail"
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {parsedRoleId === 2 && (
          <div className="flex flex-col space-y-[5px]">
            <>
              <div className="mb-3 h-[1px] w-full bg-[rgb(200,200,200)]"></div>
            </>
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
                    selectedSubject={selectedSubject}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/faculty/subjects"}
                    className="bx bx-newspaper"
                  />
                ))}
              </ul>
            </div>
            <div
              className={`${isSubjectFocused ? "top-[75px] z-50 w-full" : ""}`}
            >
              <ul className="space-y-[10px]">
                {classes.map((item, index) => (
                  <Questionnare
                    key={index}
                    item={item}
                    isExpanded={isExpanded}
                    parsedRoleId={parsedRoleId}
                    setIsExpanded={setIsExpanded}
                    selectedSubject={selectedSubject}
                    setSelectedSubject={setSelectedSubject}
                    isSubjectFocused={isSubjectFocused}
                    setIsSubjectFocused={setIsSubjectFocused}
                    homePath={"/faculty/subjects"}
                    className="bx bx-file-detail"
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {/*<div
          className={`fixed bottom-4 ${isExpanded ? "left-[75px]" : "left-[14px]"} transition-all duration-300 ease-in-out ${
            isMobile && !isExpanded ? "hidden" : ""
          }`}
        >
          <AppVersion />
        </div>*/}
      </div>
      <PrintExamModal
        isOpen={showPrintModal === true}
        onClose={() => setShowPrintModal(false)}
      />
    </>
  );
};

export default Sidebar;
