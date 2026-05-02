import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ExamResultsTable from "../components/ExamResultsTable";
import { Textfit } from "react-textfit";
import Subject from "../assets/icons/papers.png";
import ConfirmModal from "../components/confirmModal";
import PrintExamModal from "../components/PrintExamModal";
import RegisterDropDownSmall from "../components/registerDropDownSmall";
import useToast from "../hooks/useToast";
import Toast from "../components/Toast";

import SubPhoto from "../assets/gottfield.jpg";

const SubjectOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Expect subject data to be passed via location.state
  const subjectFromState = location.state?.subject;
  // Optional quiz data when navigating from Libraries "View" action
  const quiz = location.state?.quiz;

  // Use local state for subject so we can update it after editing
  const [subject, setSubject] = useState(subjectFromState);

  // Update subject when location.state changes
  useEffect(() => {
    if (subjectFromState) {
      setSubject(subjectFromState);
    }
  }, [subjectFromState]);

  const [practiceCount, setPracticeCount] = useState(0);
  const [qeCount, setQECount] = useState(0);
  const [results, setResults] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit, Delete, Worksheet states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedSubject, setEditedSubject] = useState({
    subjectCode: "",
    subjectName: "",
    programID: "",
    yearLevelID: "",
  });
  const [validationError, setValidationError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [yearLevelData, setYearLevelData] = useState([]);
  const { toast, showToast } = useToast();

  const yearLevelOptions = ["1", "2", "3", "4"];

  // Fetch programs and year levels
  useEffect(() => {
    const fetchPrograms = async () => {
      const token = sessionStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      try {
        const res = await fetch(`${apiUrl}/programs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setPrograms(data.data);
        }
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };

    const fetchYearLevels = async () => {
      const token = sessionStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      try {
        const res = await fetch(`${apiUrl}/year-levels`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setYearLevelData(data.year_levels);
        }
      } catch (err) {
        console.error("Error fetching year levels:", err);
      }
    };

    fetchPrograms();
    fetchYearLevels();
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!subject?.subjectID) return;
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      try {
        // Fetch questions and results in parallel
        const [questionsRes, resultsRes] = await Promise.all([
          fetch(`${apiUrl}/subjects/${subject.subjectID}/questions`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${apiUrl}/practice-exam/results/${subject.subjectID}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        // Handle questions
        let questions = [];
        if (questionsRes.ok) {
          const data = await questionsRes.json();
          questions = data.data || [];
        }
        setPracticeCount(
          questions.filter((q) => q.purpose_id === 2 && q.status_id === 2)
            .length,
        );
        setQECount(
          questions.filter((q) => q.purpose_id === 1 && q.status_id === 2)
            .length,
        );
        // Handle results
        if (resultsRes.ok) {
          const data = await resultsRes.json();
          setResults(data.history || []);
          setAverageScore(data.averageScore);
        } else {
          setResults([]);
          setAverageScore(null);
        }
      } catch (err) {
        setPracticeCount(0);
        setQECount(0);
        setResults([]);
        setAverageScore(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [subject]);

  if (!subject) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
        <img
          src={Subject}
          alt="No pending questions"
          className="h-32 w-32 opacity-80"
        />
        <span className="mt-4 text-[15px] text-gray-500">Select a Subject</span>
        <span className="w-60 text-[13px] text-gray-400">
          To select a subject, press the subject icon on the navigation bar
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        {/* Desktop skeleton */}
        <div className="border-color relative z-51 mx-auto mt-8 hidden h-38 max-w-[1200px] overflow-hidden border-b bg-white px-6 pt-2 sm:block lg:h-[190px]">
          <div className="flex animate-pulse items-center space-x-4">
            <div className="skeleton shimmer size-20 rounded-md"></div>
            <div className="flex-1">
              <div className="skeleton shimmer mb-2 h-8 w-1/2"></div>
              <div className="skeleton shimmer h-4 w-2/8 rounded"></div>
            </div>
          </div>
          <div className="outfit mt-3 flex w-full flex-row items-end justify-end gap-2 font-semibold md:hidden">
            <div className="skeleton shimmer h-9 w-40 rounded-md"></div>
          </div>
        </div>

        {/* Mobile skeleton */}
        <div className="border-color relative z-48 -mx-2 mt-15 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:hidden sm:rounded-t-md sm:pt-4 md:hidden">
          <div className="flex flex-wrap items-start justify-between">
            <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
              <div className="skeleton shimmer mt-2 mb-2 ml-2 h-8 w-58 rounded"></div>
              <div className="mt-2 ml-2 flex gap-1">
                <div className="skeleton shimmer h-5 w-38 rounded"></div>
              </div>
            </div>
            <div className="skeleton shimmer mt-1 size-20 rounded-md"></div>
          </div>
          <div className="outfit mt-5 ml-2 flex w-full flex-row items-center justify-start gap-2 font-semibold">
            <div className="skeleton shimmer mb-6 h-9 w-40 rounded-md"></div>
          </div>
        </div>
      </>
    );
  }

  const totalCount = practiceCount + qeCount;

  // Helper function to transform program names
  const getDisplayProgramName = (programName) => {
    if (programName === "GE") {
      return "General Subject";
    }
    const programMap = {
      CE: "Civil Engineering",
      ABE: "Agricultural and Biosystems Engineering",
      EE: "Electrical Engineering",
      CpE: "Computer Engineering",
      ECE: "Electronics Engineering",
    };
    return programMap[programName] || programName;
  };

  // Edit handler
  const handleEditClick = () => {
    setEditedSubject({
      subjectCode: subject.subjectCode || "",
      subjectName: subject.subjectName || "",
      programID: subject.programID || "",
      yearLevelID: subject.yearLevelID || "",
    });
    setShowEditModal(true);
    setValidationError("");
  };

  // Save edit handler
  const handleSaveEdit = async () => {
    if (
      !editedSubject.subjectCode.trim() ||
      !editedSubject.subjectName.trim()
    ) {
      setValidationError("Please fill in all required fields");
      return;
    }

    if (editedSubject.subjectCode.length > 20) {
      setValidationError("Code must be 20 characters or less");
      return;
    }

    const token = sessionStorage.getItem("token");
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    setIsEditing(true);
    setValidationError("");

    try {
      const response = await fetch(
        `${apiUrl}/subjects/${subject.subjectID}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subjectCode: editedSubject.subjectCode,
            subjectName: editedSubject.subjectName,
            programID: editedSubject.programID,
            yearLevelID: editedSubject.yearLevelID,
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        // Update the subject in local state
        const updatedSubject = {
          ...subject,
          subjectCode: editedSubject.subjectCode,
          subjectName: editedSubject.subjectName,
          programID: editedSubject.programID,
          yearLevelID: editedSubject.yearLevelID,
        };
        setSubject(updatedSubject);
        // Update the location state as well
        navigate(location.pathname + location.search, {
          state: { subject: updatedSubject, quiz },
          replace: true,
        });
        setShowEditModal(false);
        setEditedSubject({
          subjectCode: "",
          subjectName: "",
          programID: "",
          yearLevelID: "",
        });
        showToast("Subject updated successfully", "success");
      } else {
        showToast(result.message || "Failed to update subject", "error");
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      showToast("An error occurred while updating subject", "error");
    } finally {
      setIsEditing(false);
    }
  };

  // Delete handler
  const handleDeleteClick = () => {
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;

    const token = sessionStorage.getItem("token");
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    setIsDeleting(true);

    try {
      const response = await fetch(
        `${apiUrl}/subjects/${subjectToDelete.subjectID}/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setShowDeleteModal(false);
        setSubjectToDelete(null);
        showToast("Subject deleted successfully", "success");
        // Navigate back to subject list
        const user = JSON.parse(sessionStorage.getItem("user"));
        const roleID = user?.roleID ?? user?.roleId;
        let path = "/dean/subjects";
        if (Number(roleID) === 2) path = "/faculty/subjects";
        else if (Number(roleID) === 3) path = "/program-chair/subjects";
        navigate(path);
      } else {
        showToast("Failed to delete subject", "error");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      showToast("An error occurred while deleting subject", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Worksheet handler
  const handleWorksheetClick = () => {
    setIsWorksheetModalOpen(true);
  };

  return (
    <>
      {/* Mobile version: block on mobile, hidden on md+ */}
      <div className="block md:hidden">
        <div className="border-color relative z-48 mt-15 overflow-visible border bg-white px-4 pt-6 sm:mx-0 sm:rounded-md sm:pt-4 md:hidden">
          <div className="flex flex-wrap items-start justify-between sm:hidden">
            <div className="flex max-w-[calc(100%-100px)] flex-col flex-wrap">
              <h1 className="outfit-700 mt-2 ml-2 text-[18px]  break-words">
                {subject.subjectName}
              </h1>
              <div className="mt-2 ml-2 flex gap-1 text-gray-500">
                <i className="bx bx-book text-[16px]d mt-[1px]"></i>
                <p className="outfit-400 text-[12px]">{subject.subjectCode}</p>
                <span className="mx-1 align-middle leading-none text-gray-400">
                  •
                </span>
                <p className="outfit-400 text-[12px]">
                  {subject.programName === "GE"
                    ? "General Subject"
                    : subject.programName || "-"}
                </p>
                <span className="mx-1 align-middle leading-none text-gray-400">
                  •
                </span>
                <p className="outfit-400 text-[12px]">
                  {subject.yearLevel || "-"}
                </p>
              </div>
            </div>
            <img
              src={SubPhoto}
              alt="Subject"
              className="border-color mt-1 size-20 rounded-md border object-cover"
            />
          </div>

          <div className="hidden flex-wrap items-center sm:flex">
            <img
              src={SubPhoto}
              alt="Subject"
              className="border-color mr-5 size-18 rounded-md border object-cover"
            />
            <div className="flex max-w-[calc(100%-125px)] flex-col flex-wrap">
              <h1 className="outfit text-[15px] font-bold break-words md:text-[18px]">
                {subject.subjectName}
              </h1>
              <div className="mt-1 flex gap-1 text-gray-500">
                <i className="bx bx-book mt-[1px] text-lg"></i>

                <p className="outfit-400 text-[14px]">{subject.subjectCode}</p>
                <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                  •
                </span>
                <p className="outfit-400 text-[14px]">
                  {subject.programName === "GE"
                    ? "General Subject"
                    : subject.programName || "-"}
                </p>
                <span className="mx-1 mt-[1.5px] align-middle leading-none text-gray-400">
                  •
                </span>
                <p className="outfit-400 text-[14px]">
                  {subject.yearLevel || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex items-start justify-start sm:items-end sm:justify-end">
            <button
              className="border-color mb-4 cursor-pointer items-center justify-center gap-1 rounded-xl border bg-white px-3 py-2 text-[12px] text-gray-700 transition hover:bg-gray-100 min-[500px]:flex"
              onClick={() => {
                const user = JSON.parse(sessionStorage.getItem("user"));
                const roleID = user?.roleID ?? user?.roleId;
                let path = "/dean/subjects?subject_id=" + subject.subjectID;
                if (Number(roleID) === 2)
                  path = "/faculty/subjects?subject_id=" + subject.subjectID;
                else if (Number(roleID) === 3)
                  path =
                    "/program-chair/subjects?subject_id=" + subject.subjectID;
                navigate(path, { state: { subject } });
                // Dispatch a custom event to close the sidebar/subject list
                window.dispatchEvent(new Event("closeSubjectSidebar"));
              }}
            >
              <span className="inline-flex items-center gap-2">
                <i className="bx bxs-edit text-[15px]"></i>
                <span className="outfit-500 text-[12px]">Manage Questions</span>
              </span>
            </button>
          </div>
        </div>
        {/* Quiz overview (when coming from Libraries "View") */}
        {quiz && (
          <div className="border-color -mx-2 mt-4 rounded-md border bg-white px-4 py-4 sm:mx-0">
            <h2 className="outfit mb-2 text-[16px] font-semibold">
              Quiz Overview
            </h2>
            <p className="outfit text-sm font-semibold text-gray-900">
              {quiz.title || "Untitled Quiz"}
            </p>
            {quiz.description && (
              <p className="mt-1 line-clamp-3 text-sm text-gray-600">
                {quiz.description}
              </p>
            )}
            {quiz.instruction && (
              <p className="mt-2 text-xs text-gray-500">
                <span className="font-semibold text-gray-700">
                  Instruction:
                </span>{" "}
                {quiz.instruction}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-600">
                {quiz.quizType?.name ||
                  (quiz.quiz_type_id === 1 ? "Subject-based" : "Custom")}
              </span>
              {quiz.created_at && (
                <span className="flex items-center gap-1">
                  <i className="bx bx-calendar" />
                  {new Date(quiz.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        )}
        <ExamResultsTable
          subjectID={subject.subjectID}
          results={results}
          averageScore={averageScore}
        />
      </div>

      {/* Desktop version: leave as is below */}
      <div className="hidden py-8 md:block">
        <div className="border-color relative mx-auto -mt-4 flex h-[190px] max-w-[1200px] flex-row items-start justify-between overflow-visible border-b bg-white p-6">
          <div className="flex w-full flex-col items-center md:flex-row md:flex-nowrap md:items-center">
            <div className="relative flex flex-col items-center md:mr-5">
              <img
                src={SubPhoto}
                alt="Subject"
                className="border-color size-21 rounded-md border object-cover"
              />
            </div>

            <div className="outfit flex max-w-full min-w-0 flex-col flex-wrap md:max-w-[calc(100%-200px)]">
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
                  <span className="text-[18px]">{subject.subjectName}</span>
                </Textfit>
              </div>
              <div className="mt-2 flex gap-1 text-gray-500">
                <i className="bx bx-book mt-[1px] text-[16px]"></i>
                <p className="outfit-400 text-[14px]">{subject.subjectCode}</p>
                <span className="mx-1 mt-[2px] align-middle leading-none text-gray-400">
                  •
                </span>
                <i className="bx bx-cog mt-[1px] text-[16px]"></i>
                <p className="outfit-400 text-[14px]">
                  {subject.programName === "GE"
                    ? "General Subject"
                    : subject.programName || "-"}
                </p>
                <span className="mx-1 mt-[2px] align-middle leading-none text-gray-400">
                  •
                </span>
                <i className="bx bx-people-diversity mt-[1px] text-[16px]"></i>
                <p className="outfit-400 text-[14px]">
                  {subject.yearLevel || "-"}
                </p>
              </div>

              {/* Bottom left buttons */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <button
                  className="border-color flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-100"
                  onClick={handleWorksheetClick}
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
                  <span className="outfit-500">Worksheet</span>
                </button>
                <button
                  className="border-color flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-100"
                  onClick={handleEditClick}
                >
                  <i className="bx bx-edit text-lg"></i>
                  <span className="outfit-500">Edit</span>
                </button>

                <button
                  className="border-color flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-50"
                  onClick={handleDeleteClick}
                >
                  <i className="bx bx-trash text-lg"></i>
                  <span className="outfit-500">Remove</span>
                </button>
              </div>
            </div>
          </div>

          {/* End subject photo/info row */}
          <div className="relative mt-[51px] flex h-full flex-col">
            <div className="relative mt-2 flex items-center justify-center">
              <button
                className="relative z-20 mt-5 mr-15 hidden w-37 cursor-pointer rounded-xl bg-orange-500 px-5 py-2 font-semibold text-white shadow-lg transition duration-100 hover:bg-orange-600 md:block lg:w-50"
                onClick={() => {
                  const user = JSON.parse(sessionStorage.getItem("user"));
                  const roleID = user?.roleID ?? user?.roleId;
                  let path = "/dean/subjects?subject_id=" + subject.subjectID;
                  if (Number(roleID) === 2)
                    path = "/faculty/subjects?subject_id=" + subject.subjectID;
                  else if (Number(roleID) === 3)
                    path =
                      "/program-chair/subjects?subject_id=" + subject.subjectID;
                  navigate(path, { state: { subject } });
                  // Dispatch a custom event to close the sidebar/subject list
                  window.dispatchEvent(new Event("closeSubjectSidebar"));
                }}
              >
                <span className="outfit inline-flex items-center gap-2">
                  <i className="bx bxs-edit"></i>
                  <span className="outfit-500 hidden text-[14px] lg:inline">
                    Manage Questions
                  </span>
                  <span className="text-[14px] lg:hidden">Questions</span>
                </span>
              </button>

              {/* Sparkle icon at top left outside the paper */}
              <div className="">
                <div className="pointer-events-none absolute top-[21px] -left-18 z-20 hidden md:block lg:-left-20">
                  <i className="bx bxs-dots-vertical-rounded text-4xl text-gray-300"></i>
                </div>
                <div className="pointer-events-none absolute top-[48px] -left-18 z-20 hidden md:block lg:-left-20">
                  <i className="bx bxs-dots-vertical-rounded text-4xl text-gray-300"></i>
                </div>
                <div className="pointer-events-none absolute top-[55px] -left-24 z-20 hidden md:block lg:-left-26">
                  <div className="flex justify-center">
                    <div className="relative flex h-13 w-26 items-center justify-center rounded-t-full bg-white shadow-[0_-6px_20px_rgba(0,0,0,0.1)]">
                      {/* Boxicon upward arrow */}
                      <i className="bx bxs-arrow-big-up-line mt-6 text-4xl text-gray-300" />
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute top-[53px] -right-2 z-20 hidden md:block lg:-right-4">
                  <i className="bx bxs-stamp text-6xl text-gray-300"></i>
                </div>

                <div className="pointer-events-none absolute top-8 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                  <div className="relative mt-6 mr-15 h-[126px] w-57 rounded-t-md bg-white shadow-[20px_0_30px_-10px_rgba(0,0,0,0.1),-20px_0_30px_-10px_rgba(0,0,0,0.1)] lg:w-72">
                    {/* Top tab */}
                    <div className="absolute top-0 left-1/2 h-2 w-57 -translate-x-1/2 rounded-t bg-gray-300 lg:w-72" />
                    {/* Light gray document lines */}
                    <div className="absolute inset-0 space-y-3 px-6 py-7">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-3 w-full rounded bg-gray-100"
                          style={{ width: `${90 - i * 8}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="outfit border-color relative z-48 -mx-2 -mt-2 mb-2 flex h-[40px] items-center justify-end overflow-visible border bg-white px-4 text-[12px] font-semibold sm:mx-0 sm:rounded-b-md md:hidden">
          <span
            onClick={() => {
              const user = JSON.parse(sessionStorage.getItem("user"));
              const roleID = user?.roleID ?? user?.roleId;
              let path = "/dean/subjects?subject_id=" + subject.subjectID;
              if (Number(roleID) === 2)
                path = "/faculty/subjects?subject_id=" + subject.subjectID;
              else if (Number(roleID) === 3)
                path =
                  "/program-chair/subjects?subject_id=" + subject.subjectID;
              navigate(path, { state: { subject } });
              // Dispatch a custom event to close the sidebar/subject list
              window.dispatchEvent(new Event("closeSubjectSidebar"));
            }}
            className="flex cursor-pointer items-center gap-2 text-gray-700"
          >
            View Questions
            <i className="bx bx-arrow-right-stroke text-2xl" />
          </span>
        </div>

        {/* Quiz overview (when coming from Libraries "View") */}
        {quiz && (
          <div className="border-color mx-auto mt-4 w-full max-w-5xl rounded-lg border bg-white px-4 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <h2 className="outfit mb-1 text-[16px] font-semibold">
                  Quiz Overview
                </h2>
                <p className="text-sm font-semibold text-gray-900">
                  {quiz.title || "Untitled Quiz"}
                </p>
                {quiz.description && (
                  <p className="mt-1 line-clamp-3 text-sm text-gray-600">
                    {quiz.description}
                  </p>
                )}
                {quiz.instruction && (
                  <p className="mt-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">
                      Instruction:
                    </span>{" "}
                    {quiz.instruction}
                  </p>
                )}
              </div>
              <div className="mt-3 flex flex-col items-start gap-2 text-xs text-gray-500 md:mt-0 md:items-end">
                <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-600">
                  {quiz.quizType?.name ||
                    (quiz.quiz_type_id === 1 ? "Subject-based" : "Custom")}
                </span>
                {quiz.created_at && (
                  <span className="flex items-center gap-1">
                    <i className="bx bx-calendar" />
                    {new Date(quiz.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        <ExamResultsTable
          subjectID={subject.subjectID}
          results={results}
          averageScore={averageScore}
        />
      </div>

      {/* Toast notifications */}
      <Toast message={toast.message} type={toast.type} show={toast.show} />

      {/* Edit Modal */}
      {showEditModal && (
        <>
          <div className="lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[448px]:items-center">
            <div className="animate-fade-in-up relative max-h-[90vh] w-full max-w-md rounded-t-2xl bg-white shadow-2xl min-[448px]:mx-5 min-[448px]:rounded-md">
              <div className="border-color flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-[16px] font-semibold text-black">
                  Edit Subject
                </h2>

                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditedSubject({
                      subjectCode: "",
                      subjectName: "",
                      programID: "",
                      yearLevelID: "",
                    });
                    setValidationError("");
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-700 transition duration-100 hover:bg-gray-100 hover:text-gray-900"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>

              <div className="px-5 py-4">
                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Subject Name
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter"
                        value={editedSubject.subjectName}
                        onChange={(e) =>
                          setEditedSubject({
                            ...editedSubject,
                            subjectName: e.target.value,
                          })
                        }
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4 text-start">
                  <div className="mb-4">
                    <span className="block text-[14px] text-gray-700">
                      Subject Code
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter"
                        value={editedSubject.subjectCode}
                        onChange={(e) =>
                          setEditedSubject({
                            ...editedSubject,
                            subjectCode: e.target.value,
                          })
                        }
                        className="peer mt-1 w-full rounded-xl border border-gray-300 px-4 py-[7px] text-[14px] text-gray-900 transition-all duration-200 hover:border-gray-500 focus:border-[#FE6902] focus:outline-none"
                      />
                    </div>
                    <div className="mt-1 text-start text-[11px] text-gray-400">
                      Enter the subject code of the subject (e.g MATH123)
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-1">
                      <span className="block text-[14px] text-gray-700">
                        Program
                      </span>
                    </div>

                    <RegisterDropDownSmall
                      name="Program"
                      value={editedSubject.programID}
                      onChange={(e) =>
                        setEditedSubject({
                          ...editedSubject,
                          programID: e.target.value,
                        })
                      }
                      placeholder="Select Program"
                      options={programs.map((program) => ({
                        value: program.programID,
                        label: getDisplayProgramName(program.programName),
                      }))}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-1">
                      <span className="block text-[14px] text-gray-700">
                        Year Level
                      </span>
                    </div>

                    <RegisterDropDownSmall
                      name="Year Level"
                      value={editedSubject.yearLevelID}
                      onChange={(e) =>
                        setEditedSubject({
                          ...editedSubject,
                          yearLevelID: e.target.value,
                        })
                      }
                      placeholder="Select Year Level"
                      options={yearLevelOptions.map((yearLevel) => ({
                        value: yearLevel,
                        label: `${yearLevel}${yearLevel === "1" ? "st" : yearLevel === "2" ? "nd" : yearLevel === "3" ? "rd" : "th"} Year`,
                      }))}
                    />
                  </div>
                </div>
                <div className="mt-2 mb-3 h-[0.5px] bg-[rgb(200,200,200)]" />

                {validationError && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    {validationError}
                  </div>
                )}

                {editedSubject.subjectCode.length > 20 && (
                  <div className="mt-2 mb-2 rounded-md bg-red-50 p-2 text-center text-[13px] text-red-500">
                    Code must be 20 characters or less.
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditedSubject({
                        subjectCode: "",
                        subjectName: "",
                        programID: "",
                        yearLevelID: "",
                      });
                      setValidationError("");
                    }}
                    className="mt-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-[14px] font-semibold text-gray-700 transition-all duration-100 ease-in-out hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    onClick={handleSaveEdit}
                    className={`mt-2 cursor-pointer rounded-lg px-4 py-2 text-[14px] font-semibold text-white transition-all duration-100 ease-in-out ${isEditing ? "cursor-not-allowed bg-gray-500" : "bg-orange-500 hover:bg-orange-700 active:scale-98"} disabled:opacity-50`}
                  >
                    {isEditing ? (
                      <div className="flex items-center justify-center">
                        <span className="loader-white"></span>
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && subjectToDelete && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSubjectToDelete(null);
          }}
          onConfirm={handleDeleteSubject}
          message={
            <>
              Are you sure you want to remove{" "}
              <span className="font-bold text-red-500">
                {subjectToDelete.subjectName} ({subjectToDelete.subjectCode})
              </span>
              ? Removing this subject will also wipe out its contents.
            </>
          }
          isLoading={isDeleting}
          showCountdown={true}
          countdownSeconds={6}
          shiftHintText={undefined}
        />
      )}

      {/* Worksheet Modal */}
      {isWorksheetModalOpen && (
        <PrintExamModal
          isOpen={isWorksheetModalOpen}
          onClose={() => setIsWorksheetModalOpen(false)}
          initialSubject={{
            subjectID: subject.subjectID,
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            programName: subject.programName,
            yearLevel: subject.yearLevel,
          }}
        />
      )}
    </>
  );
};

export default SubjectOverview;
