import { useState, useRef, useEffect } from "react";

const Test = () => {
  const [subject, setSubject] = useState("Calculus 1");
  const [coverage, setCoverage] = useState("Midterms");
  const [numItems, setNumItems] = useState(50);
  const [difficulty, setDifficulty] = useState({
    easy: 25,
    moderate: 50,
    hard: 25,
  });

  const containerRef = useRef();
  const buttonRef = useRef();
  const [position, setPosition] = useState({ top: 440, left: 120 });
  const moveCooldown = useRef(null);

  // Keep difficulty total at 100%
  const handleSliderChange = (level, value) => {
    value = parseInt(value);
    let otherLevels = Object.keys(difficulty).filter((key) => key !== level);
    let remaining = 100 - value;
    let newValues = {};

    if (remaining < 0) {
      value = 100;
      remaining = 0;
    }

    const avg = Math.floor(remaining / 2);
    newValues[otherLevels[0]] = avg;
    newValues[otherLevels[1]] = remaining - avg;

    setDifficulty({
      ...newValues,
      [level]: value,
    });
  };

  // Runaway Button Logic
  const runAway = (e) => {
    if (moveCooldown.current) return;

    moveCooldown.current = setTimeout(() => {
      const button = buttonRef.current;
      const container = containerRef.current;

      if (!button || !container) return;

      const btnRect = button.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();

      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;

      const dx = mouseX - btnCenterX;
      const dy = mouseY - btnCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 120) {
        const moveX = (Math.random() - 0.5) * 200;
        const moveY = (Math.random() - 0.5) * 100;

        let newLeft = position.left + moveX;
        let newTop = position.top + moveY;

        const maxLeft = contRect.width - btnRect.width;
        const maxTop = contRect.height - btnRect.height;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        setPosition({ left: newLeft, top: newTop });
      }

      clearTimeout(moveCooldown.current);
      moveCooldown.current = null;
    }, 30);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={runAway}
      className="relative max-w-full mx-auto p-4 bg-white rounded-xl shadow-md h-[550px] overflow-hidden"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Customize Exam</h2>

      {/* Subject Dropdown */}
      <label className="block text-sm text-gray-700 mb-1">Select Subject</label>
      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-4"
      >
        <option>Calculus 1</option>
        <option>Physics</option>
        <option>Chemistry</option>
      </select>

      {/* Coverage Toggle */}
      <label className="block text-sm text-gray-700 mb-1">Select Coverage</label>
      <div className="flex gap-2 mb-4">
        {["Midterms", "Finals"].map((item) => (
          <button
            key={item}
            onClick={() => setCoverage(item)}
            className={`flex-1 py-2 rounded text-white font-medium ${
              coverage === item ? "bg-orange-500" : "bg-orange-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Number of Items */}
      <label className="block text-sm text-gray-700 mb-1">Number of Items</label>
      <input
        type="number"
        value={numItems}
        onChange={(e) => setNumItems(parseInt(e.target.value))}
        className="w-full p-2 border border-gray-300 rounded mb-4"
        min={1}
      />

      {/* Difficulty Settings */}
      <label className="block text-sm text-gray-700 mb-1">Difficulty Settings</label>
      <select className="w-full p-2 border border-gray-300 rounded mb-4">
        <option>Custom (must equal to 100%)</option>
      </select>

      {["easy", "moderate", "hard"].map((level) => (
        <div key={level} className="flex items-center justify-between mb-3">
          <span className="capitalize w-20 text-sm text-gray-600">{level}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={difficulty[level]}
            onChange={(e) => handleSliderChange(level, e.target.value)}
            className="flex-1 mx-2 accent-orange-500"
          />
          <input
            type="number"
            value={difficulty[level]}
            onChange={(e) => handleSliderChange(level, e.target.value)}
            className="w-14 p-1 border border-gray-300 rounded text-center"
          />
          <span className="ml-1 text-sm">%</span>
        </div>
      ))}

      {/* Runaway Button */}
      <button
        ref={buttonRef}
        className="absolute py-2 px-4 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 transition-all duration-300 ease-in-out"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transition: "top 0.3s ease, left 0.3s ease",
        }}
      >
        ✓ Done
      </button>
    </div>
  );
};

export default Test;
