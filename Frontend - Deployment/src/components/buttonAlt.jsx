// Button Component
const AltButton = ({ text, icon, onClick, className, type }) => {
  return (
    <button
      onClick={onClick}
      type={type}
      className={`outfit border-color flex cursor-pointer items-center gap-1 rounded-xl border px-[14px] py-[6px] text-gray-700 hover:bg-gray-100`}
    >
      <i className={`${icon} text-[14px]`}></i>
      <span className="text-[12px]">{text}</span>
    </button>
  );
};

export default AltButton;
