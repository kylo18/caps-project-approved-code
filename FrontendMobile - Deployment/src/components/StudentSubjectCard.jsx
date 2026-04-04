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
const StudentSubjectCard = ({
  baseName,
  subjectImage,
  meta,
  accent = "orange",
  onClick,
  disabled,
}) => {
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
  const accentMap = {
    orange:
      "bg-white border-orange-100/80 shadow-[0_16px_26px_rgba(254,105,2,0.08)]",
    soft: "bg-[#fff7f1] border-[#ffd8bf]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-h-[84px] w-full items-center gap-4 rounded-[24px] border px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] dark:border-white/12 dark:bg-slate-950/92 dark:shadow-[0_18px_34px_rgba(2,6,23,0.24)] dark:hover:border-white/15 dark:hover:bg-slate-950 ${accentMap[accent] || accentMap.orange} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <div className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#f7f4ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
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
        <h3 className="truncate text-[15px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
          {baseName}
        </h3>
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          {meta || "Practice Exam"}
        </p>
      </div>

      <i className="bx bx-chevron-right text-2xl text-slate-300 transition-transform duration-200 group-hover:translate-x-1"></i>
    </button>
  );
};

export default StudentSubjectCard;
