import { useState } from "react";
import ComingSoon from "../assets/icons/comingsoon.png";

export default function HomeTabs() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="outfit-400 mt-8 text-center text-gray-500">
      <div className="flex flex-col items-center justify-center py-10">
        <img
          src={ComingSoon}
          alt="Dashboard coming soon "
          className="mb-2 h-32 w-32 opacity-80"
        />
        <span className="outfit-500 w-90 text-[15px] text-gray-500">
          The Home Page is still under development. To create quizzes, please
          select a subject from the sidebar.
        </span>
      </div>
    </div>
  );
}
