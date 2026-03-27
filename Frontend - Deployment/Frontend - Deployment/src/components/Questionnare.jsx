import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SideBarToolTip from "./sidebarTooltip";
import useToast from "../hooks/useToast";

// Helper function to transform program names
const getDisplayProgramName = (programName) => {
  if (programName === "GE") {
    return "General Subject";
  }
  return programName;
};

const Questionnare = ({
  item,
  isExpanded,
  setIsExpanded,
  setSelectedSubject,
  setIsSubjectFocused,
  homePath,
  className,
  selectedSubject,
}) => {
  return (
    <div className="">
      <li className="relative flex cursor-pointer items-center gap-3 rounded-md px-[8px] py-[4px] sm:hover:bg-gray-100">
        <span className="hidden sm:inline">
          <SideBarToolTip
            label="Quizzes"
            isExpanded={isExpanded}
            className="ml-[15px]"
          >
            <i
              className={`bx ${item.icon} ${className} text-2xl text-gray-700 hover:text-gray-800 sm:pt-1 sm:text-2xl`}
              onClick={() => alert("Under development")}
            ></i>
          </SideBarToolTip>
        </span>
        {/* Always show icon on mobile, but without tooltip */}
        <span className="sm:hidden">
          <i
            onClick={() => alert("Under development")}
            className={`bx ${item.icon} ${className} text-2xl text-gray-700 hover:text-gray-800 sm:pt-1 sm:text-2xl`}
          ></i>
        </span>
      </li>
    </div>
  );
};

export default Questionnare;
