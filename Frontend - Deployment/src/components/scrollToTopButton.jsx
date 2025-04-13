import React, { useState, useEffect } from 'react';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const checkScroll = () => {
    setIsVisible(window.scrollY > 300);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`flex items-center justify-center fixed bottom-4 left-[calc(50%+32px)] transform -translate-x-1/2 
        bg-white text-gray-700 rounded-full shadow-md hover:bg-gray-200 p-1 cursor-pointer border border-color transition-all duration-300
        ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
    >
      <i className="bx bx-chevron-up text-[30px]"></i>
    </button>
  );
};

export default ScrollToTopButton;
