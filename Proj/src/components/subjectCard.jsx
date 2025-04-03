import { useState, useEffect, useRef } from "react";
import SubPhoto from "../assets/gottfield.jpg";

const SubjectCard = ({ subject, location, activeIndex, setActiveIndex }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  useEffect(() => {
    if (tabRefs.current[activeIndex]) {
      const activeTab = tabRefs.current[activeIndex];
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [activeIndex]);

  return (
    <div className="z-51 h-37 -mt-3 sm:h-40 relative bg-white px-4 pt-4 rounded-sm shadow-sm border border-gray-300 overflow-hidden">
      <button className="fixed sm:absolute bottom-[22px] right-[146px] sm:top-2 sm:right-2 hover:bg-gray-200 cursor-pointer size-8 flex items-center justify-center border border-gray-400 rounded-sm text-2xl">
        <i className=" bx bx-dots-horizontal-rounded text-gray-500"></i>
      </button>

      <div className="flex items-center">
        <img
          src={SubPhoto}
          alt="Subject"
          className="size-16 rounded-md border border-gray-300 object-cover mr-5"
        />
        <div className="flex flex-wrap flex-col">
          <h1 className="text-[15px] md:text-[21px] font-bold">{subject}</h1>
          <div className="flex gap-2 mt-1 text-gray-500">
            <i className="bx bxs-school text-lg"></i>
            <p className="text-sm font-semibold">JRMSU • {location}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col min-[890px]:flex-row items-center min-[890px]:justify-between mt-8 w-full">
        <div className="ml-0 min-[890px]:ml-10 w-full md:w-auto flex justify-center md:justify-start relative">
          <ul className="sm:mt-[15px] md:mt-[15px] lg:mt-0 text-[12px] relative flex flex-wrap justify-center gap-7.5 min-[890px]:gap-14 sm:text-sm font-semibold text-gray-600">
            {["Practice Questions", "Exam Questions", "Statistics", "Tagged", "Pending"].map((item, index) => (
              <li
                key={index}
                ref={(el) => (tabRefs.current[index] = el)}
                className={`cursor-pointer hover:text-orange-500 ${
                  activeIndex === index ? "text-orange-500" : ""
                }`}
                onClick={() => setActiveIndex(index)}
              >
                {item}
              </li>
            ))}
          </ul>

          <div
            className="absolute bottom-[-17px] ml-1 md:ml-0 min-[414px]:ml-3 md:bottom-[-12px] sm:bottom-[-27px] h-[3px] bg-orange-500 transition-all duration-300"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          ></div>
        </div>

        <div className=" z-51 flex gap-3 mt-4 min-[890px]:mt-3 min-[890px]:relative min-[890px]:right-0 fixed bottom-5 right-5">
          <button className="shadow-md cursor-pointer flex items-center gap-2 px-4 py-2 border border-orange-400 rounded-md text-orange-600 bg-orange-100 hover:bg-orange-200 ">
            <i className="bx bxs-time text-lg"></i>
            <span className=" hidden sm:inline text-[14px]">Assign</span>
          </button>
          <button className="shadow-md cursor-pointer flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 ">
            <i className="bx bxs-show text-lg"></i>
            <span className=" hidden sm:inline text-[14px]">Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;
