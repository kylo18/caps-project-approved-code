import { useState, useRef, useEffect } from "react";
import ConfirmModal from "./confirmModal"; // Import modal
import CustomDropdown from "./customDropdown";

const PracticeAddQuestionForm = ({
  subjectID,
  onQuestionAdded,
  topRadius,
  onCancel,
  areChoicesValid,
}) => {
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

    if (questionData.questionText.trim() === "") {
      setError("Please enter a question before submitting.");
      return;
    }

    setError("");

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
    <div className="flex">
      <div className="flex-1">
        {/* Header */}
        <div className="font-inter border-color relative mx-auto mt-2 max-w-3xl rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-600 shadow-lg">
          <span>Add Question</span>
        </div>

        {/* Question Card */}
        <div
          className={`border-color relative mx-auto w-full max-w-3xl border border-t-0 bg-white p-4 shadow-lg sm:px-4 ${
            topRadius ? "rounded-md" : "rounded-b-md"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between text-[14px] text-gray-500">
            <span>Multiple Choice</span>
            <div className="flex items-center">
              <span className="rounded-lg px-2 py-1 text-[13px] font-medium">
                {questionData.difficulty.charAt(0).toUpperCase() +
                  questionData.difficulty.slice(1)}
              </span>
              <span> •</span>
              {/* Coverage Badge */}
              <span className="rounded-lg px-2 py-1 text-[13px] font-medium">
                {questionData.coverage.charAt(0).toUpperCase() +
                  questionData.coverage.slice(1)}
              </span>
              <span className="border-color ml-2 rounded-full border px-3 py-1 text-[13px] font-medium">
                {questionData.score} pt
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question Input */}
            <div
              className={`relative mt-4 rounded-sm bg-gray-100 p-1 transition-all duration-150 hover:cursor-text hover:bg-gray-200 ${
                isFocused ? "bg-gray-200" : ""
              }`}
              onClick={() => editorRef.current.focus()}
            >
              {/* Animated Left Border */}
              <div
                className={`absolute top-1/2 left-0 rounded-l-sm bg-orange-500 transition-all duration-200 ${
                  isFocused ? "animate-expand-border h-full" : "h-0"
                }`}
                style={{ width: "4px", transform: "translateY(-50%)" }}
              ></div>

              {/* Placeholder */}
              {!isFocused && questionData.questionText.trim() === "" && (
                <span className="pointer-events-none absolute top-[14px] left-4 text-[14px] text-gray-400">
                  Type question here...
                </span>
              )}

              {/* Content Editable */}
              <div
                ref={editorRef}
                contentEditable
                className="mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-300 bg-inherit py-2 pl-3 text-[14px] break-words break-all whitespace-pre-wrap focus:border-orange-500 focus:outline-none"
                suppressContentEditableWarning={true}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onInput={(e) => {
                  setQuestionData({
                    ...questionData,
                    questionText: e.target.innerText,
                  });
                  // Auto-expand height
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              ></div>
            </div>

            {/* Text Formatting Options */}
            <div className="mt-2 flex gap-2 text-[24px] text-[rgb(120,120,120)] sm:gap-6">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("bold", setIsBold);
                }}
                className={`cursor-pointer hover:text-gray-900 ${isBold ? "font-bold text-orange-500" : ""}`}
              >
                <i className="bx bx-bold"></i>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("italic", setIsItalic);
                }}
                className={`cursor-pointer hover:text-gray-900 ${isItalic ? "text-orange-500 italic" : ""}`}
              >
                <i className="bx bx-italic"></i>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("underline", setIsUnderline);
                }}
                className={`cursor-pointer hover:text-gray-900 ${isUnderline ? "text-orange-500 underline" : ""}`}
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
              <div className="relative mt-3 inline-block max-w-[300px]">
                <div className="flex flex-col items-start">
                  <img
                    src={imagePreview}
                    alt="Uploaded"
                    className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-md"
                    onClick={() => setisQuestionModalOpen(true)}
                  />

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionData({ ...questionData, image: null });
                      setImagePreview(null);
                    }}
                    className="absolute top-4 right-4 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-black px-[2px] pt-[2px] text-xs text-white opacity-70 hover:cursor-pointer"
                  >
                    <i className="bx bx-x text-[20px]"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Image Modal (Full Size) */}
            {isQuestionModalOpen && imagePreview && (
              <div
                className="lightbox-bg bg-opacity-70 fixed inset-0 z-55 flex h-full items-center justify-center bg-black"
                onClick={() => setisQuestionModalOpen(false)}
              >
                <div className="relative max-h-full max-w-full">
                  <img
                    src={imagePreview}
                    alt="Full View"
                    className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
                  />
                </div>
              </div>
            )}

            <div className="mt-7 mb-1 flex flex-col gap-4 px-2 sm:flex-row">
              {/* Score Input */}
              <div className="flex w-[20%] items-center gap-2 sm:w-auto">
                <label htmlFor="score" className="text-[14px] text-gray-700">
                  Score:
                </label>
                <input
                  name="score"
                  type="number"
                  min="1"
                  max="100"
                  onChange={handleQuestionChange}
                  value={questionData.score}
                  className="w-10 border-0 border-b border-gray-300 p-1 text-[14px] transition-all duration-100 outline-none focus:border-b-2 focus:border-orange-500 sm:w-[50px]"
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
              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-4 ml-auto cursor-pointer rounded-lg border px-4 py-1 text-gray-700 hover:bg-gray-200 sm:mt-0"
                >
                  <span className="text-[14px]">Cancel</span>
                </button>

                <button
                  type="submit"
                  className="mt-4 ml-auto flex cursor-pointer items-center gap-1 rounded-lg bg-orange-500 px-[12px] py-2 text-white hover:bg-orange-600 sm:mt-0"
                >
                  <i className="bx bx-save hidden text-[18px] sm:inline-block"></i>
                  <span className="text-[14px]">Submit</span>
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-7 flex justify-center text-red-500">{error}</p>
            )}
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
