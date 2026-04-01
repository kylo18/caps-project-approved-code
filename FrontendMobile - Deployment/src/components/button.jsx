// Button Component
const Button = ({ text, textres, icon, onClick, className, type }) => {
  return (
    <button
      onClick={onClick}
      type={type}
      className={`flex cursor-pointer items-center gap-1 rounded-md bg-orange-500 px-[12px] py-[6px] text-white hover:bg-orange-700 ${className}`}
    >
      <i className={`${icon} text-[18px]`}></i>
      <span className="hidden pr-1.5 text-[14px] sm:inline">{text}</span>
      <span className="inline pr-1.5 text-[14px] sm:hidden">{textres}</span>
    </button>
  );
};

export default Button;
