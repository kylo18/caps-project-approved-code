const Button = ({ text, textres, icon, onClick}) => {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer flex items-center gap-1 px-2 py-[6.5px] bg-orange-500 text-white rounded-lg hover:bg-orange-600"
    >
      <i className={`${icon} text-[20px]`}></i>
      <span className="hidden sm:inline text-[14px] pr-1.5">{text}</span>
      <span className="inline sm:hidden text-[14px] pr-1.5">{textres}</span>
    </button>
  );
};

export default Button;
