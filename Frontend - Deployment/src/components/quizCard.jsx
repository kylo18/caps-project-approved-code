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
  const SkeletonLoader = () => (
    <>
      {/* Desktop skeleton - match SubjectCard */}
      <div className="border-color relative z-51 mx-auto mb-6 hidden max-w-[1200px] overflow-hidden rounded-xl border-b border bg-white px-6 pt-6 pb-2 sm:block lg:max-w-[1200px]">
        <div className="flex animate-pulse items-center space-x-4">
          <div className="skeleton shimmer h-21 w-21 rounded-md"></div>
          <div className="flex-1">
            <div className="skeleton shimmer mb-2 h-8 w-1/2"></div>
            <div className="skeleton shimmer h-4 w-2/8 rounded"></div>
          </div>
        </div>
        <div className="outfit mt-2 mb-3 flex w-full flex-row items-center justify-between gap-4 font-semibold">
          <div className="flex gap-2">
            <div className="skeleton shimmer h-10 w-28 rounded-xl"></div>
            <div className="skeleton shimmer h-10 w-28 rounded-xl"></div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton shimmer h-10 w-10 rounded-xl"></div>
            <div className="skeleton shimmer h-10 w-28 rounded-xl"></div>
            <div className="skeleton shimmer h-10 w-28 rounded-xl"></div>
            <div className="skeleton shimmer h-10 w-28 rounded-xl"></div>
          </div>
        </div>
      </div>

      {/* Mobile skeleton - match SubjectCard */}
      <div className="border-color relative z-48 -mx-2 mt-2 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:hidden sm:rounded-t-md sm:pt-4 md:hidden">
        <div className="flex flex-wrap items-start justify-between">
          <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
            <div className="skeleton shimmer mt-2 mb-2 ml-2 h-8 w-58 rounded"></div>
            <div className="mt-2 ml-2 flex gap-1">
              <div className="skeleton shimmer h-5 w-38 rounded"></div>
            </div>
          </div>
          <div className="skeleton shimmer mt-1 size-20 rounded-md"></div>
        </div>
        <div className="outfit mt-7 flex w-full flex-row items-center justify-between gap-2 font-semibold">
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-28 rounded-md"></div>
          <div className="skeleton shimmer mb-6 h-9 w-9 rounded-md"></div>
        </div>
      </div>
      <div className="border-color relative z-48 -mx-2 -mt-2 mb-5 h-12 overflow-visible border-b bg-gray-100 px-4 pt-6 sm:mx-0 sm:hidden sm:rounded-t-md sm:pt-4 md:hidden"></div>
    </>
  );

  if (!quiz && !isLoading) return null;
  if (isLoading) {
    return <SkeletonLoader />;
  }

  const hasSubject = !!quiz.subject;
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const actionButtonRef = useRef(null);
  const actionDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target) &&
        !actionButtonRef.current.contains(event.target)
      ) {
        setShowActionDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Top search bar (desktop & mobile) - same style as SubjectCard */}
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

      {/* Mobile & Tablet layout (matches SubjectCard structure) */}
      <div className="border-color relative z-48 -mx-2 mt-2 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:block sm:rounded-t-md sm:pt-4 md:hidden">
        <div className="flex flex-wrap items-start justify-between sm:hidden">
          <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
            <h1 className="outfit mt-2 ml-2 text-[18px] font-bold break-words">
              {quiz.title || "Untitled Quiz"}
            </h1>
            <div className="mt-2 ml-2 flex gap-1 text-gray-500">
              <i className="bx bx-book mt-[1px] text-lg"></i>
              {quizTypeLabel && <p className="text-[14px]">{quizTypeLabel}</p>}
              {hasSubject && (
                <>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
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
            <h1 className="outfit text-[15px] font-bold break-words md:text-[18px]">
              {quiz.title || "Untitled Quiz"}
            </h1>
            <div className="mt-1 flex gap-1 text-gray-500">
              <i className="bx bx-book mt-[1px] text-lg"></i>
              {quizTypeLabel && <p className="text-[14px]">{quizTypeLabel}</p>}
              {hasSubject && (
                <>
                  <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                    •
                  </span>
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
        <div className="outfit mt-7 mb-1 flex w-full flex-row flex-wrap items-center justify-between gap-2 font-semibold sm:flex md:hidden">
          {/* Left side: Worksheet, Import, dropdown */}
          <div className="flex flex-row flex-wrap items-center gap-2">
            <button
              onClick={onDownloadWorksheetClick}
              className="border-color mb-3 flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100"
            >
              <i className="bx bx-download text-lg"></i>
              <span>Worksheet</span>
            </button>
            <button
              onClick={onImportQuestionClick}
              className="border-color mb-3 flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100"
            >
              <i className="bx bx-import text-lg"></i>
              <span>Import</span>
            </button>
            <div className="relative mb-3">
              <button
                ref={actionButtonRef}
                onClick={() => setShowActionDropdown((prev) => !prev)}
                className="border-color flex cursor-pointer items-center justify-center rounded-xl border bg-white px-2 py-[7px] text-gray-700 transition-all duration-100 hover:bg-gray-100"
              >
                <i className="bx bx-dots-vertical-rounded text-2xl"></i>
              </button>
              {showActionDropdown && (
                <div
                  ref={actionDropdownRef}
                  className="border-color animate-fadein absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-md border bg-white p-1 text-gray-700 shadow-lg"
                >
                  <button
                    onClick={() => {
                      setShowActionDropdown(false);
                      onAddQuestionClick && onAddQuestionClick();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <i className="bx bx-plus text-base"></i>
                    <span>Add Question</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowActionDropdown(false);
                      onEditQuiz && onEditQuiz();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <i className="bx bx-edit-alt text-base"></i>
                    <span>Edit Quiz</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowActionDropdown(false);
                      onArchiveQuiz && onArchiveQuiz();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100"
                  >
                    <i className="bx bx-archive text-base"></i>
                    <span>Archive Quiz</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Assign, Settings, Preview */}
          <div className="flex flex-row flex-wrap items-center gap-2">
            <button
              onClick={onAssignToClassClick}
              className="border-color mb-3 flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100"
            >
              <i className="bx bx-group text-lg"></i>
              <span>Assign</span>
            </button>
            <button
              onClick={onSettingsClick}
              className="border-color mb-3 flex cursor-pointer items-center gap-1 rounded-xl border bg-white px-4 py-2 text-[14px] text-gray-700 transition hover:bg-gray-100"
            >
              <i className="bx bx-cog text-lg"></i>
              <span>Settings</span>
            </button>
            <button
              onClick={() =>
                alert("Quiz preview will be available in a future update.")
              }
              className="border-color mb-3 flex cursor-pointer items-center gap-1 rounded-xl border border-b-4 border-orange-600 bg-orange-500 px-4 py-2 text-[14px] text-white transition-all duration-100 hover:bg-orange-600 active:translate-y-[2px] active:border-b-2"
            >
              <i className="bx bx-eye-big text-lg"></i>
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

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
                ref={actionButtonRef}
                onClick={() => setShowActionDropdown((prev) => !prev)}
                className="border-color flex cursor-pointer items-center justify-center rounded-xl border bg-white px-2 py-2 text-gray-700 transition hover:bg-gray-100"
              >
                <i className="bx bx-dots-vertical-rounded text-2xl"></i>
              </button>
              {showActionDropdown && (
                <div
                  ref={actionDropdownRef}
                  className="outfit-500 border-color animate-fadein absolute right-0 z-50 mt-2 w-44 origin-top-left rounded-md border bg-white p-1 text-gray-700 shadow-lg"
                >
                  <button
                    onClick={() => {
                      setShowActionDropdown(false);
                      onAddQuestionClick && onAddQuestionClick();
                    }}
                    className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <i className="bx bx-plus text-base"></i>
                    <span>Add Question</span>
                  </button>
                  <button
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
              onClick={onAssignToClassClick}
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
                class="lucide lucide-bookmark-plus-icon lucide-bookmark-plus"
              >
                <path d="M12 7v6" />
                <path d="M15 10H9" />
                <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" />
              </svg>
              <span>Assign</span>
            </button>
            <button
              onClick={onSettingsClick}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-b-4 border-orange-300 bg-orange-100 px-4 py-2 text-orange-600 transition-all duration-100 hover:bg-orange-200 hover:text-orange-500 active:translate-y-[2px] active:border-b-2"
            >
              <i className="bx bxs-cog text-xl"></i>
              <span className="outfit-500 text-[14px]">Settings</span>
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
