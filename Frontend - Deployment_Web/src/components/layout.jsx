import { useEffect, useState } from "react";
import Sidebar from "./sideBar";
import Header from "./header";
import BottomNav from "./BottomNav";
import PrintExamModal from "./PrintExamModal";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AllSubjectsDropDown from "./subjectsDean";
import AllSubjectsDropDownProgramChair from "./subjectsProgramChair";
import AssignedSubjectsDropDown from "./subjectsFaculty";

/**
 * Shared app shell that swaps sidebar vs. bottom navigation.
 * Now supports full-screen mobile subject selection for Admin/Dean roles.
 */
const Layout = () => {
  const [role_id, setRoleId] = useState(null);
  const navigate = useNavigate();
  
  // Load selectedSubject from localStorage on mount
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const saved = localStorage.getItem("selectedSubject");
    return saved ? JSON.parse(saved) : null;
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const location = useLocation();

  const roleMap = {
    1: "Student",
    2: "Faculty",
    3: "Program Chair",
    4: "Dean",
    5: "Associate Dean",
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setRoleId(user.roleID ?? user.roleId);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem("selectedSubject", JSON.stringify(selectedSubject));
    } else {
      localStorage.removeItem("selectedSubject");
    }
  }, [selectedSubject]);

  const roleTitle =
    role_id !== null && roleMap[role_id] ? roleMap[role_id] : "User";

  const isStudent = Number(role_id) === 1;
  const isTutorialPage = location.pathname.includes("/help");

  // Reusable item object for the subject dropdowns
  const subjectItem = { icon: "bx-book-bookmark", label: "Classes" };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <div className="flex">
        {/* Desktop Sidebar */}
        {!isStudent && !isTutorialPage && !isMobile && (
          <Sidebar
            role_id={role_id}
            setSelectedSubject={setSelectedSubject}
            selectedSubject={selectedSubject}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          />
        )}
        <div
          className={`flex min-w-0 overflow-hidden flex-1 flex-col transition-all duration-200 ${
            isStudent || isTutorialPage
              ? "ml-0"
              : isMobile
                ? "ml-0"
                : isExpanded
                  ? "ml-[307px]"
                  : "ml-[55.5px]"
          }`}
        >
          <Header title={roleTitle} />
          <main className={isTutorialPage ? "pt-14" : "pt-14 px-0 pb-30"}>
            <Outlet context={{ selectedSubject, setSelectedSubject }} />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation triggered for everyone on mobile devices */}
      {isMobile && (
        <BottomNav
          role={role_id}
          onPrintClick={() => setShowPrintModal(true)}
          onSubjectClick={() => setShowSubjectModal(true)}
        />
      )}

      {/* Full-screen Subject Selection Modal triggered by the BottomNav Subjects button */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-black p-4 overflow-y-auto animate-fade-in">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Subject</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose a subject to manage content</p>
            </div>
            <button 
              onClick={() => setShowSubjectModal(false)} 
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            >
              <i className="bx bx-x text-3xl"></i>
            </button>
          </div>

          <div className="mobile-subject-list mt-4">
            {/* 
              Render the correct dropdown component based on role.
              We pass all required props (item, isExpanded, etc.) to ensure 
              the components render correctly without crashing.
            */}
            {role_id === 4 || role_id === 5 ? (
              <AllSubjectsDropDown
                item={subjectItem}
                isExpanded={true}
                setIsExpanded={setIsExpanded}
                parsedRoleId={role_id}
                isSubjectFocused={false}
                setIsSubjectFocused={() => {}}
                homePath="/dean/subjects"
                className="bx bx-newspaper"
                selectedSubject={selectedSubject}
                showDirectly={true} // Add this to skip the icon
                setSelectedSubject={(subj) => {
                  setSelectedSubject(subj);
                  setShowSubjectModal(false);
                  navigate("/dean/subjects");
                }}
              />
            ) : role_id === 3 ? (
              <AllSubjectsDropDownProgramChair
                item={subjectItem}
                isExpanded={true}
                setIsExpanded={setIsExpanded}
                parsedRoleId={role_id}
                isSubjectFocused={false}
                setIsSubjectFocused={() => {}}
                homePath="/program-chair/subjects"
                className="bx bx-newspaper"
                selectedSubject={selectedSubject}
                showDirectly={true}
                setSelectedSubject={(subj) => {
                  setSelectedSubject(subj);
                  setShowSubjectModal(false);
                  navigate("/program-chair/subjects");
                }}
              />
            ) : (
              <AssignedSubjectsDropDown
                item={subjectItem}
                isExpanded={true}
                setIsExpanded={setIsExpanded}
                parsedRoleId={role_id}
                isSubjectFocused={false}
                setIsSubjectFocused={() => {}}
                homePath="/faculty/subjects"
                className="bx bx-newspaper"
                selectedSubject={selectedSubject}
                showDirectly={true}
                setSelectedSubject={(subj) => {
                  setSelectedSubject(subj);
                  setShowSubjectModal(false);
                  navigate("/faculty/subjects");
                }}
              />
            )}
          </div>
        </div>
      )}

      <PrintExamModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
};

export default Layout;
