const TitleCard = ({ univLogo, collegeLogo }) => {
  return (
    <div className="text-center mb-6">
      <div className="flex flex-row items-center -mt-10 md:mt-[-15px] gap-5 mb-3 justify-center">
        <img src={univLogo} alt="University Logo" className="size-[50px] md:size-[70px]" />
        <img src={collegeLogo} alt="College Logo" className="size-[50px] md:size-[70px]" />
      </div>
      <div>
        <h1 className="text-[13px] md:text-[25px] font-[400] text-[rgb(43,165,22)] mb-2">
          JOSE RIZAL MEMORIAL STATE UNIVERSITY
        </h1>
        <h2 className="text-black text-xl md:text-3xl font-bold text-stroke tracking-wide mb-4">
          <span className="block sm:inline">COMPREHENSIVE </span>
          <span className="block sm:inline">ASSESSMENT AND</span>
          <span className="block">PREPARATION SYSTEM</span>
        </h2>
      </div>
    </div>
  );
};

export default TitleCard;
