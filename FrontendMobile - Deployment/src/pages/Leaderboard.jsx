import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../utils/config";
import { useTheme } from "../contexts/ThemeContext";

const avatarPalette = [
  "bg-[#ffe17b]",
  "bg-[#ffd4ea]",
  "bg-[#d9dcff]",
  "bg-[#d6f4d2]",
  "bg-[#ffd0b1]",
];

const getDisplayName = (student) => student?.name || "Unknown Student";

const getDisplayAvatar = (student) =>
  student?.avatar ||
  getDisplayName(student)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ||
  "?";

const Leaderboard = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const programDropdownRef = useRef(null);
  const subjectDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        programDropdownRef.current &&
        !programDropdownRef.current.contains(event.target)
      ) {
        setShowProgramDropdown(false);
      }

      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(event.target)
      ) {
        setShowSubjectDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLeaderboard = async (program = null, subject = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();
      let url = `${apiUrl}/api/leaderboard`;
      const params = new URLSearchParams();

      if (program) {
        params.append("program", program);
      }

      if (subject) {
        params.append("subject", subject);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();
      setLeaderboardData(data.leaderboard || data.data || []);
      setPrograms(data.programs || []);
      setSubjects(data.subjects || []);
    } catch (fetchError) {
      console.error("Error fetching leaderboard:", fetchError);
      setError(fetchError.message || "Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleProgramFilter = (program) => {
    setActiveFilter("Program");
    setSelectedProgram(program);
    setSelectedSubject(null);
    setShowProgramDropdown(false);
    fetchLeaderboard(program.programID, null);
  };

  const handleSubjectFilter = (subject) => {
    setActiveFilter("Subject");
    setSelectedSubject(subject);
    setSelectedProgram(null);
    setShowSubjectDropdown(false);
    fetchLeaderboard(null, subject.subjectID);
  };

  const handleAllFilter = () => {
    setActiveFilter("All");
    setSelectedProgram(null);
    setSelectedSubject(null);
    setShowProgramDropdown(false);
    setShowSubjectDropdown(false);
    fetchLeaderboard(null, null);
  };

  const filteredStudents = useMemo(
    () =>
      [...leaderboardData].sort(
        (a, b) => (b.points ?? b.score ?? 0) - (a.points ?? a.score ?? 0),
      ),
    [leaderboardData],
  );

  const topThree = filteredStudents.slice(0, 3);

  const programTabLabel =
    activeFilter === "Program" && selectedProgram
      ? selectedProgram.programName
      : "Program";

  const subjectTabLabel =
    activeFilter === "Subject" && selectedSubject
      ? selectedSubject.subjectCode || selectedSubject.subjectName
      : "Subject";

  const getSecondaryLabel = (student) => {
    const subjectLabel =
      student?.subject ||
      (activeFilter === "Subject"
        ? selectedSubject?.subjectCode || selectedSubject?.subjectName
        : null);

    return [student?.program, subjectLabel].filter(Boolean).join(" • ");
  };

  return (
    <div className={`min-h-screen pb-32 text-slate-900 dark:text-white ${isDark ? 'dark bg-[var(--color-bg-primary)]' : 'bg-[#fff7f1]'}`}>
      <section className={`relative z-30 overflow-visible rounded-b-[36px] px-5 pb-8 pt-6 text-white ${isDark ? 'bg-[var(--color-bg-secondary)]' : 'bg-[linear-gradient(180deg,#ff7a00_0%,#ff8c1a_100%)]'}`}>
        <div className="absolute -right-8 top-10 h-40 w-40 rounded-full border border-white/10 dark:border-white/5" />
        <div className="absolute -left-10 bottom-4 h-24 w-24 rounded-full bg-white/10 dark:bg-white/5" />

        <div className="relative flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16 backdrop-blur"
          >
            <i className="bx bx-left-arrow-alt text-[24px]" />
          </button>
          <div>
            <h1 className="text-[28px] font-bold">Leaderboard</h1>
            <p className="text-sm text-orange-100">
              Rankings stay connected to your live backend data.
            </p>
          </div>
        </div>

        <div className={`relative z-40 mt-6 flex gap-2 rounded-[24px] p-1 ${isDark ? 'bg-[var(--color-bg-tertiary)]' : 'bg-[#eb6b00]'}`}>
          <button
            type="button"
            onClick={handleAllFilter}
            className={`flex-1 rounded-[20px] px-3 py-2 text-sm font-semibold transition ${
              activeFilter === "All"
                ? isDark 
                  ? "bg-[var(--color-accent)] text-white" 
                  : "bg-[#ffbf8e] text-[#8a3b00]"
                : isDark
                  ? "text-gray-300 hover:text-white"
                  : "text-orange-100"
            }`}
          >
            All
          </button>

          <div ref={programDropdownRef} className="relative z-50 flex-1">
            <button
              type="button"
              onClick={() => {
                setActiveFilter("Program");
                setShowSubjectDropdown(false);
                setShowProgramDropdown((value) => !value);
              }}
              className={`flex w-full items-center justify-center gap-1 rounded-[20px] px-3 py-2 text-sm font-semibold transition ${
                activeFilter === "Program"
                  ? isDark 
                    ? "bg-[var(--color-accent)] text-white" 
                    : "bg-[#ffbf8e] text-[#8a3b00]"
                  : isDark
                    ? "text-gray-300 hover:text-white"
                    : "text-orange-100"
              }`}
            >
              <span className="truncate max-w-[90px]">{programTabLabel}</span>
              <i
                className={`bx bx-chevron-down text-lg transition-transform ${
                  showProgramDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showProgramDropdown && programs.length > 0 && (
              <div className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-[300px] overflow-y-auto rounded-[22px] shadow-[0_16px_28px_rgba(254,105,2,0.25)] ${isDark ? 'bg-[var(--color-bg-secondary)] text-white' : 'bg-white text-slate-700'}`}>
                {programs.map((program) => (
                  <button
                    key={program.programID}
                    type="button"
                    onClick={() => handleProgramFilter(program)}
                    className={`block w-full px-4 py-3 text-left text-sm ${isDark ? 'hover:bg-[var(--color-bg-tertiary)]' : 'hover:bg-[#fff3e8]'}`}
                  >
                    {program.programName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={subjectDropdownRef} className="relative z-50 flex-1">
            <button
              type="button"
              onClick={() => {
                setActiveFilter("Subject");
                setShowProgramDropdown(false);
                setShowSubjectDropdown((value) => !value);
              }}
              className={`flex w-full items-center justify-center gap-1 rounded-[20px] px-3 py-2 text-sm font-semibold transition ${
                activeFilter === "Subject"
                  ? isDark 
                    ? "bg-[var(--color-accent)] text-white" 
                    : "bg-[#ffbf8e] text-[#8a3b00]"
                  : isDark
                    ? "text-gray-300 hover:text-white"
                    : "text-orange-100"
              }`}
            >
              <span className="truncate max-w-[90px]">{subjectTabLabel}</span>
              <i
                className={`bx bx-chevron-down text-lg transition-transform ${
                  showSubjectDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showSubjectDropdown && subjects.length > 0 && (
              <div className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-[300px] overflow-y-auto rounded-[22px] shadow-[0_16px_28px_rgba(254,105,2,0.25)] ${isDark ? 'bg-[var(--color-bg-secondary)] text-white' : 'bg-white text-slate-700'}`}>
                {subjects.map((subject) => (
                  <button
                    key={subject.subjectID}
                    type="button"
                    onClick={() => handleSubjectFilter(subject)}
                    className={`block w-full px-4 py-3 text-left text-sm ${isDark ? 'hover:bg-[var(--color-bg-tertiary)]' : 'hover:bg-[#fff3e8]'}`}
                  >
                    {subject.subjectName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pt-5">
        {isLoading && (
          <div className={`rounded-[28px] px-4 py-8 text-center shadow-[0_16px_28px_rgba(254,105,2,0.08)] ${isDark ? 'bg-[var(--color-bg-secondary)]' : 'bg-white'}`}>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#ff7a00] border-t-transparent" />
            <p className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Loading leaderboard...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className={`rounded-[28px] px-4 py-8 text-center shadow-[0_16px_28px_rgba(254,105,2,0.08)] ${isDark ? 'bg-[var(--color-bg-secondary)]' : 'bg-white'}`}>
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={() =>
                fetchLeaderboard(
                  selectedProgram?.programID ?? null,
                  selectedSubject?.subjectID ?? null,
                )
              }
              className="mt-4 rounded-full bg-[#ff7a00] px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && topThree.length >= 3 && (
          <div className={`rounded-[32px] px-4 pb-6 pt-5 text-white shadow-[0_18px_38px_rgba(254,105,2,0.22)] ${isDark ? 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)]' : 'bg-[linear-gradient(180deg,#ffa348_0%,#ff7a00_100%)]'}`}>
            <div className="mb-5 flex items-end justify-center gap-3">
              {[1, 0, 2].map((studentIndex, order) => {
                const student = topThree[studentIndex];
                const heights = ["h-24", "h-32", "h-20"];
                const widths = ["w-[4.5rem]", "w-20", "w-[4.5rem]"];
                const labels = ["2", "1", "3"];
                const avatarColor = avatarPalette[studentIndex % avatarPalette.length];

                return (
                  <div key={labels[order]} className="flex flex-col items-center">
                    <div
                      className={`mb-2 flex ${order === 1 ? "h-[4.5rem] w-[4.5rem]" : "h-14 w-14"} items-center justify-center rounded-full border-4 border-white/30 ${avatarColor} text-sm font-bold text-slate-800`}
                    >
                      {getDisplayAvatar(student)}
                    </div>
                    <div
                      className={`flex ${heights[order]} ${widths[order]} items-center justify-center rounded-t-[24px] ${isDark ? 'bg-[var(--color-accent)]/20' : 'bg-white/22'} text-5xl font-bold`}
                    >
                      {labels[order]}
                    </div>
                    <p className="mt-2 max-w-[5rem] truncate text-center text-xs font-semibold">
                      {getDisplayName(student).split(" ")[0]}
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-orange-100'}`}>
                      {student?.points ?? student?.score ?? 0} pts
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && !error && filteredStudents.length === 0 && (
          <div className={`rounded-[28px] px-4 py-8 text-center shadow-[0_16px_28px_rgba(254,105,2,0.08)] ${isDark ? 'bg-[var(--color-bg-secondary)]' : 'bg-white'}`}>
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isDark ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent)]' : 'bg-[#fff1e5] text-[#ff7a00]'}`}>
              <i className="bx bx-trophy text-[28px]" />
            </div>
            <p className={`mt-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              No leaderboard data available yet.
            </p>
          </div>
        )}

        {!isLoading && !error && filteredStudents.length > 0 && (
          <div className="mt-5 space-y-3">
            {filteredStudents.map((student, index) => (
              <div
                key={student.userID || student.id || index}
                className={`flex items-center gap-3 rounded-[24px] px-4 py-3 shadow-[0_16px_28px_rgba(254,105,2,0.08)] ${
                  index === 0 
                    ? isDark ? "bg-[var(--color-bg-secondary)] border border-[var(--color-accent)]/30" : "bg-[#fff3e7]"
                    : isDark ? "bg-[var(--color-bg-secondary)]" : "bg-white"
                }`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isDark ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent)]' : 'bg-[#fff1e5] text-[#ff7a00]'}`}>
                  {index + 1}
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${avatarPalette[index % avatarPalette.length]} text-sm font-bold text-slate-800`}
                >
                  {getDisplayAvatar(student)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className={`truncate text-[15px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {getDisplayName(student)}
                  </h2>
                  {getSecondaryLabel(student) && (
                    <p className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {getSecondaryLabel(student)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {student?.points ?? student?.score ?? 0}
                  </div>
                  <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    PTS
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Leaderboard;
