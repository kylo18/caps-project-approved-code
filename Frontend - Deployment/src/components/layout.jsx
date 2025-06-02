import { useEffect, useState } from "react";
import Sidebar from "./sideBar";
import Header from "./header";
import { Outlet, useLocation } from "react-router-dom";

// Main Layout
const Layout = () => {
  const [role_id, setRoleId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  const roleMap = {
    1: "Student",
    2: "Faculty",
    3: "Program Chair",
    4: "Dean",
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setRoleId(user.roleID ?? user.roleId);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const roleTitle =
    role_id !== null && roleMap[role_id] ? roleMap[role_id] : "User";

  const isStudent = Number(role_id) === 1;
  const isTutorialPage = location.pathname.includes("/help");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {!isStudent && !isTutorialPage && (
          <Sidebar
            role_id={role_id}
            setSelectedSubject={setSelectedSubject}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          />
        )}
        <div
          className={`flex flex-1 flex-col transition-all duration-300 ${
            isStudent || isTutorialPage
              ? "ml-0"
              : isMobile
                ? "ml-0"
                : isExpanded
                  ? "ml-[200px]"
                  : "ml-[64.5px]"
          }`}
        >
          <Header title={roleTitle} />
          <main className={isTutorialPage ? "" : "p-4"}>
            <Outlet context={{ selectedSubject }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
