const TooltipWrapper = ({ label, children }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded bg-gray-900 px-2.5 py-1 text-sm whitespace-nowrap text-white opacity-0 shadow transition-opacity duration-200 group-hover:opacity-100">
        {label}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-gray-900"></div>
      </div>
    </div>
  );
};

export default TooltipWrapper;
