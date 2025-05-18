import React, { useState, useEffect } from "react";

// Displays a button to scroll automatically to the top
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const checkScroll = () => {
    setIsVisible(window.scrollY > 300);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`border-color fixed bottom-4 left-1/2 flex -translate-x-1/2 transform cursor-pointer items-center justify-center rounded-full border bg-white p-1 text-gray-700 shadow-md transition-all duration-300 hover:bg-gray-200 md:left-[calc(50%+32px)] ${isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"} `}
    >
      <i className="bx bx-chevron-up text-[30px]"></i>
    </button>
  );
};

export default ScrollToTopButton;
