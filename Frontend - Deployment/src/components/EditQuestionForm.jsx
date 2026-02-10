import React, { useState, useRef, useEffect } from "react";
import CustomDropdown from "./customDropdown";
import WarnOnExit from "../hooks/WarnOnExit";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

// Edit Question Form
const EditQuestionForm = ({
  question,
  onComplete,
  onCancel,
  isExamQuestionsEnabled: propIsExamQuestionsEnabled,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [showTip, setShowTip] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(question.image || null);
  const [focusedChoice, setFocusedChoice] = useState(null);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [animatingChoice, setAnimatingChoice] = useState(null);

  // Prevent background scrolling when Edit Question Form modal is open
  useEffect(() => {
    // The modal is always open when this component is rendered
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, []);

  // Replace formData state with separate form and choices states
  const [form, setForm] = useState({
    coverage_id: question.coverage_id,
    questionText: question.questionText,
    image: null,
    remove_image: false,
    score: question.score,
    difficulty_id: question.difficulty_id,
    status_id: question.status_id,
    purpose_id: question.purpose_id,
  });

  const [choices, setChoices] = useState(
    question.choices
      .filter((choice) => choice.position <= 4) // Only get first 4 choices, excluding "None of the above"
      .sort((a, b) => a.position - b.position) // Sort by position
      .map((choice) => ({
        choiceID: choice.choiceID,
        choiceText: choice.choiceText,
        isCorrect: choice.isCorrect,
        image: choice.image || null,
        position: choice.position,
      }))
      .concat([
        {
          choiceID: question.choices.find((c) => c.position === 5)?.choiceID,
          choiceText: "None of the above",
          isCorrect:
            question.choices.find((c) => c.position === 5)?.isCorrect || false,
          image: null,
          position: 5,
          isFixed: true,
        },
      ]),
  );

  // Set initial editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = question.questionText;
    }
  }, [question.questionText]);

  WarnOnExit({ ...form, choices });

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

  // Update handleQuestionChange
  const handleQuestionChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file, remove_image: false }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Add function to handle image removal
  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: null, remove_image: true }));
    setImagePreview(null);
  };

  // Update handleChoiceChange
  const handleChoiceChange = (index, field, value) => {
    const updated = [...choices];
    if (field === "isCorrect") {
      // When setting a choice as correct, ensure all others are false
      updated.forEach((choice, i) => {
        if (i !== index) choice.isCorrect = false;
      });
      updated[index].isCorrect = value;
    } else if (field === "choiceText") {
      // When updating text, clear the image
      updated[index] = {
        ...updated[index],
        [field]: value,
        image: null, // Clear the image when text is entered
        position: index + 1, // Maintain position
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
        position: index + 1, // Maintain position
      };
    }
    setChoices(updated);
  };

  // Update handleChoiceImageUpload
  const handleChoiceImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const updated = [...choices];
      updated[index] = {
        ...updated[index],
        image: file,
        choiceText: "",
        position: index + 1, // Maintain position
      };
      setChoices(updated);
    }
  };

  // Update removeChoiceImage
  const removeChoiceImage = (index) => {
    const updated = [...choices];
    updated[index] = {
      ...updated[index],
      image: null,
      choiceText: "",
      isCorrect: updated[index].isCorrect,
      choiceID: updated[index].choiceID,
      position: index + 1, // Maintain position
    };
    setChoices(updated);
  };

  // Update handleSubmit
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
    if (choices.length !== 5) {
      setError("Exactly 5 choices are required.");
      showToast("Exactly 5 choices are required.", "error");
      return;
    }

    if (
      !choices.every((choice) => {
        // If there's an image (either File object or URL string), it's valid
        if (choice.image) return true;
        // Otherwise, check if there's non-empty text
        return choice.choiceText && choice.choiceText.trim() !== "";
      })
    ) {
      setError("Each choice must have either text or an image.");
      showToast("Each choice must have either text or an image.", "error");
      return;
    }

    // Check if exam questions are enabled for qualifying exam questions
    if (form.purpose_id === 1 && !propIsExamQuestionsEnabled) {
      setError(
        "Adding of qualifying exam questions is currently disabled by the Dean",
      );
      showToast(
        "Adding of qualifying exam questions is currently disabled by the Dean",
        "error",
      );
      return;
    }

    // Check if any choice is correct
    const hasCorrectChoice = choices.some((choice) => choice.isCorrect);
    if (!hasCorrectChoice) {
      // If no choice is correct, we'll let the backend handle setting "None of the above" as correct
      // Just ensure all choices are marked as incorrect
      const updatedChoices = choices.map((choice) => ({
        ...choice,
        isCorrect: false,
      }));
      setChoices(updatedChoices);
    }

    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      // Prepare question data
      const questionData = new FormData();
      // Add question text from editor
      questionData.append("questionText", formattedQuestionText);

      // Add all other form fields
      Object.entries(form).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          if (key === "remove_image") {
            questionData.append(key, val ? "1" : "0");
          } else {
            questionData.append(key, val);
          }
        }
      });

      // Update question
      const questionResponse = await fetch(
        `${apiUrl}/questions/update/${question.questionID}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: questionData,
        },
      );

      if (!questionResponse.ok) {
        const errorData = await questionResponse.json();
        throw new Error(errorData.message || "Failed to update question.");
      }

      // Update choices
      const choicesData = new FormData();
      choicesData.append("questionID", question.questionID);

      // Only send the first 5 choices, sorted by position
      const sortedChoices = [...choices].sort(
        (a, b) => a.position - b.position,
      );

      sortedChoices.forEach((choice, i) => {
        // Only include necessary fields
        if (choice.choiceID) {
          choicesData.append(`choices[${i}][choiceID]`, choice.choiceID);
        }
        if (choice.choiceText) {
          choicesData.append(`choices[${i}][choiceText]`, choice.choiceText);
        }
        choicesData.append(
          `choices[${i}][isCorrect]`,
          choice.isCorrect ? "1" : "0",
        );
        if (choice.image instanceof File) {
          choicesData.append(`choices[${i}][image]`, choice.image);
        } else if (choice.image) {
          choicesData.append(`choices[${i}][image]`, choice.image);
        }
      });

      const choicesResponse = await fetch(`${apiUrl}/choices/update`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: choicesData,
      });

      if (!choicesResponse.ok) {
        throw new Error("Failed to update choices.");
      }

      showToast("Question updated successfully!", "success");
      onComplete();
    } catch (err) {
      console.error("Error updating:", err);
      setError(
        err.message || "Something went wrong while updating the question.",
      );
      showToast(
        err.message || "Something went wrong while updating the question.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check if editor is empty
  const isEditorEmpty = () => {
    if (!editorRef.current) return true;
    const content =
      editorRef.current.textContent || editorRef.current.innerText || "";
    return content.trim() === "";
  };

  return (
    <>
      <div className="open-sans lightbox-bg fixed inset-0 z-105 flex items-center justify-center overflow-y-auto">
        <div className="scrollbar-hide animate-fade-in-up flex h-[100%] overflow-y-auto sm:h-[99%]">
          <div className="flex-1">
            {/* Header */}
            <div className="border-color relative mx-auto max-w-5xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-800 shadow-lg sm:rounded-t-md md:w-[110vh] lg:w-[135vh]">
              <div className="flex items-center justify-between pr-4">
                <span className="text-[14px] font-semibold">EDIT QUESTION</span>
                <button
                  onClick={onCancel}
                  className="-mr-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-500 transition duration-100 hover:bg-gray-100 hover:text-gray-700"
                >
                  <i className="bx bx-x text-2xl"></i>
                </button>
              </div>
            </div>
            {/* Question Card */}
            <div className="border-color relative mx-auto mb-3 w-full max-w-5xl border border-t-0 bg-white p-5 shadow-lg sm:rounded-b-md sm:px-5 md:w-[110vh] lg:w-[135vh]">
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <div className="mt-[6px] flex aspect-square h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                  1
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-black">
                    Write your question
                  </h3>
                  <p className="text-[12px] text-gray-500">
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

                {!isFocused && isEditorEmpty() && (
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
                    setForm((prev) => ({
                      ...prev,
                      questionText: e.target.innerHTML,
                    }));
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                ></div>
              </div>

              {/* Text Formatting Options */}
              <div className="mt-3 ml-5 flex gap-5 text-[24px] text-[rgb(120,120,120)] sm:gap-6">
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
                <div className="relative mt-3 ml-5 inline-block max-w-[300px]">
                  <div className="flex flex-col items-start">
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-md hover:opacity-80"
                      onClick={() => setisQuestionModalOpen(true)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, image: null }));
                        setImagePreview(null);
                      }}
                      className="absolute top-4 right-4 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-black text-white opacity-70 hover:cursor-pointer"
                    >
                      <i className="bx bx-x text-[16px] leading-none"></i>
                    </button>
                  </div>
                </div>
              )}

              <div className="mx-1 mt-3 mb-5 h-[0.5px] bg-gray-300" />

              {/* Choices Section */}
              <div className="flex max-w-[850px] items-start gap-3">
                <div className="mt-[6px] flex aspect-square h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                  2
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-black">
                    Add your multiple-choice options
                  </h3>
                  <p className="max-w-[90%] text-[12px] text-gray-500">
                    Enter the answer options of your question and select the
                    correct answer by pressing the circle buttons below.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4 px-3 py-2">
                {choices.map((choice, index) => (
                  <div
                    key={index}
                    className="relative flex items-center space-x-2"
                  >
                    {/* Boxicon for correct answer selection */}
                    <i
                      className={`bx ${choice.isCorrect ? "bxs-check-circle text-orange-500" : "bx-circle text-gray-300"} cursor-pointer text-[24px] transition-all duration-300 ease-in-out hover:scale-110 ${
                        choice.isCorrect ? "animate-correct-pulse" : ""
                      } ${
                        animatingChoice === index
                          ? "animate-correct-select"
                          : ""
                      }`}
                      style={{ minWidth: 22 }}
                      title={
                        choice.isCorrect ? "Correct answer" : "Mark as correct"
                      }
                      onClick={() => {
                        // Trigger animation
                        setAnimatingChoice(index);
                        setTimeout(() => {
                          setAnimatingChoice(null);
                        }, 300);

                        handleChoiceChange(index, "isCorrect", true);
                      }}
                      data-choice-index={index}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleChoiceChange(index, "isCorrect", true);
                      }}
                      role="button"
                      aria-label={
                        choice.isCorrect ? "Correct answer" : "Mark as correct"
                      }
                    ></i>
                    {/* Input Choice */}
                    {!choice.image && (
                      <div
                        className={`relative ml-2 w-[80%] rounded-sm bg-gray-50 p-1 transition-all duration-150 hover:bg-gray-100 ${
                          focusedChoice === index ? "bg-gray-200" : ""
                        }`}
                        onClick={() => {
                          if (!choice.isFixed) setFocusedChoice(index);
                        }}
                      >
                        <div
                          className={`absolute top-1/2 left-0 rounded-l-sm bg-orange-500 transition-all duration-200 ${
                            focusedChoice === index
                              ? "animate-expand-border h-full"
                              : "h-0"
                          }`}
                          style={{
                            width: "4px",
                            transform: "translateY(-50%)",
                          }}
                        ></div>
                        {/* Only show custom placeholder if not focused and empty */}
                        {focusedChoice !== index &&
                          choice.choiceText === "" && (
                            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[14px] text-gray-400">
                              {`Option ${index + 1}`}
                            </span>
                          )}
                        <input
                          type="text"
                          value={choice.choiceText}
                          onChange={(e) =>
                            handleChoiceChange(
                              index,
                              "choiceText",
                              e.target.value,
                            )
                          }
                          className={`min-h-[40px] w-full max-w-full resize-none overflow-hidden border-none bg-inherit py-[6px] pl-3 text-[14px] break-words break-all whitespace-pre-wrap focus:outline-none ${
                            choice.isFixed ? "cursor-not-allowed" : ""
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
                      </div>
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
                          className={`max-h-[300px] max-w-[300px] rounded-md object-contain shadow-lg hover:cursor-pointer hover:opacity-80 ${choice.isCorrect ? "border-2 border-orange-500" : ""}`}
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
                          className="absolute top-4 right-4 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-black text-white opacity-70 hover:cursor-pointer"
                        >
                          <i className="bx bx-x text-[16px] leading-none"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mx-1 mt-3 mb-5 h-[0.5px] bg-gray-300" />

              <div className="flex items-start gap-3">
                <div className="mt-[6px] flex aspect-square h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                  3
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-black">
                    Question Settings
                  </h3>
                  <p className="text-[12px] text-gray-500">
                    Configure the question's score, difficulty level, and
                    coverage.
                  </p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="mt-8 mb-1 ml-3 flex flex-col gap-4 px-2 sm:flex-col">
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
                    value={form.score}
                    className="ml-[60px] w-40 border-0 border-b border-gray-300 px-3 py-1 text-[14px] transition-all duration-100 outline-none focus:border-b-2 focus:border-orange-500"
                    required
                    onInput={(e) => {
                      const val = parseInt(e.target.value);
                      if (val < 1) e.target.value = 1;
                      if (val > 100) e.target.value = 100;
                    }}
                  />
                </div>

                {/* Difficulty Dropdown */}
                <CustomDropdown
                  label="Difficulty"
                  name="difficulty_id"
                  value={form.difficulty_id}
                  onChange={handleQuestionChange}
                  placeholder="Select difficulty..."
                  options={[
                    { value: 1, label: "Easy" },
                    { value: 2, label: "Moderate" },
                    { value: 3, label: "Hard" },
                  ]}
                  classname="ml-10"
                />

                {/* Coverage Dropdown */}
                <CustomDropdown
                  label="Coverage"
                  name="coverage_id"
                  value={form.coverage_id}
                  onChange={handleQuestionChange}
                  options={[
                    { value: 1, label: "Midterms" },
                    { value: 2, label: "Finals" },
                  ]}
                  classname="ml-[38px]"
                />

                {/* Purpose Dropdown */}
                <CustomDropdown
                  label="Purpose"
                  name="purpose_id"
                  value={form.purpose_id}
                  onChange={handleQuestionChange}
                  options={[
                    { value: 2, label: "Practice " },
                    { value: 1, label: "Qualifying Exam " },
                  ]}
                  classname="ml-[45px]"
                />
              </div>

              <div className="mx-1 mt-5 mb-5 h-[0.5px] bg-gray-300" />

              <div className="flex w-full items-start justify-between">
                {/* Left Side: Number and Text */}
                <div className="flex items-start gap-3 px-2">
                  <div className="mt-[6px] -ml-2 flex aspect-square h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-sm">
                    4
                  </div>
                  <div>
                    <h3 className="mt-[7px] text-[14px] font-semibold text-black sm:-mt-0">
                      Save Question
                    </h3>
                    <p className="hidden text-[12px] text-gray-500 sm:block">
                      Proceed to save your question, or cancel to exit without
                      saving.
                    </p>
                  </div>
                </div>

                {/* Right Side: Buttons */}
                <div className="flex gap-2 px-2 text-[14px]">
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
                      "Update"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Image Modal */}
      {isQuestionModalOpen && imagePreview && (
        <div
          className="bg-opacity-70 lightbox-bg-image fixed inset-0 z-[9999] flex items-center justify-center"
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
          className="bg-opacity-70 lightbox-bg-image fixed inset-0 z-[9999] flex items-center justify-center"
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

export default EditQuestionForm;
