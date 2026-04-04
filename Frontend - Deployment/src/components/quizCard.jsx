import React, { useState, useRef, useEffect } from "react";
import SubPhoto from "../assets/gottfield.jpg";
import { Textfit } from "react-textfit";

// Card component for personal quizzes, styled to match SubjectCard
const QuizCard = ({
  quiz,
  quizTypeLabel,
  searchQuery,
  setSearchQuery,
  onSettingsClick,
  onAddQuestionClick,
  onImportQuestionClick,
  onDownloadWorksheetClick,
  onAssignToClassClick,
  onEditQuiz,
  onArchiveQuiz,
  isLoading = false,
}) => {
  if (!quiz && !isLoading) return null;
  if (isLoading) return null;

  const hasSubject = !!quiz.subject;
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileActionButtonRef = useRef(null);
  const desktopActionButtonRef = useRef(null);
  const mobileActionDropdownRef = useRef(null);
  const desktopActionDropdownRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  useEffect(() => {
    const handlePointerDownOutside = (event) => {
      const target = event.target;

      const dropdowns = [
        mobileActionDropdownRef.current,
        desktopActionDropdownRef.current,
      ].filter(Boolean);
      const buttons = [
        mobileActionButtonRef.current,
        desktopActionButtonRef.current,
      ].filter(Boolean);

      const isInsideDropdown = dropdowns.some((el) => el.contains(target));
      const isInsideButton = buttons.some((el) => el.contains(target));

      if (!isInsideDropdown && !isInsideButton) setShowActionDropdown(false);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, []);

  useEffect(() => {
    if (showMobileSearch && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  return (
    <>
      {/* Top search bar (desktop only) - same style as SubjectCard */}
      <div className="hidden md:block">
        <div className="outfit-500 relative mx-auto -mt-3 mb-5 w-full max-w-[1250px] px-2 text-[14px]">
          <i className="bx bx-search absolute top-1/2 left-5 -translate-y-1/2 text-lg text-gray-500" />
          <input
            type="text"
            placeholder="Search questions in this quiz..."
            className="w-full rounded-full border border-gray-200 bg-white py-2 pr-10 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
            value={searchQuery || ""}
            maxLength={50}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />
          {searchQuery && setSearchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
              aria-label="Clear search"
            >
              <i className="bx bx-x text-xl" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile & Tablet layout (matches SubjectCard structure) */}
      <div className="border-color relative z-48 mt-2 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:block sm:rounded-t-md sm:pt-4 md:hidden">
        <div className="flex flex-wrap items-start justify-between sm:hidden">
          <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
            <h1 className="outfit-700 mt-2 ml-2 text-[18px] font-bold break-words">
              {quiz.title || "Untitled Quiz"}
            </h1>
            <div className="outfit-400 mt-2 ml-2 flex gap-1 text-gray-500">
              <i className="bx bx-book mt-[1px] text-lg"></i>
              {quizTypeLabel && quizTypeLabel === "Custom" && (
                <p className="text-[14px]">{quizTypeLabel}</p>
              )}
              {hasSubject && (
                <>
                  <p className="text-[14px]">
                    {quiz.subject.subjectCode || "-"}
                  </p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">
                    {quiz.subject.subjectName || "-"}
                  </p>
                </>
              )}
            </div>
          </div>
          <img
            src={SubPhoto}
            alt="Quiz"
            className="border-color mt-1 size-20 rounded-md border object-cover"
          />
        </div>

        {/* Tablet header */}
        <div className="hidden flex-wrap items-center sm:flex">
          <img
            src={SubPhoto}
            alt="Quiz"
            className="border-color mr-5 size-18 rounded-md border object-cover"
          />
          <div className="flex max-w-[calc(100%-125px)] flex-col flex-wrap">
            <h1 className="outfit-700 text-[15px] font-bold break-words md:text-[18px]">
              {quiz.title || "Untitled Quiz"}
            </h1>
            <div className="outfit-400 mt-1 flex gap-1 text-gray-500">
              <i className="bx bx-book mt-[1px] text-lg"></i>
              {quizTypeLabel && quizTypeLabel === "Custom" && (
                <p className="text-[14px]">{quizTypeLabel}</p>
              )}
              {hasSubject && (
                <>
                  <p className="text-[14px]">
                    {quiz.subject.subjectCode || "-"}
                  </p>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="text-[14px]">
                    {quiz.subject.subjectName || "-"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile / Tablet buttons, styled similarly to SubjectCard */}
        <div className="mt-7 mb-1 flex w-full flex-row flex-wrap items-center gap-2 font-semibold sm:flex md:hidden">
          <div className="outfit-500 flex flex-row flex-wrap items-center gap-2">
            <button
              onClick={() =>
                alert("Quiz preview will be available in a future update.")
              }
              className="mb-3 flex cursor-pointer items-center gap-1 rounded-xl border border-b-3 border-orange-600 bg-orange-500 px-4 py-2 text-[12px] text-white transition-all duration-100 hover:bg-orange-600 active:translate-y-[2px] active:border-b-2"
            >
              <i className="bx bx-eye-big text-[15px]"></i>
              <span>Preview</span>
            </button>
            <button
              onClick={onSettingsClick}
              className="border-color mb-3 flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-[12px] text-gray-700 transition hover:bg-gray-100"
            >
              <i className="bx bx-cog text-[15px]"></i>
              <span>Assign</span>
            </button>
          </div>
          <div className="flex flex-row flex-wrap items-center gap-2">
            <div className="relative mb-3 flex items-center gap-2">
              {/* Mobile search toggle button */}
              {setSearchQuery && (
                <button
                  type="button"
                  onClick={() => setShowMobileSearch((prev) => !prev)}
                  className="border-color flex cursor-pointer items-center justify-center rounded-xl border bg-white px-2 py-[7px] text-gray-700 transition-all duration-100 hover:bg-gray-100"
                  aria-label={
                    showMobileSearch ? "Close search" : "Search in quiz"
                  }
                >
                  <i
                    className={`bx ${showMobileSearch ? "bx-x" : "bx-search"} text-[22px]`}
                  ></i>
                </button>
              )}
              <button
                ref={mobileActionButtonRef}
                type="button"
                onClick={() => setShowActionDropdown((prev) => !prev)}
                className="border-color flex cursor-pointer items-center justify-center rounded-xl border bg-white px-2 py-[7px] text-gray-700 transition-all duration-100 hover:bg-gray-100"
              >
                <i className="bx bx-dots-vertical-rounded text-2xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only search bar below the card, similar placement to SubjectCard */}
      {setSearchQuery && (
        <div className="mt-3 mb-3 md:hidden">
          {showMobileSearch && (
            <div className="outfit-500 relative mx-auto w-full max-w-[1250px] px-2 text-[14px]">
              <i className="bx bx-search absolute top-1/2 left-5 -translate-y-1/2 text-lg text-gray-500" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search questions in this quiz..."
                className="w-full rounded-full border border-gray-200 bg-white py-2 pr-10 pl-10 text-sm text-gray-900 transition-all focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                value={searchQuery || ""}
                maxLength={50}
                onChange={(e) =>
                  setSearchQuery && setSearchQuery(e.target.value)
                }
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <i className="bx bx-x text-xl" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile bottom-sheet action menu (match SubjectCard style) */}
      {showActionDropdown && (
        <div
          ref={mobileActionDropdownRef}
          className="outfit-500 lightbox-bg fixed inset-0 z-100 flex items-end justify-center md:hidden"
          onClick={() => setShowActionDropdown(false)}
        >
          <div
            className="animate-fade-in-up w-full rounded-t-2xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3">
              <h2 className="outfit-700 text-[16px] sm:text-[14px]">
                Select an option
              </h2>
            </div>
            <div className="bg-color h-[0.5px] w-full" />
            <div className="flex flex-col py-2 text-[16px] sm:text-[14px]">
              <button
                type="button"
                onClick={() => {
                  setShowActionDropdown(false);
                  onImportQuestionClick && onImportQuestionClick();
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left text-gray-700 hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-folder-input-icon lucide-folder-input"
                >
                  <path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1" />
                  <path d="M2 13h10" />
                  <path d="m9 16 3-3-3-3" />
                </svg>
                <span>Import questions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowActionDropdown(false);
                  onDownloadWorksheetClick && onDownloadWorksheetClick();
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left text-gray-700 hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-download-icon lucide-download"
                >
                  <path d="M12 15V3" />
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m7 10 5 5 5-5" />
                </svg>
                <span>Download worksheet</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowActionDropdown(false);
                  onEditQuiz && onEditQuiz();
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left text-gray-700 hover:bg-gray-100"
              >
                <i className="bx bx-edit-alt text-xl"></i>
                <span>Edit quiz</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowActionDropdown(false);
                  onArchiveQuiz && onArchiveQuiz();
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-6 py-3 text-left text-red-500 hover:bg-gray-100"
              >
                <i className="bx bx-archive text-xl"></i>
                <span>Archive quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop layout (matches SubjectCard desktop structure) */}
      <div className="border-color relative z-48 mx-auto -mt-3 hidden max-w-[1200px] overflow-visible border-b bg-white px-6 pt-6 pb-2 md:block">
        {/* Card header/content */}
        <div className="flex w-full flex-col items-center pb-4 md:flex-row md:flex-nowrap md:items-center">
          <div className="relative ml-2 flex flex-col items-center md:mr-5">
            <img
              src={SubPhoto}
              alt="Quiz"
              className="border-color size-21 rounded-md border object-cover"
            />
          </div>
          <div className="outfit flex max-w-full min-w-0 flex-col flex-wrap md:max-w-[calc(100%-260px)]">
            <div className="outfit line-clamp-2">
              <Textfit
                mode="multi"
                min={14}
                max={20}
                style={{
                  fontWeight: 600,
                  lineHeight: "1.2",
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                <span className="text-[18px]">
                  {quiz.title || "Untitled Quiz"}
                </span>
              </Textfit>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-gray-500">
              <i className="bx bx-book mt-[1px] text-[16px]"></i>
              {quizTypeLabel && (
                <p className="outfit-400 text-[14px]">{quizTypeLabel}</p>
              )}
              {hasSubject && (
                <>
                  <span className="mx-1 mt-[2px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="outfit-400 text-[14px]">
                    {quiz.subject.subjectCode || "-"}
                  </p>
                  <span className="mx-1 mt-[2px] align-middle leading-none text-gray-400">
                    •
                  </span>
                  <p className="outfit-400 text-[14px]">
                    {quiz.subject.subjectName || "-"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Button Row - left/right groups */}
        <div className="outfit mt-2 mb-3 flex w-full flex-row items-center justify-between gap-4 font-semibold">
          {/* Left side: Worksheet, Import, dropdown for Add/Edit/Archive */}
          <div className="flex flex-row items-center gap-2">
            <button
              onClick={onDownloadWorksheetClick}
              className="outfit-500 flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-download-icon lucide-download"
              >
                <path d="M12 15V3" />
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
              </svg>
              <span>Worksheet</span>
            </button>
            <button
              onClick={onImportQuestionClick}
              className="outfit-500 flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-folder-symlink-icon lucide-folder-symlink"
              >
                <path d="M2 9.35V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7" />
                <path d="m8 16 3-3-3-3" />
              </svg>
              <span>Import</span>
            </button>
          </div>

          {/* Right side: Assign, Settings, Preview */}
          <div className="flex flex-row items-center gap-2">
            <div className="relative">
              <button
                ref={desktopActionButtonRef}
                type="button"
                onClick={() => setShowActionDropdown((prev) => !prev)}
                className="border-color flex cursor-pointer items-center justify-center rounded-xl border bg-white px-2 py-2 text-gray-700 transition hover:bg-gray-100"
              >
                <i className="bx bx-dots-vertical-rounded text-2xl"></i>
              </button>
              {showActionDropdown && (
                <div
                  ref={desktopActionDropdownRef}
                  className="outfit-500 border-color animate-fadein absolute right-0 z-50 mt-2 w-44 origin-top-left rounded-md border bg-white p-1 text-gray-700 shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionDropdown(false);
                      onEditQuiz && onEditQuiz();
                    }}
                    className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <i className="bx bx-edit-alt text-base"></i>
                    <span>Edit Quiz</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionDropdown(false);
                      onArchiveQuiz && onArchiveQuiz();
                    }}
                    className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <i className="bx bx-archive text-base"></i>
                    <span>Archive Quiz</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onSettingsClick}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-b-4 border-orange-300 bg-orange-100 px-4 py-2 text-orange-600 transition-all duration-100 hover:bg-orange-200 hover:text-orange-500 active:translate-y-[2px] active:border-b-2"
            >
              <i className="bx bxs-cog text-xl"></i>
              <span className="outfit-500 text-[14px]">Assign</span>
            </button>
            <button
              onClick={() =>
                alert("Quiz preview will be available in a future update.")
              }
              className="outfit-500 flex cursor-pointer items-center gap-2 rounded-xl border border-b-4 border-orange-600 bg-orange-500 px-4 py-2 text-[14px] text-white transition-all duration-100 hover:bg-orange-600 active:translate-y-[2px] active:border-b-2"
            >
              <i className="bx bx-eye-big text-xl"></i>
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizCard;
