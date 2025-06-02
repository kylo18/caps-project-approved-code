import { useState, useEffect, useRef } from "react";
import SubPhoto from "../assets/gottfield.jpg";
import PracticeExamConfig from "./practiceExamConfig";
import { useNavigate } from "react-router-dom";

// Component to display subject information and tabs for admin/faculty view
const SubjectCard = ({
  subjectName,
  subjectID,
  location,
  activeIndex,
  setActiveIndex,
  isLoading,
  onFetchQuestions,
}) => {
  // State for tab indicator animation
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  // State for practice exam configuration modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  // State for mobile dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);
  // Refs for tab elements and dropdown positioning
  const tabRefs = useRef([]);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // Function to refresh questions list
  const handleRefresh = () => {
    onFetchQuestions();
  };

  // State for toast notifications
  const [toast, setToast] = useState({
    message: "",
    type: "",
    show: false,
  });

  // Effect to handle toast auto-dismiss
  useEffect(() => {
    if (toast.message) {
      setToast((prev) => ({ ...prev, show: true }));

      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          setToast({ message: "", type: "", show: false });
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  // Effect to update tab indicator position
  useEffect(() => {
    if (tabRefs.current[activeIndex]) {
      const activeTab = tabRefs.current[activeIndex];
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [activeIndex]);

  // Function to open practice exam configuration
  const handleAssignClick = () => {
    setIsFormOpen(true);
  };

  // Effect to handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to handle successful exam configuration
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setToast({
      message: "Exam successfully configured!",
      type: "success",
      show: false,
    });
  };

  // Function to fetch and preview practice exam questions
  const handlePreviewClick = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/practice-exam/preview/${subjectID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch preview questions");
      }

      const examData = await response.json();

      // Navigate to practice exam with preview flag
      navigate("/practice-exam", {
        state: {
          subjectID,
          examData: {
            ...examData,
            subjectName,
            isPreview: true,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching preview questions:", error);
      setToast({
        message: "Failed to load preview questions. Please try again.",
        type: "error",
        show: false,
      });
    }
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
          <div className="flex">
            <button
              onClick={handleRefresh}
              className="absolute top-12 right-2 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-gray-400 text-2xl hover:bg-gray-200 sm:absolute lg:top-2 lg:right-2"
            >
              <i className="bx bx-refresh text-gray-500"></i>
            </button>

            <button
              ref={buttonRef}
              className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-gray-400 text-2xl hover:bg-gray-200 sm:absolute lg:hidden"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              <i className="bx bx-dots-horizontal-rounded text-gray-500"></i>
            </button>

            {showDropdown && (
              <div
                ref={dropdownRef}
                className="open-sans border-color absolute right-2 z-50 mt-8 w-40 origin-top-right rounded-md border bg-white p-1 shadow-sm"
              >
                <button
                  onClick={handleAssignClick}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-4 py-2 text-left text-sm transition"
                >
                  <i className="bx bx-cog text-[18px]" />
                  Configure
                </button>
                <button
                  onClick={() => alert("Feature under development")}
                  className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-sm px-4 py-2 text-left text-sm transition"
                >
                  <i className="bx bx-show text-[18px]" />
                  Preview
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center">
            <img
              src={SubPhoto}
              alt="Subject"
              className="mr-5 size-16 rounded-md border border-gray-300 object-cover"
            />
            <div className="flex max-w-[calc(100%-125px)] flex-col flex-wrap">
              <h1 className="line-clamp-2 text-[15px] font-bold break-words sm:line-clamp-1 md:text-[18px]">
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
              <button
                onClick={handleAssignClick}
                className="hidden cursor-pointer items-center gap-2 rounded-md border border-orange-400 bg-orange-100 px-4 py-2 text-orange-600 hover:bg-orange-200 lg:flex"
              >
                <i className="bx bx-cog text-lg"></i>
                <span className="text-[14px]">Configure</span>
              </button>
              <button
                onClick={() => alert("Feature under development")}
                className="hidden cursor-pointer items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 lg:flex"
              >
                <i className="bx bx-show text-lg"></i>
                <span className="text-[14px]">Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <PracticeExamConfig
          isFormOpen={isFormOpen}
          setIsFormOpen={setIsFormOpen}
          subjectID={subjectID}
          onSuccess={handleFormSuccess}
        />
      )}

      {toast.message && (
        <div
          className={`fixed top-6 left-1/2 z-56 mx-auto flex max-w-md -translate-x-1/2 transform items-center justify-between rounded border border-l-4 bg-white px-4 py-2 shadow-md ${
            toast.type === "success" ? "border-green-400" : "border-red-400"
          }`}
        >
          <div className="flex items-center">
            <i
              className={`mr-3 text-[24px] ${
                toast.type === "success"
                  ? "bx bxs-check-circle text-green-400"
                  : "bx bxs-error text-red-400"
              }`}
            ></i>
            <div>
              <p className="font-semibold text-gray-800">
                {toast.type === "success" ? "Success" : "Error"}
              </p>
              <p className="mb-1 text-sm text-nowrap text-gray-600">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectCard;
