const SUBJECT_BADGES = [
  "bg-yellow-400 text-slate-950",
  "bg-orange-400 text-slate-950",
  "bg-cyan-400 text-slate-950",
  "bg-lime-400 text-slate-950",
  "bg-fuchsia-400 text-slate-950",
  "bg-rose-400 text-slate-950",
  "bg-violet-400 text-slate-950",
];

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
      className={`group flex min-h-[clamp(4.5rem,14vw,6rem)] w-full items-center gap-[clamp(0.6rem,2vw,1rem)] rounded-[20px] sm:rounded-[26px] border border-slate-300/65 bg-white/90 px-[clamp(0.75rem,3vw,1.15rem)] py-[clamp(0.65rem,2.5vw,1rem)] text-left shadow-[0_18px_34px_rgba(148,163,184,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/85 hover:bg-white active:translate-y-0 active:scale-[0.99] dark:border-white/12 dark:bg-slate-950/92 dark:shadow-[0_18px_34px_rgba(2,6,23,0.24)] dark:hover:border-white/15 dark:hover:bg-slate-950 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex size-[clamp(2.5rem,9vw,3.55rem)] shrink-0 items-center justify-center overflow-hidden rounded-[14px] sm:rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
        {subjectImage ? (
          <img
            src={subjectImage}
            alt={baseName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center rounded-[14px] sm:rounded-[18px] ${badgeColor}`}
          >
            <span className="text-[clamp(0.9rem,2.8vw,1.35rem)] font-bold text-slate-950">
              {initials}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="text-[clamp(0.9rem,2.6vw,1.2rem)] font-bold leading-tight tracking-tight text-slate-900 dark:text-white truncate">
          {baseName}
        </h3>
        <p className="mt-0.5 sm:mt-1 text-[clamp(0.6rem,1.6vw,0.8rem)] font-medium text-slate-500 dark:text-slate-400">
          Practice Exam
        </p>
      </div>

      <i className="bx bx-chevron-right text-[clamp(1.2rem,4vw,2rem)] text-slate-400 transition-transform duration-200 group-hover:translate-x-1"></i>
    </button>
  );
};

export default StudentSubjectCard;
