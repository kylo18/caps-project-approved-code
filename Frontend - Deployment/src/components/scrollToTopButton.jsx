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
      aria-label="Back to top"
      title="Back to top"
      className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 transform items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:bg-gray-100 hover:shadow-xl md:left-[calc(50%+32px)] ${
        isVisible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      } h-10 w-10 gap-0 text-sm font-medium sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2`}
    >
      <i className="bx bx-arrow-up-stroke text-[20px] sm:text-[24px]"></i>
      <span className="hidden sm:inline">Back to Top</span>
    </button>
  );
};

export default ScrollToTopButton;
