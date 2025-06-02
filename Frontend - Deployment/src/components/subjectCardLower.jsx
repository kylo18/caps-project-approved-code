import { useState, useEffect, useRef } from "react";
import SubPhoto from "../assets/gottfield.jpg";

const SubjectCardLower = ({
  subjectName,
  subjectID,
  location,
  activeIndex,
  setActiveIndex,
  isLoading,
  onFetchQuestions,
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const tabRefs = useRef([]);
  const dropdownRef = useRef(null);

  const handleRefresh = () => {
    onFetchQuestions();
  };

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
    <div className="relative z-51 -mt-3 h-37 overflow-hidden rounded-sm border border-gray-300 bg-white px-4 pt-4 shadow-sm sm:h-40">
      <div className="flex animate-pulse items-center space-x-4">
        <div className="skeleton shimmer h-16 w-16 rounded-md"></div>
        <div className="flex-1">
          <div className="skeleton shimmer mb-2 h-8 w-1/2"></div>
          <div className="skeleton shimmer h-4 w-2/8 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="relative z-51 -mt-3 h-37 overflow-hidden rounded-sm border border-gray-300 bg-white px-4 pt-4 shadow-sm sm:h-40">
          <button
            onClick={handleRefresh}
            className="absolute top-2 right-12 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-gray-400 text-2xl hover:bg-gray-200 sm:absolute lg:right-2"
          >
            <i className="bx bx-refresh text-gray-500"></i>
          </button>
          <button
            ref={dropdownRef}
            className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-gray-400 text-2xl hover:bg-gray-200 sm:absolute lg:hidden"
            onClick={() => setShowDropdown((prev) => !prev)}
          >
            <i className="bx bx-dots-horizontal-rounded text-gray-500"></i>
          </button>

          {showDropdown && (
            <div className="absolute top-12 right-2 z-50 w-30 rounded-md border border-gray-300 bg-white shadow-md">
              <button
                onClick={handleAssignClick}
                className="block w-full cursor-pointer rounded-t-md px-4 py-2 text-left text-[14px] text-gray-700 transition duration-200 ease-in-out hover:bg-gray-200"
              >
                Assign
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                }}
                className="block w-full cursor-pointer rounded-b-md px-4 py-2 text-left text-[14px] text-gray-700 transition duration-200 ease-in-out hover:bg-gray-200"
              >
                Preview
              </button>
            </div>
          )}

          <div className="flex items-center">
            <img
              src={SubPhoto}
              alt="Subject"
              className="mr-5 size-16 rounded-md border border-gray-300 object-cover"
            />
            <div className="flex flex-col flex-wrap">
              <h1 className="text-[15px] font-bold break-words md:text-[21px]">
                {subjectName}
              </h1>
              <div className="mt-1 flex gap-2 text-gray-500">
                <i className="bx bxs-school text-lg"></i>
                <p className="text-sm font-semibold">JRMSU • {location}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex w-full items-center md:flex-row lg:justify-between">
            <div className="relative ml-0 flex w-full justify-center sm:mt-[13px] sm:ml-10 sm:justify-start md:mt-[13px] md:ml-8 lg:-mt-[5px] lg:ml-10">
              <ul className="relative hidden flex-wrap justify-center gap-9 text-sm font-semibold text-gray-600 sm:flex">
                {[
                  "Practice Questions",
                  "Qualifying Exam Questions",
                  "Statistics",
                  "Tagged",
                  "Pending",
                ].map((item, index) => (
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
                  className="w-full bg-white p-2 text-sm text-gray-600 outline-none sm:w-auto"
                  value={activeIndex}
                  onChange={(e) => setActiveIndex(Number(e.target.value))}
                >
                  {[
                    "Practice Questions",
                    "Qualifying Exam Questions",
                    "Statistics",
                    "Tagged",
                    "Pending",
                  ].map((item, index) => (
                    <option key={index} value={index}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="absolute bottom-[-14px] h-[3px] bg-orange-500 transition-all duration-300 md:bottom-[-14px] md:ml-0"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                }}
              ></div>
            </div>

            <div className="fixed right-5 bottom-5 z-51 mt-4 flex gap-3 md:relative md:right-0 md:mt-3">
              <button className="hidden cursor-pointer items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 lg:flex">
                <i className="bx bxs-show text-lg"></i>
                <span className="text-[14px]">Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectCardLower;
