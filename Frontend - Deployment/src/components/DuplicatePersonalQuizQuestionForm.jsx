import React, { useState, useRef, useEffect } from "react";
import CustomDropdown from "./customDropdown";
import WarnOnExit from "../hooks/WarnOnExit";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

const DuplicatePersonalQuizQuestionForm = ({
  quizQuestion,
  quiz,
  onComplete,
  onCancel,
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
  const [focusedChoice, setFocusedChoice] = useState(null);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [animatingChoice, setAnimatingChoice] = useState(null);

  // Helper function to construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    let cleanPath = imagePath;
    if (imagePath.startsWith("/storage/")) {
      cleanPath = imagePath.substring("/storage/".length);
    } else if (imagePath.startsWith("storage/")) {
      cleanPath = imagePath.substring("storage/".length);
    }
    if (!cleanPath.includes("question_images/") && !cleanPath.includes("choices/")) {
      return null;
    }
    const baseUrl = apiUrl.replace("/api", "");
    return `${baseUrl}/storage/${cleanPath}`;
  };

  // Helper function to strip HTML tags from text
  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Get initial question text
  const initialQuestionText = 
    quizQuestion.personalQuizQuestionText || 
    quizQuestion.questionText || 
    "";
  
  // Initialize image preview
  const initialImagePath = quizQuestion.personalQuizImage || quizQuestion.image || null;
  const [imagePreview, setImagePreview] = useState(initialImagePath);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, []);

  // Get initial choices
  const getInitialChoices = () => {
    const choices = quizQuestion.personalQuizChoices || 
                    quizQuestion.choices || 
                    [];
    
    const sortedChoices = choices
      .filter((choice) => choice.position !== undefined && choice.position <= 5)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const result = [];
    for (let i = 0; i < 5; i++) {
      const existingChoice = sortedChoices.find((c) => c.position === i + 1);
      if (existingChoice) {
        const isCorrect = existingChoice.personalQuizIsCorrect !== undefined 
          ? (existingChoice.personalQuizIsCorrect === true || existingChoice.personalQuizIsCorrect === 1 || existingChoice.personalQuizIsCorrect === "1")
          : (existingChoice.isCorrect === true || existingChoice.isCorrect === 1 || existingChoice.isCorrect === "1");
        
        const rawChoiceText = existingChoice.personalQuizChoiceText || existingChoice.choiceText || "";
        const displayChoiceText = stripHtml(rawChoiceText);
        
        result.push({
          choiceText: displayChoiceText,
          isCorrect: isCorrect,
          image: existingChoice.personalQuizImage || existingChoice.image || null,
          position: i + 1,
          isFixed: i === 4,
        });
      } else {
        result.push({
          choiceText: i === 4 ? "None of the above" : "",
          isCorrect: false,
          image: null,
          position: i + 1,
          isFixed: i === 4,
        });
      }
    }
    return result;
  };

  // Form state
  const [form, setForm] = useState({
    coverage_id: quizQuestion.personalQuizCoverageId || 
                 (quizQuestion.personalQuizCoverage?.id) || 
                 null,
    questionText: initialQuestionText,
    image: initialImagePath, // Preserve original image path
    remove_image: false,
    score: quizQuestion.personalQuizScore || quizQuestion.score || 1,
  });

  const [choices, setChoices] = useState(getInitialChoices());

  // Fetch choices if not available
  useEffect(() => {
    const fetchChoices = async () => {
      if (quizQuestion.personalQuizChoices && quizQuestion.personalQuizChoices.length > 0) {
        return;
      }

      const personalQuizQuestionID = 
        quizQuestion.personalQuizQuestionID || 
        quizQuestion.id;

      if (!personalQuizQuestionID) {
        return;
      }

      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const choicesResponse = await fetch(
          `${apiUrl}/personal-quiz-choices/${personalQuizQuestionID}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (choicesResponse.ok) {
          const choicesData = await choicesResponse.json();
          if (
            choicesData.success &&
            choicesData.choices &&
            choicesData.choices.length > 0
          ) {
            const fetchedChoices = choicesData.choices
              .filter((choice) => choice.position <= 5)
              .sort((a, b) => a.position - b.position);

            const result = [];
            for (let i = 0; i < 5; i++) {
              const existingChoice = fetchedChoices.find((c) => c.position === i + 1);
              if (existingChoice) {
                const isCorrect = existingChoice.personalQuizIsCorrect !== undefined 
                  ? (existingChoice.personalQuizIsCorrect === true || existingChoice.personalQuizIsCorrect === 1 || existingChoice.personalQuizIsCorrect === "1")
                  : (existingChoice.isCorrect === true || existingChoice.isCorrect === 1 || existingChoice.isCorrect === "1");
                
                const rawChoiceText = existingChoice.personalQuizChoiceText || existingChoice.choiceText || "";
                const displayChoiceText = stripHtml(rawChoiceText);
                
                result.push({
                  choiceText: displayChoiceText,
                  isCorrect: isCorrect,
                  image: existingChoice.personalQuizImage || existingChoice.image || null,
                  position: i + 1,
                  isFixed: i === 4,
                });
              } else {
                result.push({
                  choiceText: i === 4 ? "None of the above" : "",
                  isCorrect: false,
                  image: null,
                  position: i + 1,
                  isFixed: i === 4,
                });
              }
            }
            setChoices(result);
          }
        }
      } catch (error) {
        console.error("Error fetching choices:", error);
      }
    };

    fetchChoices();
  }, [quizQuestion.personalQuizQuestionID, apiUrl]);

  // Set initial editor content
  useEffect(() => {
    if (editorRef.current) {
      const text = quizQuestion.personalQuizQuestionText || 
                   quizQuestion.questionText || 
                   "";
      if (text) {
        editorRef.current.innerHTML = text;
        setForm((prev) => ({ ...prev, questionText: text }));
      }
    }
  }, [quizQuestion.personalQuizQuestionText, quizQuestion.questionText]);

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

  // Handle question change
  const handleQuestionChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files && files[0]) {
      const file = files[0];
      setForm((prev) => ({
        ...prev,
        image: file,
        remove_image: false,
      }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      image: null,
      remove_image: true,
    }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle choice change
  const handleChoiceChange = (index, field, value) => {
    const updated = [...choices];
    if (field === "isCorrect") {
      updated.forEach((choice, i) => {
        if (i !== index) choice.isCorrect = false;
      });
      updated[index].isCorrect = value;
    } else if (field === "choiceText") {
      updated[index] = {
        ...updated[index],
        [field]: value,
        image: null,
        position: index + 1,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
        position: index + 1,
      };
    }
    setChoices(updated);
  };

  // Handle choice image upload
  const handleChoiceImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const updated = [...choices];
      updated[index] = {
        ...updated[index],
        image: file,
        choiceText: "",
        position: index + 1,
      };
      setChoices(updated);
    }
  };

  // Remove choice image
  const removeChoiceImage = (index) => {
    const updated = [...choices];
    updated[index] = {
      ...updated[index],
      image: null,
      choiceText: "",
      isCorrect: updated[index].isCorrect,
      position: index + 1,
    };
    setChoices(updated);
  };

  // Handle submit
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
        if (choice.image) return true;
        return choice.choiceText && choice.choiceText.trim() !== "";
      })
    ) {
      setError("Each choice must have either text or an image.");
      showToast("Each choice must have either text or an image.", "error");
      return;
    }

    // Check if any choice is correct (including "None of the above")
    const hasCorrectChoice = choices.some((choice) => choice.isCorrect);
    if (!hasCorrectChoice) {
      setError("At least one choice must be marked as correct.");
      showToast("At least one choice must be marked as correct.", "error");
      return;
    }

    // Validate coverage for subject-based quizzes
    const isSubjectBased = quiz?.quiz_type_id === 1;
    if (isSubjectBased && !form.coverage_id) {
      setError("Coverage is required for subject-based quizzes.");
      showToast("Coverage is required for subject-based quizzes.", "error");
      return;
    }

    setIsLoading(true);
    const token = sessionStorage.getItem("token");

    try {
      const personalQuizQuestionID = 
        quizQuestion.personalQuizQuestionID || 
        quizQuestion.id;

      if (!personalQuizQuestionID) {
        throw new Error("Unable to determine question ID for duplication.");
      }

      const targetPersonalQuizID = 
        quiz.personalQuizID || 
        quiz.id || 
        quiz.quizID || 
        quiz.personalQuizId;

      if (!targetPersonalQuizID) {
        throw new Error("Unable to determine target quiz ID.");
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("targetPersonalQuizID", targetPersonalQuizID);
      formData.append("questionText", formattedQuestionText);

      // Add all other form fields
      Object.entries(form).forEach(([key, val]) => {
        if (key === "remove_image") {
          formData.append(key, val ? "1" : "0");
        } else if (key === "image") {
          if (val instanceof File) {
            formData.append(key, val);
          } else if (form.remove_image) {
            formData.append(key, "");
          } else if (val) {
            // If it's a string (existing image path), send it
            formData.append(key, val);
          }
          // If val is null and remove_image is false, don't send image field
          // Backend will copy the original image
        } else if (val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });

      // Add choices (only first 4, backend handles position 5)
      // If "None of the above" is selected, ensure all first 4 are false
      const choicesToSend = choices.filter((choice, index) => index < 4);
      const isNoneOfAboveSelected = choices[4]?.isCorrect === true;
      
      choicesToSend.forEach((choice, index) => {
        if (choice.choiceText) {
          formData.append(`choices[${index}][choiceText]`, choice.choiceText);
        }
        // If "None of the above" is selected, all first 4 must be false
        const isCorrectValue = isNoneOfAboveSelected ? false : choice.isCorrect;
        formData.append(
          `choices[${index}][isCorrect]`,
          isCorrectValue ? "1" : "0",
        );
        if (choice.image instanceof File) {
          formData.append(`choices[${index}][image]`, choice.image);
        } else if (choice.image === null) {
          formData.append(`choices[${index}][image]`, "");
        } else if (choice.image) {
          formData.append(`choices[${index}][image]`, choice.image);
        }
      });

      // Make API call to duplicate endpoint
      const response = await fetch(
        `${apiUrl}/personal-quiz-questions/${personalQuizQuestionID}/duplicate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to duplicate question.");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to duplicate question.");
      }

      showToast("Question duplicated successfully!", "success");
      onComplete();
    } catch (err) {
      console.error("Error duplicating:", err);
      setError(
        err.message || "Something went wrong while duplicating the question.",
      );
      showToast(
        err.message || "Something went wrong while duplicating the question.",
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

  const isSubjectBased = quiz?.quiz_type_id === 1;

  return (
    <>
      <div className="outfit lightbox-bg fixed inset-0 z-105 flex items-center justify-center overflow-y-auto">
        <div className="scrollbar-hide animate-fade-in-up flex h-[100%] overflow-y-auto sm:h-[99%]">
          <div className="flex-1">
            {/* Header */}
            <div className="border-color relative mx-auto max-w-5xl border bg-white px-4 py-2 text-[14px] font-medium text-gray-800 shadow-lg sm:rounded-t-md md:w-[110vh] lg:w-[135vh]">
              <div className="flex items-center justify-between pr-4">
                <span className="text-[14px] font-semibold">
                  COPY A QUESTION
                </span>
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
                      src={
                        typeof imagePreview === "string" && imagePreview.startsWith("blob:")
                          ? imagePreview
                          : typeof imagePreview === "string"
                          ? getImageUrl(imagePreview)
                          : URL.createObjectURL(imagePreview)
                      }
                      alt="Uploaded"
                      className="h-auto max-w-full cursor-pointer rounded-sm object-contain shadow-md hover:opacity-80"
                      onClick={() => setisQuestionModalOpen(true)}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
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
                        // Allow "None of the above" to be selected as correct answer
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
                        if (e.key === "Enter" || e.key === " ") {
                          handleChoiceChange(index, "isCorrect", true);
                        }
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
                          src={
                            typeof choice.image === "string"
                              ? getImageUrl(choice.image)
                              : URL.createObjectURL(choice.image)
                          }
                          alt={`Choice ${index + 1}`}
                          className={`max-h-[300px] max-w-[300px] rounded-md object-contain shadow-lg hover:cursor-pointer hover:opacity-80 ${
                            choice.isCorrect ? "border-2 border-orange-500" : ""
                          }`}
                          onClick={() => {
                            setchoiceModalImage(
                              typeof choice.image === "string"
                                ? getImageUrl(choice.image)
                                : URL.createObjectURL(choice.image),
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
                    Configure the question's score and coverage.
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

                {/* Coverage Dropdown - only show for subject-based quizzes */}
                {isSubjectBased && (
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
                )}
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
                      Copy Question
                    </h3>
                    <p className="hidden text-[12px] text-gray-500 sm:block">
                      Proceed to copy your question, or cancel to exit without
                      copying.
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
                      "Copy"
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
              src={
                typeof imagePreview === "string" && imagePreview.startsWith("blob:")
                  ? imagePreview
                  : typeof imagePreview === "string"
                  ? getImageUrl(imagePreview)
                  : URL.createObjectURL(imagePreview)
              }
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

export default DuplicatePersonalQuizQuestionForm;
