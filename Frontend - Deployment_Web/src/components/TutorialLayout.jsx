import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { navSections, faqData } from "./tutorialData";
import collegeLogo from "/src/assets/college-logo.png";
import {
  IntroductionSection,
  QuickStartSection,
  RolesSection,
  LoginSection,
  RegisterSection,
  PasswordRecoverySection,
  TakingExamsSection,
  TimerSection,
  ScoresSection,
  AnalyticsSection,
  SubjectSelectionSection,
  ClassesOverviewSection,
  CreatingClassSection,
  JoiningClassSection,
  ManagingStudentsSection,
  ArchivingClassesSection,
  QuizzesOverviewSection,
  CreatingQuizSection,
  AssigningQuizSection,
  TakingQuizSection,
  QuizResultsSection,
  AddingQuestionsSection,
  EditingQuestionsSection,
  ApprovalWorkflowSection,
  DifficultySection,
  PrintingExamsSection,
  ApprovingQuestionsSection,
  ManagingSubjectsSection,
  ViewingReportsSection,
  UserManagementSection,
  SystemOversightSection,
  RoleAssignmentSection,
  PrintingOfficialSection,
  CategorizedQuestionsSection,
  FilteringSection,
  DifficultyLevelsSection,
  RandomizationSection,
  FAQSection,
} from "./TutorialSections";

const SECTION_MAP = {
  introduction: IntroductionSection,
  "quick-start": QuickStartSection,
  roles: RolesSection,
  login: LoginSection,
  register: RegisterSection,
  "password-recovery": PasswordRecoverySection,
  "taking-exams": TakingExamsSection,
  timer: TimerSection,
  scores: ScoresSection,
  analytics: AnalyticsSection,
  "subject-selection": SubjectSelectionSection,
  "classes-overview": ClassesOverviewSection,
  "creating-class": CreatingClassSection,
  "joining-class": JoiningClassSection,
  "managing-students": ManagingStudentsSection,
  "archiving-classes": ArchivingClassesSection,
  "quizzes-overview": QuizzesOverviewSection,
  "creating-quiz": CreatingQuizSection,
  "assigning-quiz": AssigningQuizSection,
  "taking-quiz": TakingQuizSection,
  "quiz-results": QuizResultsSection,
  "adding-questions": AddingQuestionsSection,
  "editing-questions": EditingQuestionsSection,
  "approval-workflow": ApprovalWorkflowSection,
  difficulty: DifficultySection,
  "printing-exams": PrintingExamsSection,
  "approving-questions": ApprovingQuestionsSection,
  "managing-subjects": ManagingSubjectsSection,
  "viewing-reports": ViewingReportsSection,
  "user-management": UserManagementSection,
  "system-oversight": SystemOversightSection,
  "role-assignment": RoleAssignmentSection,
  "printing-official": PrintingOfficialSection,
  "categorized-questions": CategorizedQuestionsSection,
  filtering: FilteringSection,
  "difficulty-levels": DifficultyLevelsSection,
  randomization: RandomizationSection,
};

