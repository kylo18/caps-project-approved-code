import React, { useState, useEffect, useRef } from 'react';
import 'boxicons/css/boxicons.min.css';

const Toolbar = ({ onPointsChange, onDifficultyChange, points, difficulty }) => {
  const [showPointsInput, setShowPointsInput] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const toolbarRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setShowPointsInput(false);
        setShowDifficultyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={toolbarRef} className="fixed bottom-20 right-33 border-gray-400 border transform -translate-y-1/2 flex flex-col gap-3 bg-white shadow-lg p-2 rounded-md">
      {/* Points Icon */}
      <div className="relative group">
        <button onClick={() => {
          setShowPointsInput(!showPointsInput);
          setShowDifficultyDropdown(false);
        }}
          className="p-2 hover:bg-gray-200 rounded">
          <i className='bx bx-coin-stack text-xl'></i>
        </button>
        {showPointsInput && (
          <div className="absolute right-full ml-2 bg-white shadow-md p-2 rounded flex items-center fade-in">
            <input
              type="number"
              value={points}
              onChange={(e) => onPointsChange(e.target.value)}
              className="w-16 border rounded px-1 py-0.5 text-sm"
              min="1"
            />
          </div>
        )}
      </div>

      {/* Difficulty Icon */}
      <div className="relative group">
        <button onClick={() => {
          setShowDifficultyDropdown(!showDifficultyDropdown);
          setShowPointsInput(false);
        }}
          className="p-2 hover:bg-gray-200 rounded">
          <i className='bx bx-line-chart text-xl'></i>
        </button>
        {showDifficultyDropdown && (
          <div className="absolute left-full ml-2 bg-white shadow-md p-2 rounded flex flex-col fade-in">
            {['Easy', 'Moderate', 'Hard'].map((level) => (
              <button
                key={level}
                className={`px-2 py-1 text-sm hover:bg-gray-100 rounded ${difficulty === level ? 'font-bold' : ''}`}
                onClick={() => {
                  onDifficultyChange(level);
                  setShowDifficultyDropdown(false);
                }}>
                {level}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
