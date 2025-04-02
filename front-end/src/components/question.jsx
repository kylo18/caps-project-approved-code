import { useState, useRef, useEffect } from "react";
import Button from "./button";

const Question = ({ topRadius = false, subjectID, onQuestionAdded }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [image, setImage] = useState(null); 
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false); 
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false); 
  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState(
    Array(6).fill({ text: "", image: null })
  );
  const editorRef = useRef(null);
  const fileInputRef = useRef(null); 
  const handleChoiceChange = (index, value) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], text: value };
    setChoices(newChoices);
  };
  const [score, setscore] = useState(1);
  const [difficulty, setDifficulty] = useState("easy");

  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [coverage, setCoverage] = useState("midterm");

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [questionData, setQuestionData] = useState({
    subjectID,
    coverage: "midterm",
    questionText: "",
    image: null,
    score: 1,
    difficulty: "easy",
    status: "pending",
  });

  const openImageModal = (imageSrc) => {
    setchoiceModalImage(imageSrc);
    setIsChoiceModalOpen(true);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.addEventListener("focus", () => setIsFocused(true));
      editorRef.current.addEventListener("blur", () => setIsFocused(false));
      editorRef.current.addEventListener("mouseup", checkFormatting);
      editorRef.current.addEventListener("keyup", checkFormatting);
    }
  }, []);

  return (
    <div className=" flex">
      <div className="flex-1">
        {/* Question Card */}
        <div
          className="w-full max-w-3xl sm:px-4 mx-auto p-4 bg-white shadow-md rounded-sm border-[rgb(200,200,200)] border relative"
        >
          {/* Header */}
          <div className="flex justify-between items-center text-gray-600 text-[14px]">
            <span>1. Multiple Choice</span>
            <div className="flex items-center space-x-2">
              <span className="text-[12px] font-medium">{questionData.score} pt</span>
              <span className={`text-white text-[12px] px-4 py-1 rounded-lg ${
                questionData.difficulty === "easy" ? "bg-green-500" : 
                questionData.difficulty === "moderate" ? "bg-yellow-500" : 
                "bg-red-500"
              }`}>
                {questionData.difficulty.charAt(0).toUpperCase() + questionData.difficulty.slice(1)}
              </span>

              {/* Coverage Badge */}
              <span className="text-white text-[12px] px-4 py-1 rounded-lg bg-blue-500">
                {questionData.coverage.charAt(0).toUpperCase() + questionData.coverage.slice(1)}
              </span>
            </div>
          </div>
          {/* Question Text */}
          <div className="relative hover:cursor-text hover:bg-gray-200 mt-4 p-1 bg-gray-100 rounded-sm transition-all duration-150">
            <div
              className="select-none mt-1 bg-inherit py-2 pl-3 text-[14px] w-full max-w-full border-gray-300 focus:outline-none focus:border-orange-500 min-h-[40px] overflow-hidden resize-none whitespace-pre-wrap break-words word-break break-word">
              <span>What is 1 + 1 = ?</span>
            </div>
          </div>

          {/* Display Uploaded Image */}
          {image && (
            <div className="mt-3 relative inline-block max-w-[300px]">
              {/* Ensure the container grows with the image */}
              <div className="flex flex-col items-start">
                <img
                  src={image}
                  alt="Uploaded"
                  className="max-w-full h-auto rounded-sm shadow-md cursor-pointer object-contain"
                  onClick={() => setisQuestionModalOpen(true)} // Open full-size view on click
                />

                {/* Close Button in Top-Right */}
                <button
                  onClick={() => setImage(null)}
                  className="hover:cursor-pointer text-white absolute top-4 right-4 bg-black opacity-70 px-[2px] pt-[2px] rounded-full text-xs transform translate-x-1/2 -translate-y-1/2"
                >
                  <i className="bx bx-x text-[20px]"></i>
                </button>
              </div>
            </div>
          )}

          {/* Image Modal (Full Size) */}
          {isQuestionModalOpen && (
            <div
              className="fixed inset-0 lightbox-bg flex items-center justify-center z-50"
              onClick={() => setisQuestionModalOpen(false)}>

              <div className="relative max-w-full max-h-full">
                <img
                  src={image}
                  alt="Full View"
                  
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
                />
              </div>
            </div>
          )}

          {/* Answer Options */}
          <div className="mt-3 space-y-3 p-3">
            {choices.map((choice, index) => (
              <div key={index} className="flex items-center space-x-2 relative">
                {/* Radio Button */}
                <input
                  type="radio"
                  name="correctAnswer"
                  className="cursor-pointer size-5 accent-orange-500"
                />

                {/* Text Input (Hidden when image is present) */}
                {!choice.image && (
                  <input
                  type="text"
                  value={choice.text}
                  onChange={(e) => handleChoiceChange(index, e.target.value)}
                  placeholder={`Choice ${index + 1}`}
                  className="text-[14px] p-2 w-[90%] "
                  onFocus={() => setFocusedChoice(index)}
                  onBlur={(e) => {
                    if (!e.relatedTarget || !e.relatedTarget.classList.contains("image-upload-btn")) {
                      setFocusedChoice(null);
                    }
                  }}
                  required
                />
                )}
                
                {/* Show Image If Added */}
                {choice.image && (
                  <div className="relative">
                    <img
                      src={choice.image}
                      alt={`Choice ${index + 1}`}
                      className="size-20 object-cover rounded-md hover:cursor-pointer"
                      onClick={() => {
                        setchoiceModalImage(choice.image); 
                        setIsChoiceModalOpen(true); 
                      }}
                  />
                  </div>
                )}
              </div>
            ))}

            {/* Image Modal (Full Size) */}
            {isChoiceModalOpen && (
              <div
                className="fixed inset-0 bg-black lightbox-bg flex items-center justify-center z-50"
                onClick={() => setIsChoiceModalOpen(false)}
              >
                <div className="relative max-w-full max-h-full">
                  <img
                    src={choiceModalImage}
                    alt="Full View"
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button text="Delete" textres="Delete" icon="bx bx-trash" />
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Question;

