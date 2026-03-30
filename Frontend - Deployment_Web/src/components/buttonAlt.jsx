// Button Component
const AltButton = ({ text, icon, onClick, className, type }) => {
  return (
    <button
      onClick={onClick}
      type={type}
      className={`flex cursor-pointer items-center gap-1 px-[10px] py-[1px] text-gray-700 ${className}`}
    >
      <i className={`${icon} text-[18px]`}></i>
      <span className="hidden pr-1.5 text-[14px] sm:inline">{text}</span>
    </button>
  );
};

export default AltButton;
