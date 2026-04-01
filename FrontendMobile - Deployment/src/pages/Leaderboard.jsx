import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/config';

// Renders the student leaderboard and keeps program/subject filters in sync with the backend data.
const Leaderboard = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
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
    // Closes either dropdown when the user taps outside of its container.
    const handleClickOutside = (e) => {
      if (programDropdownRef.current && !programDropdownRef.current.contains(e.target)) {
        setShowProgramDropdown(false);
      }
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target)) {
        setShowSubjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Loads ranked students plus the dropdown options for the active filter set.
  const fetchLeaderboard = async (program = null, subject = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiUrl();
      let url = `${apiUrl}/api/leaderboard`;
      
      const params = new URLSearchParams();
      if (program) params.append('program', program);
      if (subject) params.append('subject', subject);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }
      
      const data = await response.json();
      
      setLeaderboardData(data.leaderboard || []);
      setPrograms(data.programs || []);
      setSubjects(data.subjects || []);
      
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Applies a program filter and resets the subject filter so the request stays unambiguous.
  const handleProgramFilter = (program) => {
    setActiveFilter('Program');
    setSelectedProgram(program);
    setSelectedSubject(null);
    setShowProgramDropdown(false);
    fetchLeaderboard(program.programID, null);
  };

  // Applies a subject filter and resets the program filter so the request stays unambiguous.
  const handleSubjectFilter = (subject) => {
    setActiveFilter('Subject');
    setSelectedSubject(subject);
    setSelectedProgram(null);
    setShowSubjectDropdown(false);
    fetchLeaderboard(null, subject.subjectID);
  };

  // Clears all filter state and reloads the global leaderboard.
  const handleAllFilter = () => {
    setActiveFilter('All');
    setSelectedProgram(null);
    setSelectedSubject(null);
    setShowProgramDropdown(false);
    setShowSubjectDropdown(false);
    fetchLeaderboard(null, null);
  };

  const filteredStudents = useMemo(
    () => [...leaderboardData].sort((a, b) => b.points - a.points),
    [leaderboardData],
  );

  const topThree = filteredStudents.slice(0, 3);

  const programTabLabel =
    activeFilter === 'Program' && selectedProgram
      ? selectedProgram.programName
      : 'Program';
  const subjectTabLabel =
    activeFilter === 'Subject' && selectedSubject
      ? (selectedSubject.subjectCode || selectedSubject.subjectName)
      : 'Subject';

  // Prefers the backend-computed full name but still guards against missing data.
  const getDisplayName = (student) => student?.name || 'Unknown Student';

  // Builds a stable two-letter avatar fallback when no profile image exists.
  const getDisplayAvatar = (student) =>
    student?.avatar ||
    getDisplayName(student)
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    '?';

  // Shows program and subject context under each entry when that metadata is available.
  const getSecondaryLabel = (student) => {
    const subjectLabel =
      student?.subject ||
      (activeFilter === 'Subject'
        ? selectedSubject?.subjectCode || selectedSubject?.subjectName
        : null);

    return [student?.program, subjectLabel].filter(Boolean).join(' • ');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black px-3 sm:px-4 pt-14 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white dark:bg-gray-900 shadow-sm text-gray-600 dark:text-gray-400"
        >
          <i className='bx bx-left-arrow-alt text-2xl'></i>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
      </div>

      {/* Filter Tabs */}
      <div className="relative flex gap-2 mb-8 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-2xl">
        {/* All Tab */}
        <button
          onClick={handleAllFilter}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${activeFilter === 'All'
              ? 'bg-white dark:bg-black text-[var(--color-primary)] shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        >
          All
        </button>

        {/* Program Tab */}
        <div ref={programDropdownRef} className="flex-1 relative">
          <button
            onClick={() => {
              setActiveFilter('Program');
              setShowSubjectDropdown(false);
              setShowProgramDropdown(prev => !prev);
            }}
            className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 ${activeFilter === 'Program'
                ? 'bg-white dark:bg-black text-[var(--color-primary)] shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <span className="truncate max-w-[90px]">{programTabLabel}</span>
            <i className={`bx bx-chevron-down text-base transition-transform duration-200 ${showProgramDropdown ? 'rotate-180' : ''}`}></i>
          </button>

          {showProgramDropdown && programs.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
              {programs.map((prog) => (
                <button
                  key={prog.programID}
                  onClick={() => { handleProgramFilter(prog); }}
                  className={`w-full px-4 py-2.5 text-sm font-bold text-left transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20 ${selectedProgram?.programID === prog.programID
                      ? 'text-[var(--color-primary)] bg-orange-50 dark:bg-orange-900/20'
                      : 'text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {prog.programName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subject Tab */}
        <div ref={subjectDropdownRef} className="flex-1 relative">
          <button
            onClick={() => {
              setActiveFilter('Subject');
              setShowProgramDropdown(false);
              setShowSubjectDropdown(prev => !prev);
            }}
            className={`w-full py-2.5 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 ${activeFilter === 'Subject'
                ? 'bg-white dark:bg-black text-[var(--color-primary)] shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
          >
            <span className="truncate max-w-[90px]">{subjectTabLabel}</span>
            <i className={`bx bx-chevron-down text-base transition-transform duration-200 ${showSubjectDropdown ? 'rotate-180' : ''}`}></i>
          </button>

          {showSubjectDropdown && subjects.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
              {subjects.map((subj) => (
                <button
                  key={subj.subjectID}
                  onClick={() => { handleSubjectFilter(subj); }}
                  className={`w-full px-4 py-2.5 text-sm font-bold text-left transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20 ${selectedSubject?.subjectID === subj.subjectID
                      ? 'text-[var(--color-primary)] bg-orange-50 dark:bg-orange-900/20'
                      : 'text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {subj.subjectCode || subj.subjectName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading leaderboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center max-w-sm">
              <i className='bx bx-error-circle text-4xl text-red-500 mb-3'></i>
              <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
              <button
              onClick={() =>
                fetchLeaderboard(
                  selectedProgram?.programID ?? null,
                  selectedSubject?.subjectID ?? null,
                )
              }
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Podium (Top 3) */}
      {!isLoading && !error && topThree.length >= 3 && (
        <div className="flex justify-center items-end gap-1 sm:gap-2 mb-10 mt-4 px-1 sm:px-2">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 dark:bg-black border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
              {getDisplayAvatar(topThree[1])}
            </div>
            <div className="h-16 sm:h-24 w-14 sm:w-20 bg-gray-100 dark:bg-gray-900 rounded-t-lg flex flex-col items-center justify-center border-x border-t border-gray-200 dark:border-gray-800">
              <span className="text-xl sm:text-2xl font-bold text-gray-400">2</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold mt-1 sm:mt-2 dark:text-gray-300 uppercase truncate w-14 sm:w-16 text-center">{getDisplayName(topThree[1]).split(' ')[0]}</span>
          </div>
          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 flex items-center justify-center text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {getDisplayAvatar(topThree[0])}
              </div>
              <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 text-yellow-500 text-xl sm:text-2xl">
                <i className='bx bxs-crown'></i>
              </div>
            </div>
            <div className="h-24 sm:h-32 w-16 sm:w-24 bg-gradient-to-b from-orange-400 to-orange-600 rounded-t-lg flex flex-col items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-2xl sm:text-3xl font-bold text-white">1</span>
            </div>
            <span className="text-xs sm:text-sm font-bold mt-1 sm:mt-2 dark:text-white truncate w-16 sm:w-24 text-center">{getDisplayName(topThree[0]).split(' ')[0]}</span>
          </div>
          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-lg sm:text-xl font-bold text-orange-400 dark:text-orange-300 mb-2">
              {getDisplayAvatar(topThree[2])}
            </div>
            <div className="h-12 sm:h-16 w-14 sm:w-20 bg-gray-50 dark:bg-gray-900 rounded-t-lg flex flex-col items-center justify-center border-x border-t border-gray-200 dark:border-gray-800">
              <span className="text-xl sm:text-2xl font-bold text-gray-300 dark:text-gray-600">3</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold mt-1 sm:mt-2 dark:text-gray-300 uppercase truncate w-14 sm:w-16 text-center">{getDisplayName(topThree[2]).split(' ')[0]}</span>
          </div>
        </div>
      )}

      {/* List */}
      {!isLoading && !error && (
        filteredStudents.length > 0 ? (
          <div className="space-y-3">
            {filteredStudents.map((student, index) => (
              <div
                key={student.userID || student.id}
                className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border ${index === 0
                    ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  } transition-all duration-300 hover:scale-[1.01]`}
              >
                <span className={`w-5 sm:w-6 text-center font-bold ${index < 3 ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                  {index + 1}
                </span>
                <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gray-100 dark:bg-black flex items-center justify-center font-semibold text-gray-600 dark:text-gray-300">
                  {getDisplayAvatar(student)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight truncate">{getDisplayName(student)}</h3>
                  {getSecondaryLabel(student) && (
                    <p className="text-[10px] sm:text-xs uppercase font-bold text-[var(--color-primary)] mt-0.5">
                      {getSecondaryLabel(student)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="block font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-none">{student.points}</span>
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">PTS</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
              <i className='bx bx-trophy text-5xl text-gray-300 dark:text-gray-600 mb-4'></i>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No leaderboard data available yet.</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">Complete practice exams to appear on the leaderboard!</p>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Leaderboard;
