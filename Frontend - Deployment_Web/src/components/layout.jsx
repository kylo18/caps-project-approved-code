import { useEffect, useState } from "react";
import Sidebar from "./sideBar";
import Header from "./header";
import { Outlet, useLocation } from "react-router-dom";

// Main Layout
const Layout = () => {
  const [role_id, setRoleId] = useState(null);
  // Load selectedSubject from localStorage on mount
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const saved = localStorage.getItem("selectedSubject");
    return saved ? JSON.parse(saved) : null;
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubjectExpanded, setIsSubjectExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1025);
  const location = useLocation();

  const roleMap = {
    1: "Student",
    2: "Faculty",
    3: "Program Chair",
    4: "Dean",
    5: "Associate Dean",
  };

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && (user.roleID !== undefined || user.roleId !== undefined)) {
      setRoleId(user.roleID ?? user.roleId);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1025);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Persist selectedSubject to localStorage whenever it changes
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
  const isStudentQuizPage = /^\/quiz\/[^/]+$/.test(location.pathname);
  const isTutorialPage = location.pathname.includes("/help");
  const isPrintQualifyingExam =
    location.pathname === "/print-qualification-exam";
  const isPrintPersonalQuiz = location.pathname === "/print-personal-quiz";
  // Hide sidebar for quiz info, quiz taking, and quiz result pages
  const isQuizPage =
    location.pathname.includes("/quiz-info/") ||
    location.pathname.includes("/quiz/") ||
    location.pathname.includes("/quiz-result/");
  // Hide sidebar for practice exam pages
  const isPracticeExamPage =
    location.pathname.includes("/practice-exam") ||
    location.pathname.includes("/exam-preview");
  // Use collapsed sidebar layout for Libraries page, Archived Quiz page, and SubjectList pages
  const isLibrariesPage =
    location.pathname === "/libraries" ||
    location.pathname === "/archived-quiz" ||
    location.pathname === "/dean/subjects" ||
    location.pathname === "/asso-dean/subjects" ||
    location.pathname === "/program-chair/subjects" ||
    location.pathname === "/faculty/subjects" ||
    location.pathname === "/student/subjects";

  const isStudentDashboardPage = location.pathname === "/student-dashboard";

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        {!isTutorialPage &&
          !isPrintQualifyingExam &&
          !isPrintPersonalQuiz &&
          !isQuizPage &&
          !isPracticeExamPage && (
            <Sidebar
              role_id={role_id}
              setSelectedSubject={setSelectedSubject}
              selectedSubject={selectedSubject}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
              isSubjectExpanded={isSubjectExpanded}
              setIsSubjectExpanded={setIsSubjectExpanded}
            />
          )}
        <div
          className={`flex flex-1 flex-col min-w-0 overflow-x-hidden ${
            isTutorialPage ||
            isPrintQualifyingExam ||
            isPrintPersonalQuiz ||
            isQuizPage ||
            isPracticeExamPage ||
            isMobile
              ? "ml-0"
              : isLibrariesPage
                ? "ml-[63px]"
                : "ml-[220px]"
          }`}
        >
          {!isStudentQuizPage && (
            <Header title={roleTitle} className="lg:hidden" />
          )}
          <main
            className={`${isTutorialPage || isQuizPage || isPracticeExamPage || isStudentDashboardPage ? "" : "lg:px-4"} h-full`}
          >
            <Outlet context={{ selectedSubject, setSelectedSubject }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
