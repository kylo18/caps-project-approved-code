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
      className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 transform items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:bg-gray-100 hover:shadow-xl md:left-[calc(50%+32px)] ${
        isVisible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      <i className="bx bx-arrow-up-stroke text-[20px] md:text-[24px]"></i>
      <span className="hidden sm:inline">Back to Top</span>
    </button>
  );
};

export default ScrollToTopButton;
