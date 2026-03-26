const SUBJECT_BADGES = [
  "bg-yellow-400 text-slate-950",
  "bg-orange-400 text-slate-950",
  "bg-cyan-400 text-slate-950",
  "bg-lime-400 text-slate-950",
  "bg-fuchsia-400 text-slate-950",
  "bg-rose-400 text-slate-950",
  "bg-violet-400 text-slate-950",
];

// Renders the student subject card.
const StudentSubjectCard = ({ baseName, subjectImage, onClick, disabled }) => {
  const initials = baseName
    ? baseName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "??";

  const colorIndex = baseName
    ? [...baseName].reduce((total, char) => total + char.charCodeAt(0), 0) %
      SUBJECT_BADGES.length
    : 0;
  const badgeColor = SUBJECT_BADGES[colorIndex];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-h-[84px] w-full items-center gap-4 rounded-2xl border border-slate-300/65 bg-white/90 px-4 py-3 text-left shadow-[0_8px_20px_rgba(148,163,184,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/85 hover:bg-white active:translate-y-0 active:scale-[0.99] dark:border-white/12 dark:bg-slate-950/92 dark:shadow-[0_18px_34px_rgba(2,6,23,0.24)] dark:hover:border-white/15 dark:hover:bg-slate-950 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
        {subjectImage ? (
          <img
            src={subjectImage}
            alt={baseName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center rounded-xl ${badgeColor}`}
          >
            <span className="text-lg font-bold text-slate-950">
              {initials}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white truncate">
          {baseName}
        </h3>
        <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
          Practice Exam
        </p>
      </div>

      <i className="bx bx-chevron-right text-2xl text-slate-400 transition-transform duration-200 group-hover:translate-x-1"></i>
    </button>
  );
};

export default StudentSubjectCard;
