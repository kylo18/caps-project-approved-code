import React, { useState, useRef, useEffect } from "react";
import CustomDropdown from "./customDropdown";
import WarnOnExit from "../hooks/WarnOnExit";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

// Combined Question Form for both Practice and Exam Questions
const CombinedQuestionForm = ({
  subjectID,
  onComplete,
  onCancel,
  activeTab,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [showTip, setShowTip] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [focusedChoice, setFocusedChoice] = useState(null);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const choiceEditors = useRef({});

  // State for question and choices
  const [formData, setFormData] = useState({
    subjectID,
    coverage_id: 1, // Default to midterm coverage
    questionText: "",
    image: null,
    score: 1,
    difficulty_id: 1, // Default to easy difficulty
    status_id: 1, // 1 is pending
    purpose_id: activeTab === 0 ? 2 : 1, // 2 for practice questions, 1 for exam questions
    choices: [
      { choiceText: "", isCorrect: false, image: null },
      { choiceText: "", isCorrect: false, image: null },
      { choiceText: "", isCorrect: false, image: null },
      { choiceText: "", isCorrect: false, image: null },
      {
        choiceText: "None of the above",
        isCorrect: false,
        image: null,
        isFixed: true,
      },
    ],
  });

  WarnOnExit(formData);

  // Question text formatting handlers
  useEffect(() => {
    const handleSelectionChange = () => {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const handleFormat = (command, setState) => {
    document.execCommand(command, false, null);
    setState(document.queryCommandState(command));
    editorRef.current.focus();
  };

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

  // Question handlers
  const handleQuestionChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Choice handlers
  const handleChoiceChange = (index, field, value) => {
    const updatedChoices = [...formData.choices];
    if (field === "isCorrect" && value) {
      updatedChoices.forEach((choice, i) => {
        if (i !== index) choice.isCorrect = false;
      });
    }
    updatedChoices[index][field] = value;
    setFormData((prev) => ({ ...prev, choices: updatedChoices }));
  };

  const handleChoiceImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const updatedChoices = [...formData.choices];
      updatedChoices[index] = {
        ...updatedChoices[index],
        image: file,
        choiceText: "",
      };
      setFormData((prev) => ({ ...prev, choices: updatedChoices }));
    }
  };

  const removeChoiceImage = (index) => {
    const updatedChoices = [...formData.choices];
    updatedChoices[index] = { choiceText: "", isCorrect: false, image: null };
    setFormData((prev) => ({ ...prev, choices: updatedChoices }));
  };

  // Submit handler
  const handleSubmit = async () => {
    setError(null);
    const formattedQuestionText = editorRef.current?.innerHTML?.trim() || "";

    // Validate question
    if (!formattedQuestionText || formattedQuestionText === "<br>") {
      setError("Please enter a question before submitting.");
      showToast("Please enter a question before submitting.", "error");
      return;
    }

    // Validate choices
    if (
      !formData.choices.every(
        (choice) => choice.choiceText.trim() !== "" || choice.image,
      )
    ) {
      setError("Each choice must have either text or an image.");
      showToast("Each choice must have either text or an image.", "error");
      return;
    }

    // Check if exactly one choice is correct
    const correctChoices = formData.choices.filter(
      (choice) => choice.isCorrect,
    );
    if (correctChoices.length !== 1) {
      setError("Please select exactly one correct answer.");
      showToast("Please select exactly one correct answer.", "error");
      return;
    }

    // Directly proceed with submission
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      // First, submit the question
      const questionFormData = new FormData();
      questionFormData.append("subjectID", formData.subjectID);
      questionFormData.append("coverage_id", formData.coverage_id);
      questionFormData.append(
        "questionText",
        editorRef.current.innerHTML.trim(),
      );
      questionFormData.append("score", formData.score);
      questionFormData.append("difficulty_id", formData.difficulty_id);
      questionFormData.append("status_id", formData.status_id);
      questionFormData.append("purpose_id", formData.purpose_id);

      if (formData.image) {
        questionFormData.append("image", formData.image);
      }

      const questionResponse = await fetch(`${apiUrl}/questions/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: questionFormData,
      });

      const questionResult = await questionResponse.json();

      if (!questionResponse.ok) {
        throw new Error(questionResult.message || "Failed to add question.");
      }

      // Then, submit the choices
      const choicesFormData = new FormData();
      choicesFormData.append("questionID", questionResult.data.questionID);

      // Send all 4 choices to the backend
      formData.choices.forEach((choice, index) => {
        choicesFormData.append(
          `choices[${index}][choiceText]`,
          choice.choiceText.trim(),
        );
        choicesFormData.append(
          `choices[${index}][isCorrect]`,
          choice.isCorrect ? "1" : "0",
        );
        if (choice.image instanceof File) {
          choicesFormData.append(`choices[${index}][image]`, choice.image);
        }
      });

      const choicesResponse = await fetch(`${apiUrl}/questions/choices`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: choicesFormData,
      });

      if (!choicesResponse.ok) {
        throw new Error("Failed to add choices.");
      }

      showToast("Question added successfully!", "success");
      onComplete();
    } catch (err) {
      console.error("Error submitting:", err);
      setError(
        err.message || "Something went wrong while submitting the question.",
      );
      showToast(
        err.message || "Something went wrong while submitting the question.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="lightbox-bg fixed inset-0 z-105 flex items-center justify-center overflow-y-auto">
        <div className="scrollbar-hide animate-fade-in-up flex max-h-[95vh] overflow-y-auto p-3">
          <div className="flex-1">
            {/* Header */}
            <div className="font-inter border-color relative mx-auto mt-2 max-w-5xl rounded-t-md border bg-white py-2 pl-4 text-[14px] font-medium text-gray-600 shadow-lg">
              <div className="flex items-center justify-between pr-4">
                <span>ADD QUESTION</span>
                <button
                  onClick={onCancel}
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                >
                  <i className="bx bx-x text-[24px]"></i>
                </button>
              </div>
            </div>

            {/* Question Card */}
            <div className="border-color relative mx-auto mb-3 w-full max-w-5xl rounded-b-md border border-t-0 bg-white p-4 shadow-lg sm:px-4">
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <div className="mt-[6px] flex aspect-square h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                  1
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-black">
                    Write your question
                  </h3>
                  <p className="text-sm text-gray-500">
                    Input your question in the designated field.
                  </p>
                </div>
              </div>

              {/* Question Input */}
              <div
                className={`relative mt-4 rounded-sm bg-gray-100 p-1 transition-all duration-150 hover:cursor-text hover:bg-gray-200 ${isFocused ? "bg-gray-200" : ""}`}
                onClick={() => editorRef.current.focus()}
              >
                <div
                  className={`absolute top-1/2 left-0 rounded-l-sm bg-orange-500 transition-all duration-200 ${isFocused ? "animate-expand-border h-full" : "h-0"}`}
                  style={{ width: "4px", transform: "translateY(-50%)" }}
                ></div>

                {!isFocused && !formData.questionText && (
                  <span className="pointer-events-none absolute top-[14px] left-4 text-[14px] text-gray-400">
                    Enter question...
                  </span>
                )}

                <div
                  ref={editorRef}
                  contentEditable
                  className="mt-1 min-h-[40px] w-full max-w-full resize-none overflow-hidden border-gray-300 bg-inherit py-2 pl-3 text-[14px] break-words break-all whitespace-pre-wrap focus:border-orange-500 focus:outline-none"
                  suppressContentEditableWarning={true}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onInput={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      questionText: e.target.innerHTML,
                    }));
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
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

              {/* Question Image Preview */}
              {imagePreview && (
                <div className="relative mt-3 inline-block max-w-[300px]">
                  <div className="flex flex-col items-start">
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-md"
                      onClick={() => setisQuestionModalOpen(true)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, image: null }));
                        setImagePreview(null);
                      }}
                      className="absolute top-4 right-4 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-black px-[2px] pt-[2px] text-xs text-white opacity-70 hover:cursor-pointer"
                    >
                      <i className="bx bx-x text-[20px]"></i>
                    </button>
                  </div>
                </div>
              )}

              <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />
              {/* Choices Section */}
              <div className="flex max-w-[850px] items-start gap-3">
                <div className="mt-[6px] flex aspect-square h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                  2
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-black">
                    Add your multiple-choice options
                  </h3>
                  <p className="max-w-[90%] text-sm text-gray-500">
                    Enter the answer options of your question and select the
                    correct answer using the radio buttons below.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4 px-3 py-2">
                {formData.choices.map((choice, index) => (
                  <div
                    key={index}
                    className="relative flex items-center space-x-2"
                  >
                    {/* Radio Button */}
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={choice.isCorrect}
                      onChange={() =>
                        handleChoiceChange(index, "isCorrect", true)
                      }
                      className="size-5 cursor-pointer accent-orange-500"
                    />

                    {/* Input Choice */}
                    {!choice.image && (
                      <input
                        type="text"
                        value={choice.choiceText}
                        placeholder={`Option ${index + 1}`}
                        onChange={(e) =>
                          handleChoiceChange(
                            index,
                            "choiceText",
                            e.target.value,
                          )
                        }
                        className={`w-[80%] rounded-none border-0 border-gray-300 p-2 text-[14px] transition-all duration-100 ${
                          choice.isFixed
                            ? "cursor-not-allowed"
                            : "hover:border-b hover:border-b-gray-500 focus:border-b-2 focus:border-b-orange-500 focus:outline-none"
                        }`}
                        onFocus={() =>
                          !choice.isFixed && setFocusedChoice(index)
                        }
                        onBlur={(e) => {
                          if (
                            !e.relatedTarget ||
                            !e.relatedTarget.classList.contains(
                              "image-upload-btn",
                            )
                          ) {
                            setFocusedChoice(null);
                          }
                        }}
                        disabled={choice.isFixed}
                        required
                      />
                    )}

                    {/* Image Upload Button */}
                    {!choice.image &&
                      focusedChoice === index &&
                      !choice.isFixed && (
                        <>
                          <button
                            onClick={() =>
                              document
                                .getElementById(`fileInput-${index}`)
                                .click()
                            }
                            className="image-upload-btn cursor-pointer rounded-md px-2 py-1 text-[24px] text-[rgb(120,120,120)] hover:text-gray-900"
                          >
                            <i className="bx bx-image-alt"></i>
                          </button>
                          <input
                            id={`fileInput-${index}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) =>
                              handleChoiceImageUpload(index, event)
                            }
                          />
                        </>
                      )}

                    {/* Choice Image Preview */}
                    {choice.image && (
                      <div className="relative mt-3">
                        <img
                          src={URL.createObjectURL(choice.image)}
                          alt={`Choice ${index + 1}`}
                          className="max-h-[150px] max-w-[150px] rounded-md object-contain shadow-md hover:cursor-pointer hover:opacity-80"
                          onClick={() => {
                            setchoiceModalImage(
                              URL.createObjectURL(choice.image),
                            );
                            setIsChoiceModalOpen(true);
                          }}
                        />
                        <button
                          onClick={() => {
                            removeChoiceImage(index);
                            setFocusedChoice(null);
                          }}
                          className="absolute top-4 right-4 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-black px-[2px] pt-[2px] text-xs text-white opacity-70 hover:cursor-pointer"
                        >
                          <i className="bx bx-x text-[20px]"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="-mx-2 mt-6 mb-3 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-4" />
              <div className="flex items-start gap-3">
                <div className="mt-[6px] flex aspect-square h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                  3
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-black">
                    Question settings
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configure the question's score, difficulty level, and
                    coverage.
                  </p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="mt-8 mb-1 flex flex-col gap-4 px-2 sm:flex-col">
                {/* Score Input */}
                <div className="relative flex w-[20%] items-center gap-2 sm:w-auto">
                  <label htmlFor="score" className="text-[14px] text-gray-700">
                    Score:
                  </label>
                  <input
                    name="score"
                    type="number"
                    min="1"
                    max="100"
                    onChange={handleQuestionChange}
                    value={formData.score}
                    className="ml-3 w-10 border-0 border-b border-gray-300 p-1 text-[14px] transition-all duration-100 outline-none focus:border-b-2 focus:border-orange-500 sm:w-[50px]"
                    required
                    onInput={(e) => {
                      const val = parseInt(e.target.value);
                      if (val < 1) e.target.value = 1;
                      if (val > 100) e.target.value = 100;
                    }}
                  />

                  {/* Boxicons Help Icon */}
                  <button
                    type="button"
                    onClick={() => setShowTip(!showTip)}
                    className="ml-2 cursor-pointer text-gray-500 hover:text-orange-500 focus:outline-none"
                  >
                    <i className="bx bx-help-circle text-[18px]"></i>
                  </button>

                  {/* Tooltip */}
                  {showTip && (
                    <div className="absolute bottom-7 left-35 z-10 w-[200px] rounded-md bg-gray-700 p-2 text-[12px] text-white shadow-md">
                      Enter a score between 1 and 100 for this question.
                    </div>
                  )}
                </div>

                {/* Difficulty Dropdown */}
                <CustomDropdown
                  label="Difficulty"
                  name="difficulty_id"
                  value={formData.difficulty_id}
                  onChange={handleQuestionChange}
                  placeholder="Select difficulty..."
                  options={[
                    { value: 1, label: "Easy" },
                    { value: 2, label: "Moderate" },
                    { value: 3, label: "Hard" },
                  ]}
                />

                {/* Coverage Dropdown */}
                <CustomDropdown
                  label="Coverage"
                  name="coverage_id"
                  value={formData.coverage_id}
                  onChange={handleQuestionChange}
                  options={[
                    { value: 1, label: "Midterms" },
                    { value: 2, label: "Finals" },
                  ]}
                />

                {/* Purpose Dropdown */}
                <CustomDropdown
                  label="Purpose"
                  name="purpose_id"
                  value={formData.purpose_id}
                  onChange={handleQuestionChange}
                  options={[
                    { value: 2, label: "Practice Question" },
                    { value: 1, label: "Qualifying Exam Question" },
                  ]}
                />

                <div className="-mx-2 mt-6 h-[0.5px] bg-[rgb(200,200,200)] sm:-mx-6" />
                <div className="flex w-full items-start justify-between">
                  {/* Left Side: Number and Text */}
                  <div className="flex items-start gap-3">
                    <div className="mt-[6px] -ml-2 flex aspect-square h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                      4
                    </div>
                    <div>
                      <h3 className="mt-[5px] text-[16px] font-semibold text-black sm:mt-0">
                        Save Question
                      </h3>
                      <p className="hidden text-sm text-gray-500 sm:block">
                        Proceed to save your question, or cancel to exit without
                        saving.
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Buttons */}
                  <div className="flex gap-2 text-[14px] sm:mt-2">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="border-color mt-1 cursor-pointer rounded-md border px-4 py-1 text-gray-700 hover:bg-gray-200"
                    >
                      <span className="text-[14px]">Cancel</span>
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className={`mt-1 flex cursor-pointer items-center justify-center gap-[5px] rounded-md px-5 py-[6px] text-white ${
                        isLoading
                          ? "cursor-not-allowed bg-orange-300"
                          : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <span className="loader-white"></span>
                        </div>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Image Modal */}
      {isQuestionModalOpen && imagePreview && (
        <div
          className="bg-opacity-70 lightbox-bg fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setisQuestionModalOpen(false)}
        >
          <div className="relative">
            <img
              src={imagePreview}
              alt="Full View"
              className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
            />
          </div>
        </div>
      )}

      {/* Choice Image Modal */}
      {isChoiceModalOpen && (
        <div
          className="bg-opacity-70 lightbox-bg fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setIsChoiceModalOpen(false)}
        >
          <div className="relative">
            <img
              src={choiceModalImage}
              alt="Full View"
              className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
            />
          </div>
        </div>
      )}

      {/* Toast notification */}
      <div className="fixed top-4 right-4 z-[99999]">
        <Toast message={toast.message} type={toast.type} show={toast.show} />
      </div>
    </>
  );
};

export default CombinedQuestionForm;
