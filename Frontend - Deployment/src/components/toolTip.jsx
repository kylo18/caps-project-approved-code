import { useState, useEffect, useRef } from "react";

const Tooltip = ({
  content,
  children,
  placement = "top",
  trigger = "hover",
  className = "",
  arrow = true,
  delay = 0,
  maxWidth = "200px",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  let timeoutId = null;

  const placements = {
    top: {
      position: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
      arrow:
        "absolute top-full left-1/2 -translate-x-1/2 border-y-8 border-x-8 border-t-gray-700 border-x-transparent border-b-transparent",
    },
    "top-start": {
      position: "bottom-full left-0 -translate-y-2",
      arrow: "bottom-0 left-4 translate-y-full border-t-gray-700",
    },
    "top-end": {
      position: "bottom-full right-0 -translate-y-2",
      arrow: "bottom-0 right-4 translate-y-full border-t-gray-700",
    },
    bottom: {
      position: "top-full left-1/2 -translate-x-1/2 translate-y-2",
      arrow:
        "absolute bottom-full left-1/2 -translate-x-1/2 border-y-8 border-x-8 border-b-gray-700 border-x-transparent border-t-transparent",
    },
    "bottom-start": {
      position: "top-full left-0 translate-y-2",
      arrow: "top-0 left-4 -translate-y-full border-b-gray-700",
    },
    "bottom-end": {
      position: "top-full right-0 translate-y-2",
      arrow: "top-0 right-4 -translate-y-full border-b-gray-700",
    },
    left: {
      position: "right-full top-1/2 -translate-y-1/2 -translate-x-2",
      arrow:
        "absolute left-full top-1/2 -translate-y-1/2 border-y-8 border-x-8 border-l-gray-700 border-y-transparent border-r-transparent",
    },
    "left-start": {
      position: "right-full top-0 -translate-x-2",
      arrow: "right-0 top-4 translate-x-full border-l-gray-700",
    },
    "left-end": {
      position: "right-full bottom-0 -translate-x-2",
      arrow: "right-0 bottom-4 translate-x-full border-l-gray-700",
    },
    right: {
      position: "left-full top-1/2 -translate-y-1/2 translate-x-2",
      arrow:
        "absolute right-full top-1/2 -translate-y-1/2 border-y-8 border-x-8 border-r-gray-700 border-y-transparent border-l-transparent",
    },
    "right-start": {
      position: "left-full top-0 translate-x-2",
      arrow: "left-0 top-4 -translate-x-full border-r-gray-700",
    },
    "right-end": {
      position: "left-full bottom-0 translate-x-2",
      arrow: "left-0 bottom-4 -translate-x-full border-r-gray-700",
    },
  };

  const showTooltip = () => {
    if (delay) {
      timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        trigger === "click" &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [trigger]);

  const handleTrigger = () => {
    if (trigger === "hover") {
      return {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
      };
    } else if (trigger === "click") {
      return {
        onClick: () => setIsVisible(!isVisible),
      };
    }
    return {};
  };

  return (
    <div className="group relative inline-block">
      <div ref={triggerRef} {...handleTrigger()}>
        {children}
      </div>
      <div
        ref={tooltipRef}
        role="tooltip"
        className={`pointer-events-none absolute z-60 inline-block rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-nowrap text-white opacity-0 shadow-sm transition-opacity duration-200 ${
          placements[placement].position
        } ${className} ${isVisible ? "pointer-events-auto opacity-100" : ""}`}
        style={{ maxWidth }}
      >
        {content}
        {arrow && <div className={placements[placement].arrow} />}
      </div>
    </div>
  );
};

export default Tooltip;
