import { useState, useRef, useEffect } from "react";
import ConfirmModal from "./confirmModal"; // Import modal
import CustomDropdown from "./customDropdown";

const PracticeAddQuestionForm = ({ subjectID, onQuestionAdded, topRadius, onCancel, areChoicesValid }) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef(null);
  const [image, setImage] = useState(null);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 

  const [questionData, setQuestionData] = useState({
    subjectID,
    coverage: "midterm",
    questionText: "",
    image: null,
    score: 1,
    difficulty: "easy",
    status: "pending",
    purpose: "practiceQuestions",
  });

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleQuestionChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      const file = files[0];
      setQuestionData({ ...questionData, image: file });

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setQuestionData({ ...questionData, [name]: value });
    }
  };

  const handleFormat = (command, setState) => {
    document.execCommand(command, false, null);
    setState(document.queryCommandState(command));
    editorRef.current.focus(); 
  };

  // Update formatting state when selection changes
  const checkFormatting = () => {
    setTimeout(() => {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
    }, 10);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.addEventListener("focus", () => setIsFocused(true));
      editorRef.current.addEventListener("blur", () => setIsFocused(false));
      editorRef.current.addEventListener("mouseup", checkFormatting);
      editorRef.current.addEventListener("keyup", checkFormatting);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    

    setShowConfirmModal(true);
    
  };

  const confirmSubmit = async () => {
    

    setShowConfirmModal(false);
    

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("subjectID", subjectID);
    formData.append("coverage", questionData.coverage);
    formData.append("questionText", questionData.questionText);
    formData.append("score", questionData.score);
    formData.append("difficulty", questionData.difficulty);
    formData.append("status", questionData.status);
    formData.append("purpose", questionData.purpose); // Append the purposeID

    if (questionData.image) {
      formData.append("image", questionData.image);
    }

    try {
      const response = await fetch(`${apiUrl}/questions/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to add question.");
        console.error("Validation errors:", result.errors);
      } else {
        setSuccessMsg("Question added successfully!");
        console.log("Success:", result.data);

        if (onQuestionAdded) {
          onQuestionAdded(result.data);
        }

        setQuestionData({
          subjectID,
          coverage: "midterm",
          questionText: "",
          image: null,
          score: 1,
          difficulty: "easy",
          status: "pending",
          purpose: "practiceQuestions",
        });

        setImagePreview(null);
      }
    } catch (err) {
      console.error("Error submitting:", err);
      setError("Something went wrong.");
    }
  };

  return (
    
    <div className='flex'> 
      <div className='flex-1'>
        {/* Header */}
        <div className="font-inter text-[14px] max-w-3xl mx-auto bg-white py-2 pl-4 shadow-lg rounded-t-md border border-color relative text-gray-600 font-medium">
          <span>Add Question</span>
        </div>

        {/* Question Card */}
        <div
          className={`w-full max-w-3xl sm:px-4 mx-auto p-4 bg-white shadow-lg border-color border-t-0 border relative ${
            topRadius ? "rounded-md" : "rounded-b-md"
          }`}>
          {/* Header */}
          <div className="flex justify-between items-center text-gray-600 text-[14px]">
            <span>Multiple Choice</span>
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question Input */}
            <div
              className={`relative hover:cursor-text hover:bg-gray-200 mt-4 p-1 bg-gray-100 rounded-sm transition-all duration-150 ${
                isFocused ? "bg-gray-200" : ""
              }`}
              onClick={() => editorRef.current.focus()}
            >
              {/* Animated Left Border */}
              <div
                className={`absolute left-0 top-1/2 bg-orange-500 transition-all duration-200 rounded-l-sm ${
                  isFocused ? "h-full animate-expand-border" : "h-0"
                }`}
                style={{ width: "4px", transform: "translateY(-50%)" }}
              ></div>

              {/* Placeholder */}
              {(!isFocused && questionData.questionText.trim() === "") && (
                <span className="absolute top-[14px] left-4 text-gray-400 text-[14px] pointer-events-none">
                  Type question here...
                </span>
              )}

              {/* Content Editable */}
              <div
                ref={editorRef}
                contentEditable
                className="mt-1 bg-inherit py-2 pl-3 text-[14px] w-full max-w-full border-gray-300 focus:outline-none focus:border-orange-500 min-h-[40px] overflow-hidden resize-none whitespace-pre-wrap break-words break-all"
                suppressContentEditableWarning={true}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onInput={(e) => {
                  setQuestionData({ ...questionData, questionText: e.target.innerText });
                  // Auto-expand height
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              >
              </div>
            </div>

            {/* Text Formatting Options */}
            <div className="text-[24px] flex gap-2 sm:gap-6 mt-2 text-[rgb(120,120,120)]">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("bold", setIsBold);
                }}
                className={`cursor-pointer hover:text-gray-900 ${isBold ? "text-orange-500 font-bold" : ""}`}
              >
                <i className="bx bx-bold"></i>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("italic", setIsItalic);
                }}
                className={`cursor-pointer  hover:text-gray-900 ${isItalic ? "text-orange-500 italic" : ""}`}
              >
                <i className="bx bx-italic"></i>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("underline", setIsUnderline);
                }}
                className={`cursor-pointer hover:text-gray-900  ${isUnderline ? "text-orange-500 underline" : ""}`}
              >
                <i className="bx bx-underline"></i>
              </button>

              {/* Image Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()} // Open file picker
                className="cursor-pointer hover:text-gray-900"
              >
                <i className="bx bx-image-alt"></i>
              </button>
                
              <input
                type="file"
                name="image"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleQuestionChange}
              />
              
            </div>

            {imagePreview && (
              <div className="mt-3 relative inline-block max-w-[300px]">
                <div className="flex flex-col items-start">
                  <img
                    src={imagePreview}
                    alt="Uploaded"
                    className="max-w-full h-auto rounded-sm shadow-md cursor-pointer object-contain"
                    onClick={() => setisQuestionModalOpen(true)}
                  />

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionData({ ...questionData, image: null });
                      setImagePreview(null);
                    }}
                    className="hover:cursor-pointer text-white absolute top-4 right-4 bg-black opacity-70 px-[2px] pt-[2px] rounded-full text-xs transform translate-x-1/2 -translate-y-1/2"
                  >
                    <i className="bx bx-x text-[20px]"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Image Modal (Full Size) */}
            {isQuestionModalOpen && imagePreview && (
              <div
                className="fixed inset-0 lightbox-bg flex items-center justify-center z-55 h-full bg-black bg-opacity-70"
                onClick={() => setisQuestionModalOpen(false)}
              >
                <div className="relative max-w-full max-h-full">
                  <img
                    src={imagePreview}
                    alt="Full View"
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row px-2 mt-7 mb-1 gap-4">
              {/* Score Input */}
              <div className="flex items-center gap-2 w-[20%] sm:w-auto">
                <label htmlFor="score" className="text-[14px] text-gray-700">Score:</label>
                <input
                  name="score"
                  type="number"
                  min="1"
                  max="100"
                  onChange={handleQuestionChange}
                  value={questionData.score}
                  className="outline-none text-[14px] border-0 border-b border-gray-300 p-1 w-10 sm:w-[50px] focus:border-b-2 focus:border-orange-500 transition-all duration-100"
                  required
                  onInput={(e) => {
                    // Prevent inputting numbers less than 1
                    if (parseInt(e.target.value) < 1) {
                      e.target.value = 1;
                    }
                    // Prevent inputting numbers greater than 100
                    if (parseInt(e.target.value) > 100) {
                      e.target.value = 100;
                    }
                  }}
                />
              </div>
              {/* Difficulty Dropdown */}
              <CustomDropdown
                label="Difficulty"
                name="difficulty"
                value={questionData.difficulty}
                onChange={handleQuestionChange}
                placeholder="Select difficulty..."
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "moderate", label: "Moderate" },
                  { value: "hard", label: "Hard" },
                ]}
              />
              {/* Coverage Dropdown */}
              <CustomDropdown
                label="Coverage"
                name="coverage"
                value={questionData.coverage}
                onChange={handleQuestionChange}
                options={[
                  { value: "midterm", label: "Midterms" },
                  { value: "finals", label: "Finals" },
                ]}
              />

              {/* Submit Button (Aligned Right) */}
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onCancel}
                  className="sm:mt-0 mt-4 cursor-pointer px-4 py-1 border rounded-lg text-gray-700 hover:bg-gray-200 ml-auto"
                >
                  <span className="text-[14px]">Cancel</span>
                </button>

                <button
                  type="submit"
                  className="cursor-pointer flex items-center gap-1 px-[12px] py-2 mt-4 sm:mt-0 bg-orange-500 text-white rounded-lg hover:bg-orange-600 ml-auto"
                >
                  <i className="bx bx-save text-[18px] hidden sm:inline-block"></i> 
                  <span className="text-[14px]">Submit</span>
                </button>
              </div>
              
            </div>
            {error && <p className="flex justify-center mt-7 text-red-500">Error: {error}</p>}
            {successMsg && <p className="text-green-500">{successMsg}</p>}
          </form>
          {/* Confirmation Modal */}
          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmSubmit}
            message="Are you sure you want to add this question?"
          />
        </div>
      </div>
    </div>
  );
};

export default PracticeAddQuestionForm;