const TutorialLayout = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("introduction");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] = useState(false);
  const contentRef = useRef(null);

  // All nav items flattened for searching
  const allItems = navSections.flatMap((s) => s.items);

  const filteredSections = searchQuery.trim()
    ? navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((section) => section.items.length > 0)
    : navSections;

  const handleNavClick = useCallback((id) => {
    setActiveTab(id);
    setMobileNavOpen(false);
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("tutorial-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const renderContent = () => {
    if (activeTab === "faq") {
      return <FAQSection faqData={faqData} />;
    }
    const SectionComponent = SECTION_MAP[activeTab];
    if (SectionComponent) return <SectionComponent />;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <i className="bx bx-book-open text-5xl"></i>
        <p className="mt-3 text-sm">Select a topic from the sidebar</p>
      </div>
    );
  };

  // Find current item title for mobile breadcrumb
  const currentItem = allItems.find((i) => i.id === activeTab) || {
    title: "FAQ",
    icon: "bx-help-circle",
  };

  return (
    <div className="outfit-300 flex h-screen flex-col bg-[#fafafa]">
      {/* ──── CUSTOM HEADER ──── */}
      <header className="outfit-500 fixed top-0 left-0 z-50 flex h-[44px] w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-2">
          <img src={collegeLogo} alt="CAPS Logo" className="size-[28px]" />
          <span className="text-[14px] font-semibold text-gray-800">CAPS</span>
          <span className="text-gray-300">|</span>
          <span className="text-[12px] font-medium text-gray-400">
            Documentation
          </span>
        </div>

        {/* Right: Nav links (desktop) */}
        <nav className="hidden items-center gap-5 text-[13px] font-medium text-gray-500 md:flex">
          <a
            onClick={() => navigate("/")}
            className="cursor-pointer transition-colors hover:text-gray-800"
          >
            Home
          </a>
          <a
            onClick={() => alert("Application is coming soon")}
            className="cursor-pointer transition-colors hover:text-gray-800"
          >
            Download
          </a>
          <a
            href="/#feedback"
            className="transition-colors hover:text-gray-800"
          >
            Feedback
          </a>
          <a
            href="/team-caps"
            className="transition-colors hover:text-gray-800"
          >
            Developers
          </a>
        </nav>

        {/* Right: Hamburger (mobile) */}
        <button
          onClick={() => setMobileHeaderMenuOpen(!mobileHeaderMenuOpen)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-gray-100 md:hidden"
        >
          <i
            className={`bx ${mobileHeaderMenuOpen ? "bx-x" : "bx-menu"} text-xl text-gray-600`}
          ></i>
        </button>
      </header>

      {/* Mobile header dropdown */}
      {mobileHeaderMenuOpen && (
        <div className="fixed top-[44px] right-0 left-0 z-40 border-b border-gray-200 bg-white shadow-lg md:hidden">
          <nav className="flex flex-col px-6 py-3 text-[13px] font-medium text-gray-600">
            <a
              onClick={() => {
                navigate("/");
                setMobileHeaderMenuOpen(false);
              }}
              className="cursor-pointer py-2.5 transition-colors hover:text-gray-900"
            >
              Home
            </a>
            <a
              onClick={() => {
                alert("Application is coming soon");
                setMobileHeaderMenuOpen(false);
              }}
              className="cursor-pointer py-2.5 transition-colors hover:text-gray-900"
            >
              Download
            </a>
            <a
              href="/#feedback"
              onClick={() => setMobileHeaderMenuOpen(false)}
              className="py-2.5 transition-colors hover:text-gray-900"
            >
              Feedback
            </a>
            <a
              href="/team-caps"
              onClick={() => setMobileHeaderMenuOpen(false)}
              className="py-2.5 transition-colors hover:text-gray-900"
            >
              Developers
            </a>
          </nav>
        </div>
      )}

      {/* ──── BODY (below header) ──── */}
      <div className="flex flex-1 pt-[44px]">
        {/* ──── SIDEBAR (desktop) ──── */}
        <aside className="fixed top-[44px] bottom-0 left-0 z-40 hidden w-[272px] shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="custom-scrollbar flex h-[calc(100vh-44px)] flex-col">
            {/* Search */}
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
                <input
                  id="tutorial-search"
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-[13px] text-gray-700 transition-colors outline-none placeholder:text-gray-400 focus:border-orange-300 focus:bg-white"
                />
                <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                  Ctrl K
                </kbd>
              </div>
            </div>

            {/* Nav sections */}
            <nav className="flex-1 overflow-y-auto px-3 pt-1 pb-6">
              {filteredSections.map((section, si) => (
                <div key={si} className={si > 0 ? "mt-5" : "mt-2"}>
                  <span className="mb-1 block px-3 text-[11px] tracking-wider text-gray-600">
                    {section.label}
                  </span>
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-[7px] text-left text-[13px] transition-all duration-150 ${
                        activeTab === item.id
                          ? "bg-orange-50 font-semibold text-orange-600"
                          : "font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      <i
                        className={`bx ${item.icon} text-base ${
                          activeTab === item.id
                            ? "text-orange-500"
                            : "text-gray-400"
                        }`}
                      ></i>
                      {item.title}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-[11px] text-gray-400">
                Practice Exam System · v2.0
              </p>
            </div>
          </div>
        </aside>

        {/* ──── MOBILE NAV OVERLAY ──── */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <aside
              className="absolute top-0 left-0 h-full w-[280px] bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <span className="text-sm font-bold text-gray-800">
                  Documentation
                </span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <i className="bx bx-x text-xl text-gray-500"></i>
                </button>
              </div>

              {/* Mobile search */}
              <div className="px-4 pt-3 pb-1">
                <div className="relative">
                  <i className="bx bx-search absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-[13px] outline-none focus:border-orange-300"
                  />
                </div>
              </div>

              <nav className="custom-scrollbar h-[calc(100%-110px)] overflow-y-auto px-3 pt-2 pb-6">
                {filteredSections.map((section, si) => (
                  <div key={si} className={si > 0 ? "mt-4" : ""}>
                    <span className="mb-1 block px-3 text-[11px] font-bold tracking-wider text-gray-400">
                      {section.label}
                    </span>
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-[7px] text-left text-[13px] transition-all duration-150 ${
                          activeTab === item.id
                            ? "bg-orange-50 font-semibold text-orange-600"
                            : "font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                      >
                        <i
                          className={`bx ${item.icon} text-base ${
                            activeTab === item.id
                              ? "text-orange-500"
                              : "text-gray-400"
                          }`}
                        ></i>
                        {item.title}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* ──── MAIN CONTENT ──── */}
        <div className="flex flex-1 flex-col lg:ml-[272px]">
          {/* Mobile top bar */}
          <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5 lg:hidden">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <i className="bx bx-menu text-xl text-gray-600"></i>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <i className={`bx ${currentItem.icon} text-orange-400`}></i>
              <span className="font-medium text-gray-700">
                {currentItem.title}
              </span>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            ref={contentRef}
            className="custom-scrollbar flex-1 overflow-y-auto"
          >
            <div className="mx-auto max-w-5xl px-6 py-8 sm:px-10 lg:py-10">
              {renderContent()}

              {/* Footer */}
              <div className="mt-12 border-t border-gray-200 pt-6 pb-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="text-xs text-gray-400">
                    © 2025 CAPS · Documentation
                  </p>
                  <div className="flex gap-4">
                    {/* Prev / Next nav */}
                    {(() => {
                      const flatItems = [
                        ...allItems,
                        { id: "faq", title: "FAQ" },
                      ];
                      const idx = flatItems.findIndex(
                        (i) => i.id === activeTab,
                      );
                      const prev = idx > 0 ? flatItems[idx - 1] : null;
                      const next =
                        idx < flatItems.length - 1 ? flatItems[idx + 1] : null;
                      return (
                        <>
                          {prev && (
                            <button
                              onClick={() => handleNavClick(prev.id)}
                              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-orange-500"
                            >
                              <i className="bx bx-chevron-left"></i>
                              {prev.title}
                            </button>
                          )}
                          {next && (
                            <button
                              onClick={() => handleNavClick(next.id)}
                              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-orange-500"
                            >
                              {next.title}
                              <i className="bx bx-chevron-right"></i>
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialLayout;
