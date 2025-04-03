import { useEffect, useState } from "react";
import SideBarDropDown from "./sideBarDropDown";
import { Link } from "react-router-dom";

const Sidebar = ({ role_id, setSelectedSubject, isExpanded, setIsExpanded }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const collegeLogo = new URL("../assets/college-logo.png", import.meta.url).href;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const parsedRoleId = Number(role_id);

  const homePath =
    parsedRoleId === 1 ? "/student" :
    parsedRoleId === 2 ? "/Instructor" :
    parsedRoleId === 3 ? "/Program Chair" :
    parsedRoleId === 4 ? "/Dean" :
    "/"; // Default if role_id is invalid

  const baseMenuItems = [{ icon: "bx-home", label: "Home", path: homePath }];
  const facultyItems = [{ icon: "bx-printer", label: "Print" }];
  const programChairItems = [{ icon: "bx-bell", label: "Notifications" }];
  const adminItems = [{ icon: "bx-group", label: "Users", path: "/users" }];
  const classes = [{ icon: "bx-clipboard", label: "Classes" }];

  let menuItems = [...baseMenuItems];
  if (parsedRoleId >= 2) menuItems = [...menuItems, ...facultyItems];
  if (parsedRoleId >= 3) menuItems = [...menuItems, ...programChairItems];
  if (parsedRoleId >= 4) menuItems = [...menuItems, ...adminItems];

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="z-54 hover:text-white fixed top-2 left-3 hover:bg-orange-500 rounded cursor-pointer"
        >
          <i className="bx bx-menu text-3xl "></i>
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`z-53 h-screen bg-white text-[rgb(78,78,78)] p-4 transition-all duration-300 ease-in-out border-r border-[rgb(168,168,168)] fixed top-0 ${
          isMobile ? (isExpanded ? "left-0" : "-left-full") : "left-0"
        } ${isExpanded ? "w-[180px]" : "w-[64.5px]"}`}
      >
        {/* Logo & CAPS text */}
        {!isMobile && (
          <div className="flex gap-4">
            <img key={role_id} src={collegeLogo} alt="College Logo" className="size-[32px] -mt-1.5 mb-5" />
            <span
              className={`text-black text-lg -mt-[5px] font-semibold transition-all duration-200 ease-in-out ${
                isExpanded ? "opacity-100 ml-0" : "opacity-0 ml-[-20px]"
              }`}
            >
              CAPS
            </span>
          </div>
        )}

        {/* Sidebar Toggle Button */}
        {!isMobile && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="z-54 p-[2px] mb-5 hover:text-white hover:bg-orange-500 rounded cursor-pointer"
          >
            <i className={`bx ${isExpanded ? "bx-chevron-left" : "bx-menu"} text-3xl`}></i>
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobile && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="z-54 p-[2px] mb-5 hover:text-white hover:bg-orange-500 rounded cursor-pointer "
          >
            <i className="bx bx-chevron-left text-3xl"></i>
          </button>
        )}

        <ul className="space-y-[12px] -mt-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className="hover:text-white flex items-center gap-3 py-[6px] px-[4px] hover:bg-orange-500 rounded cursor-pointer"
              >
                <i className={`bx ${item.icon} text-2xl`}></i>
                <span
                  className={`text-sm font-semibold transition-all ease-in-out ${
                    isExpanded ? "opacity-100 ml-0" : "opacity-0 ml-[-20px]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {parsedRoleId === 4 && (
          <>
            <div className="w-full h-[1px] bg-[rgb(168,168,168)] mt-5"></div>
            <ul className="space-y-[10px] mt-5">
              {classes.map((item, index) => (
                <SideBarDropDown
                  key={index}
                  item={{ icon: "bx-clipboard", label: "Classes" }}
                  isExpanded={isExpanded}
                  parsedRoleId={parsedRoleId}
                  setIsExpanded={setIsExpanded}
                  setSelectedSubject={setSelectedSubject}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
};

export default Sidebar;
