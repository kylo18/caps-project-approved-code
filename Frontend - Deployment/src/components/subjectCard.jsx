import { useState, useEffect, useRef } from "react";
import SubPhoto from "../assets/gottfield.jpg";
import PracticeExamConfig from "./practiceExamConfig";

const SubjectCard = ({subjectName, subjectID, location, activeIndex, setActiveIndex, isLoading }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const tabRefs = useRef([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (tabRefs.current[activeIndex]) {
      const activeTab = tabRefs.current[activeIndex];
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [activeIndex]);

  const handleAssignClick = () => {
    setIsFormOpen(true);
  };

  const SkeletonLoader = () => (
    <div className="z-51 h-37 -mt-3 sm:h-40 relative bg-white px-4 pt-4 rounded-sm shadow-sm border border-gray-300 overflow-hidden">
      <div className="flex items-center space-x-4 animate-pulse">
        <div className="w-16 h-16 skeleton shimmer rounded-md"></div>
        <div className="flex-1">
          <div className="h-8 skeleton shimmer mb-2 w-1/2 "></div>
          <div className="h-4 skeleton shimmer rounded w-2/8"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="z-51 h-37 -mt-3 sm:h-40 relative bg-white px-4 pt-4 rounded-sm shadow-sm border border-gray-300 overflow-hidden">
          <button ref={dropdownRef}
            className="lg:hidden sm:absolute absolute top-2 right-2 hover:bg-gray-200 cursor-pointer size-8 flex items-center justify-center border border-gray-400 rounded-sm text-2xl"
            onClick={() => setShowDropdown(prev => !prev)}
          >
            <i className="bx bx-dots-horizontal-rounded text-gray-500"></i>
          </button>
          
          {showDropdown && (
            <div className="absolute top-12 right-2 bg-white border border-gray-300 rounded-md shadow-md w-30 z-50">
              <button
                onClick={handleAssignClick}
                className="cursor-pointer text-[14px] block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 transition duration-200 ease-in-out rounded-t-md"
              >
                Assign
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                }}
                className="cursor-pointer text-[14px] block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-200 transition duration-200 ease-in-out rounded-b-md"
              >
                Preview
              </button>
            </div>
          )}

          <div className="flex items-center">
            <img
              src={SubPhoto}
              alt="Subject"
              className="size-16 rounded-md border border-gray-300 object-cover mr-5"
            />
            <div className="flex flex-wrap flex-col">
              <h1 className="text-[15px] md:text-[21px] font-bold break-words">{subjectName}</h1>
              <div className="flex gap-2 mt-1 text-gray-500">
                <i className="bx bxs-school text-lg"></i>
                <p className="text-sm font-semibold">JRMSU • {location}</p>
              </div>
            </div>
          </div>

          <div className="flex md:flex-row items-center lg:justify-between mt-8 w-full">
            <div className="sm:mt-[13px] md:mt-[13px] lg:-mt-[5px] ml-0 lg:ml-10 md:ml-8 w-full sm:ml-10 sm:justify-start flex justify-center  relative">
              <ul className="text-sm relative flex-wrap justify-center gap-9 font-semibold text-gray-600 sm:flex hidden">
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

              <div className="relative block sm:hidden">
                <select
                  className="w-full sm:w-auto p-2 bg-white text-sm text-gray-600 outline-none"
                  value={activeIndex}
                  onChange={(e) => setActiveIndex(Number(e.target.value))}
                >
                  {["Practice Questions", "Exam Questions", "Statistics", "Tagged", "Pending"].map((item, index) => (
                    <option key={index} value={index}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="absolute bottom-[-14px] md:ml-0 md:bottom-[-14px] h-[3px] bg-orange-500 transition-all duration-300"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                }}
              ></div>
            </div>

            <div className="z-51 flex gap-3 mt-4 md:mt-3 md:relative md:right-0 fixed bottom-5 right-5">
              <button onClick={handleAssignClick} className="cursor-pointer items-center gap-2 px-4 py-2 border border-orange-400 rounded-md text-orange-600 bg-orange-100 hover:bg-orange-200 hidden lg:flex">
                <i className="bx bx-cog text-lg"></i>
                <span className="text-[14px]">Assign</span>
              </button>
              <button
               className=" cursor-pointer items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 hidden lg:flex">
                <i className="bx bxs-show text-lg"></i>
                <span className="text-[14px]">Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <PracticeExamConfig
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        subjectID={subjectID}
      />
    </div>
  );
};

export default SubjectCard;
