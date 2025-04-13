import { useEffect, useState } from "react";
import Sidebar from "./sideBar";
import Header from "./header";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [role_id, setRoleId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const roleMap = {
    1: "Student",
    2: "Faculty",
    3: "Program Chair",
    4: "Dean",
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("Loaded user:", user); // ✅ See what's stored
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setRoleId(user.roleID ?? user.roleId);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const roleTitle = role_id !== null && roleMap[role_id] ? roleMap[role_id] : "User";

  return (
    <div className="bg-[rgb(238,238,238)] h-full">
      <div className="flex">
        <Sidebar
          role_id={role_id}
          setSelectedSubject={setSelectedSubject}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isMobile ? "ml-0" : isExpanded ? "ml-[180px]" : "ml-[64.5px]"
          }`}
        >
          <Header title={roleTitle} />
          <main className="p-4">
            <Outlet context={{ selectedSubject }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
