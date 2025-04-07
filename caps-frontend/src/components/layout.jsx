import { useEffect, useState } from "react";
import Sidebar from "./sideBar";
import Header from "./header";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [role_id, setRoleId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.roleID !== undefined) {
      setRoleId(user.roleID);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="bg-[rgb(238,238,238)]">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          role_id={role_id}
          setSelectedSubject={setSelectedSubject}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
        />

        {/* Main content area that resizes dynamically */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isMobile ? "ml-0" : isExpanded ? "ml-[180px]" : "ml-[64.5px]"
          }`}
        >
          <Header title="Admin" />
          <main className="p-4">
            <Outlet context={{ selectedSubject }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
