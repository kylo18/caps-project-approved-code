import React, { useState, useRef, useEffect } from "react";
import WarnOnExit from "../hooks/WarnOnExit";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import ImageSelectionModal from "./ImageSelectionModal";
import { getApiBaseUrl } from "../utils/config";

// Compact Header Dropdown Component
const HeaderDropdown = ({
  name,
  value,
  onChange,
  options,
  show = true,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!show) return null;

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="outfit-400 flex items-center gap-2">
      {label && <span className="text-[14px] text-gray-700">{label}</span>}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="mr-3 flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-1 text-[14px] transition-all duration-100 outline-none focus:border focus:border-orange-500"
        >
          <span className="flex-1 text-center">
            {selectedOption?.label || options[0]?.label}
          </span>
          <i
            className={`bx text-sm ${isOpen ? "bx-caret-up" : "bx-caret-down"}`}
          />
        </button>

        {isOpen && (
          <ul className="absolute top-full right-0 z-50 mt-1 mr-3 w-40 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange({ target: { name, value: option.value } });
                  setIsOpen(false);
                }}
                className={`cursor-pointer rounded-sm px-3 py-2 text-[14px] transition hover:bg-gray-100 ${
                  value === option.value
                    ? "bg-gray-50 text-orange-500"
                    : "text-gray-700"
                }`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Combined Question Form for both Practice and Exam Questions
const CombinedQuestionForm = ({
  subjectID,
  onComplete,
  onCancel,
  activeTab,
  isExamQuestionsEnabled: propIsExamQuestionsEnabled,
  mode = "subject", // "subject" (default) or "quiz"
  personalQuizID = null,
  quizTypeId = null, // 1 = subject-based, 2 = custom
}) => {
  const apiUrl = getApiBaseUrl();
  const { toast, showToast } = useToast();
  const [showTip, setShowTip] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [focusedChoice, setFocusedChoice] = useState(null);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const choiceEditors = useRef({});
  const [isExamQuestionsLoading, setIsExamQuestionsLoading] = useState(false);
  const [animatingChoice, setAnimatingChoice] = useState(null);
  const [isImageSelectionModalOpen, setIsImageSelectionModalOpen] =
    useState(false);
  const [imageSelectionType, setImageSelectionType] = useState(null); // "question" or choice index number
  const [choiceImagePreviews, setChoiceImagePreviews] = useState({}); // Store preview URLs for choice images

  // Prevent background scrolling when Add Question Form modal is open
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

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      Object.values(choiceImagePreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreview, choiceImagePreviews]);

  // Fetch the state on mount or when subjectID changes
  useEffect(() => {
    const fetchExamQuestionsEnabled = async () => {
      if (!subjectID) return;
      setIsExamQuestionsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/subjects/${subjectID}`);
        if (response.ok) {
          const result = await response.json();
        } else {
        }
      } catch (error) {
      } finally {
        setIsExamQuestionsLoading(false);
      }
    };
    fetchExamQuestionsEnabled();
  }, [subjectID, apiUrl]);

  // State for question and choices
  const [formData, setFormData] = useState({
    subjectID,
    coverage_id: 1, // Default to midterm coverage
    questionText: "",
    image: null,
    score: 1,
    difficulty_id: 1, // Default to easy difficulty
    status_id: 1, // 1 is pending
    // For quiz mode we don't expose purpose; keep default to practice to satisfy legacy state shape.
    purpose_id: mode === "quiz" ? 2 : activeTab === 0 ? 2 : 1,
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
      setIsStrikethrough(document.queryCommandState("strikeThrough"));
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const handleFormat = (command, setState) => {
    document.execCommand(command, false, null);
    setState(document.queryCommandState(command));
    // Ensure text stays centered after formatting
    if (editorRef.current) {
      editorRef.current.style.textAlign = "center";
    }
    editorRef.current.focus();
  };

  const checkFormatting = () => {
    setTimeout(() => {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
      setIsStrikethrough(document.queryCommandState("strikeThrough"));
    }, 10);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.addEventListener("focus", () => setIsFocused(true));
      editorRef.current.addEventListener("blur", () => setIsFocused(false));
      editorRef.current.addEventListener("mouseup", checkFormatting);
      editorRef.current.addEventListener("keyup", (e) => {
        checkFormatting();
        // Ensure text stays centered
        if (editorRef.current) {
          editorRef.current.style.textAlign = "center";
        }
      });
      // Auto-expand on mount
      autoExpandEditor(editorRef.current);
      // Ensure initial centering
      editorRef.current.style.textAlign = "center";
    }
  }, []);

  // Auto-expand editor when content changes
  useEffect(() => {
    if (editorRef.current && formData.questionText) {
      autoExpandEditor(editorRef.current);
      // Ensure any divs created are block-level, not inline
      const divs = editorRef.current.querySelectorAll("div");
      divs.forEach((div) => {
        div.style.display = "block";
      });
    }
  }, [formData.questionText]);

  // Auto-expand choice editors when content changes and sync innerHTML
  useEffect(() => {
    formData.choices.forEach((choice, index) => {
      const editor = choiceEditors.current[index];
      if (editor) {
        // Only update if content is different to avoid cursor jumping
        const currentHTML = editor.innerHTML.trim();
        const newHTML = (choice.choiceText || "").trim();

        if (currentHTML !== newHTML) {
          const selection = window.getSelection();
          const range =
            selection && selection.rangeCount > 0
              ? selection.getRangeAt(0)
              : null;
          const wasFocused = document.activeElement === editor;

          editor.innerHTML = newHTML || "";

          // Restore cursor position if it was focused
          if (
            wasFocused &&
            range &&
            (range.commonAncestorContainer === editor ||
              editor.contains(range.commonAncestorContainer))
          ) {
            try {
              selection.removeAllRanges();
              selection.addRange(range);
            } catch (e) {
              // Ignore if range is invalid
            }
          }
        }

        autoExpandTextarea(editor);
      }
    });
  }, [formData.choices]);

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

  // Handle image selected from modal
  const handleImageSelected = (file) => {
    if (imageSelectionType === "question") {
      setFormData((prev) => ({ ...prev, image: file }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setIsImageSelectionModalOpen(false);
      setImageSelectionType(null);
    } else if (typeof imageSelectionType === "number") {
      const index = imageSelectionType;

      // Revoke old preview URL if it exists
      if (choiceImagePreviews[index]) {
        URL.revokeObjectURL(choiceImagePreviews[index]);
      }

      const previewUrl = URL.createObjectURL(file);

      // Update choice: set image and clear text so only image shows
      setFormData((prev) => {
        const updatedChoices = [...prev.choices];
        updatedChoices[index] = {
          ...updatedChoices[index],
          image: file,
          choiceText: "",
        };
        return { ...prev, choices: updatedChoices };
      });

      setChoiceImagePreviews((prev) => ({
        ...prev,
        [index]: previewUrl,
      }));

      // Clear contentEditable so it doesn't hold stale text
      const editor = choiceEditors.current[index];
      if (editor && typeof editor.innerHTML !== "undefined") {
        editor.innerHTML = "";
      }

      setIsImageSelectionModalOpen(false);
      setImageSelectionType(null);
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
    const file = event.target.files?.[0];
    if (!file) return;

    if (choiceImagePreviews[index]) {
      URL.revokeObjectURL(choiceImagePreviews[index]);
    }

    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => {
      const updatedChoices = [...prev.choices];
      updatedChoices[index] = {
        ...updatedChoices[index],
        image: file,
        choiceText: "",
      };
      return { ...prev, choices: updatedChoices };
    });

    setChoiceImagePreviews((prev) => ({
      ...prev,
      [index]: previewUrl,
    }));

    const editor = choiceEditors.current[index];
    if (editor && typeof editor.innerHTML !== "undefined") {
      editor.innerHTML = "";
    }

    event.target.value = "";
  };

  const removeChoiceImage = (index) => {
    // Revoke preview URL if it exists
    if (choiceImagePreviews[index]) {
      URL.revokeObjectURL(choiceImagePreviews[index]);
      setChoiceImagePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[index];
        return newPreviews;
      });
    }

    setFormData((prev) => {
      const updatedChoices = [...prev.choices];
      updatedChoices[index] = {
        ...updatedChoices[index],
        image: null,
        // Preserve existing choiceText and isCorrect
      };
      return { ...prev, choices: updatedChoices };
    });
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

    if (mode === "quiz" && !personalQuizID) {
      setError("Quiz ID is missing. Please reopen the quiz and try again.");
      showToast(
        "Quiz ID is missing. Please reopen the quiz and try again.",
        "error",
      );
      return;
    }

    // Validate choices for both modes
    // For quiz mode, only validate first 4 choices (5th is "None of the above" added by backend)
    const choicesToValidate =
      mode === "quiz" ? formData.choices.slice(0, 4) : formData.choices;

    if (
      !choicesToValidate.every((choice) => {
        // Extract text content from HTML if it's HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = choice.choiceText || "";
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        return textContent.trim() !== "" || choice.image;
      })
    ) {
      setError("Each choice must have either text or an image.");
      showToast("Each choice must have either text or an image.", "error");
      return;
    }

    // Check if exactly one choice is correct (include all choices so "None of the above" counts)
    const correctChoices = formData.choices.filter(
      (choice) => choice.isCorrect,
    );
    if (correctChoices.length !== 1) {
      setError("Please select exactly one correct answer.");
      showToast("Please select exactly one correct answer.", "error");
      return;
    }

    if (
      mode !== "quiz" &&
      formData.purpose_id === 1 &&
      !propIsExamQuestionsEnabled
    ) {
      setError(
        "Adding of qualifying exam questions is currently disabled by the Dean",
      );
      showToast(
        "Adding of qualifying exam questions is currently disabled by the Dean",
        "error",
      );
      return;
    }

    // Directly proceed with submission
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      if (mode === "quiz") {
        // Personal/custom quiz question path
        // Step 1: Create the question
        const quizQuestionFormData = new FormData();
        quizQuestionFormData.append("personalQuizID", personalQuizID);
        quizQuestionFormData.append(
          "questionText",
          editorRef.current.innerHTML.trim(),
        );
        quizQuestionFormData.append("score", formData.score);
        // Only send coverage_id for subject-based quiz questions
        if (quizTypeId === 1 && formData.coverage_id) {
          quizQuestionFormData.append("coverage_id", formData.coverage_id);
        }

        if (formData.image) {
          quizQuestionFormData.append("image", formData.image);
        }

        const questionResponse = await fetch(
          `${apiUrl}/personal-quiz-questions`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: quizQuestionFormData,
          },
        );

        const questionData = await questionResponse.json();

        if (!questionResponse.ok) {
          throw new Error(
            questionData.message || "Failed to add quiz question.",
          );
        }

        // Step 2: Create the choices using the returned personalQuizQuestionID
        const personalQuizQuestionID =
          questionData.quizQuestion?.personalQuizQuestionID;

        if (!personalQuizQuestionID) {
          throw new Error(
            "Question was created but personalQuizQuestionID is missing.",
          );
        }

        // Prepare choices data - only send first 4 choices (backend adds 5th automatically)
        const choicesFormData = new FormData();
        choicesFormData.append(
          "personalQuizQuestionID",
          personalQuizQuestionID,
        );

        // Send only the first 4 choices (exclude "None of the above" which is 5th)
        const choicesToSend = formData.choices.slice(0, 4);

        choicesToSend.forEach((choice, index) => {
          // Append choice text (nullable)
          if (choice.choiceText && choice.choiceText.trim() !== "") {
            choicesFormData.append(
              `choices[${index}][choiceText]`,
              choice.choiceText.trim(),
            );
          } else {
            choicesFormData.append(`choices[${index}][choiceText]`, "");
          }

          // Append isCorrect (required boolean)
          choicesFormData.append(
            `choices[${index}][isCorrect]`,
            choice.isCorrect ? "true" : "false",
          );

          // Append image if it's a File
          if (choice.image instanceof File) {
            choicesFormData.append(`choices[${index}][image]`, choice.image);
          }
        });

        const choicesResponse = await fetch(`${apiUrl}/personal-quiz-choices`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: choicesFormData,
        });

        const choicesData = await choicesResponse.json();

        if (!choicesResponse.ok) {
          throw new Error(choicesData.message || "Failed to add choices.");
        }

        showToast("Question and choices added to quiz!", "success");
        onComplete(questionData.quizQuestion);
      } else {
        // Subject-based question path (existing behavior)
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
      }
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

  // Helper function to check if editor is empty
  const isEditorEmpty = () => {
    if (!editorRef.current) return true;
    const content =
      editorRef.current.textContent || editorRef.current.innerText || "";
    return content.trim() === "";
  };

  // Helper function to get text length from HTML (strips HTML tags)
  const getTextLength = (html) => {
    if (!html) return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || "").length;
  };

  // Get question character count
  const questionCharCount = getTextLength(formData.questionText);

  // Get choice character counts
  const getChoiceCharCount = (index) => {
    return getTextLength(formData.choices[index]?.choiceText || "");
  };

  // Auto-expand contentEditable element
  const autoExpandEditor = (element) => {
    if (element) {
      // Reset height to get accurate scrollHeight
      element.style.height = "auto";
      // Get the computed width to ensure proper wrapping
      const computedStyle = window.getComputedStyle(element);
      const width = element.offsetWidth || parseInt(computedStyle.width);
      // Set height based on scrollHeight, ensuring it respects container width
      element.style.height = `${Math.max(120, element.scrollHeight)}px`;
      // Force reflow to ensure proper wrapping
      element.style.maxWidth = "100%";
    }
  };

  // Auto-expand textarea
  const autoExpandTextarea = (element) => {
    if (element) {
      element.style.height = "auto";
      element.style.height = `${Math.max(40, element.scrollHeight)}px`;
    }
  };

  // Helper function to clean HTML while preserving superscript/subscript
  const cleanPastedHTML = (html) => {
    if (!html) return "";

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Remove background colors, fonts, transforms, and other unwanted styles from all elements
    const allElements = tempDiv.querySelectorAll("*");
    allElements.forEach((el) => {
      // Remove background-related styles
      el.style.backgroundColor = "";
      el.style.background = "";
      el.style.color = "";
      el.style.fontFamily = "";
      el.style.fontSize = "";
      el.style.fontWeight = "";
      el.style.fontStyle = "";
      // Remove transforms and direction that can cause upside-down text
      el.style.transform = "";
      el.style.webkitTransform = "";
      el.style.mozTransform = "";
      el.style.msTransform = "";
      el.style.direction = "";
      el.style.writingMode = "";
      el.style.textOrientation = "";
      el.style.unicodeBidi = "";
      // Remove other unwanted styles but keep superscript/subscript positioning
      const style = el.getAttribute("style");
      if (style) {
        const cleanedStyle = style
          .split(";")
          .filter((prop) => {
            const propName = prop.split(":")[0].trim().toLowerCase();
            return ![
              "background",
              "background-color",
              "color",
              "font-family",
              "font-size",
              "font-weight",
              "font-style",
              "transform",
              "webkit-transform",
              "moz-transform",
              "ms-transform",
              "direction",
              "writing-mode",
              "text-orientation",
              "unicode-bidi",
            ].includes(propName);
          })
          .join(";");
        if (cleanedStyle) {
          el.setAttribute("style", cleanedStyle);
        } else {
          el.removeAttribute("style");
        }
      }
      // Remove background and font-related attributes
      el.removeAttribute("bgcolor");
      el.removeAttribute("face");
      el.removeAttribute("size");
      el.removeAttribute("dir");
    });

    // Get cleaned HTML
    let cleanedHTML = tempDiv.innerHTML;

    // Replace line breaks with spaces (but preserve structure)
    cleanedHTML = cleanedHTML.replace(/\r?\n/g, " ").replace(/\r/g, " ");
    // Replace multiple spaces with single space (but preserve &nbsp;)
    cleanedHTML = cleanedHTML.replace(/[ \t]+/g, " ");

    return cleanedHTML;
  };

  // Get label for dropdowns
  const getDifficultyLabel = () => {
    const option = [
      { value: 1, label: "Easy" },
      { value: 2, label: "Moderate" },
      { value: 3, label: "Hard" },
    ].find((opt) => opt.value === formData.difficulty_id);
    return option?.label || "Easy";
  };

  const getCoverageLabel = () => {
    const option = [
      { value: 1, label: "Midterms" },
      { value: 2, label: "Finals" },
    ].find((opt) => opt.value === formData.coverage_id);
    return option?.label || "Midterms";
  };

  const getPurposeLabel = () => {
    const option = [
      { value: 2, label: "Practice" },
      { value: 1, label: "Qualifying Exam" },
    ].find((opt) => opt.value === formData.purpose_id);
    return option?.label || "Practice";
  };

  // Choice colors - white and gray
  const choiceColors = [
    "bg-white border border-gray-300", // White
    "bg-gray-100 border border-gray-300", // Light gray
    "bg-white border border-gray-300", // White
    "bg-gray-100 border border-gray-300", // Light gray
    "bg-white border border-gray-300", // White
  ];

  const handleCloseForm = () => {
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setIsStrikethrough(false);
    onCancel();
  };

  return (
    <>
      <div className="outfit lightbox-bg animate-slide-up fixed inset-0 z-105 flex flex-col overflow-hidden bg-gray-100">
        {/* Full Screen Header */}
        <div className="outfit-400 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
          {/* Left Side: Back arrow and Multiple Choice */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleCloseForm}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-gray-800 transition duration-100 hover:bg-gray-100 hover:text-gray-800"
            >
              <i className="bx bx-arrow-left-stroke text-2xl"></i>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-gray-800 md:text-[16px]">
                Create a Question
              </span>
            </div>
          </div>

          {/* Right Side: Difficulty, Coverage, Purpose, Save Button */}
          <div className="flex items-center gap-2">
            {/* Mobile Settings Button - Hidden on desktop and in quiz mode */}
            {mode !== "quiz" && (
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-100 md:hidden"
              >
                <i className="bx bx-cog text-[20px]"></i>
              </button>
            )}

            {/* Desktop Dropdowns - Hidden on mobile */}
            <div className="hidden items-center gap-4 md:flex">
              <HeaderDropdown
                name="difficulty_id"
                value={formData.difficulty_id}
                onChange={handleQuestionChange}
                options={[
                  { value: 1, label: "Easy" },
                  { value: 2, label: "Moderate" },
                  { value: 3, label: "Hard" },
                ]}
                show={mode !== "quiz"}
                label="Difficulty"
              />

              <HeaderDropdown
                name="coverage_id"
                value={formData.coverage_id}
                onChange={handleQuestionChange}
                options={[
                  { value: 1, label: "Midterms" },
                  { value: 2, label: "Finals" },
                ]}
                show={mode !== "quiz"}
                label="Coverage"
              />

              <HeaderDropdown
                name="purpose_id"
                value={formData.purpose_id}
                onChange={handleQuestionChange}
                options={[
                  { value: 2, label: "Practice" },
                  { value: 1, label: "Qualifying Exam" },
                ]}
                show={mode !== "quiz"}
                label="Purpose"
              />
            </div>

            {/* Save Question Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-1.5 text-[14px] font-medium text-white transition ${
                isLoading
                  ? "cursor-not-allowed bg-orange-500"
                  : "hover:bg-orange-600"
              }`}
            >
              {/* Text */}
              <span>{isLoading ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        {/* Second Header - Text Formatting */}
        <div className="flex h-12 items-center justify-between border-b border-gray-300 bg-gray-50 px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Text Formatting Buttons */}
            <div className="flex items-center gap-1 text-[20px] text-gray-600">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("bold", setIsBold);
                }}
                className={`flex size-8 cursor-pointer items-center justify-center rounded p-1 transition hover:text-gray-900 ${isBold ? "bg-gray-200 text-gray-900" : ""}`}
              >
                <i className="bx bx-bold text-[18px]"></i>
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("italic", setIsItalic);
                }}
                className={`flex size-8 cursor-pointer items-center justify-center rounded p-1 transition hover:text-gray-900 ${isItalic ? "bg-gray-200 text-gray-900" : ""}`}
              >
                <i className="bx bx-italic text-[18px]"></i>
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("underline", setIsUnderline);
                }}
                className={`flex size-8 cursor-pointer items-center justify-center rounded p-1 transition hover:text-gray-900 ${isUnderline ? "bg-gray-200 text-gray-900" : ""}`}
              >
                <i className="bx bx-underline text-[18px]"></i>
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleFormat("strikeThrough", setIsStrikethrough);
                }}
                className={`flex size-8 cursor-pointer items-center justify-center rounded p-1 transition hover:text-gray-900 ${isStrikethrough ? "bg-gray-200 text-gray-900" : ""}`}
              >
                <i className="bx bx-strikethrough text-[18px]"></i>
              </button>
            </div>

            {/* Vertical Separator */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Points Input */}
            <div className="flex items-center gap-2">
              <span className="outfit-400 text-[14px] text-gray-700">
                Point{formData.score !== 1 ? "s" : ""}
              </span>
              <input
                name="score"
                type="number"
                min="1"
                max="100"
                onChange={handleQuestionChange}
                value={formData.score}
                className="w-16 rounded-lg border border-gray-200 px-3 py-1 text-[14px] transition-all duration-100 outline-none focus:border focus:border-orange-500"
                required
                onInput={(e) => {
                  const val = parseInt(e.target.value);
                  if (val < 1) e.target.value = 1;
                  if (val > 100) e.target.value = 100;
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {/* Question Input Section  */}
            <div className="mb-3 rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex flex-col gap-4 md:flex-row">
                {/* Question Input Area */}
                <div className="min-w-0 flex-1">
                  {/* Question Editor */}
                  <div
                    className={`outfit-400 relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-lg border border-gray-200 p-15 transition-all duration-150`}
                    onClick={(e) => {
                      // Only focus if clicking directly on the container background, not on child elements
                      if (e.target === e.currentTarget) {
                        editorRef.current?.focus();
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Media Upload Icon - Inside Editor */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageSelectionType("question");
                          setIsImageSelectionModalOpen(true);
                        }}
                        className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-700 transition hover:bg-gray-200"
                        title="Add image"
                      >
                        <i className="bx bx-image-alt text-2xl"></i>
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

                    {!isFocused && isEditorEmpty() && (
                      <span className="pointer-events-none absolute -mt-25 max-w-full overflow-hidden text-[14px] whitespace-nowrap text-gray-400">
                        Type question here
                      </span>
                    )}

                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="overflow-wrap-anywhere w-full max-w-full border-none bg-transparent text-center text-[14px] break-words whitespace-pre-wrap text-gray-800 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onFocus={() => {
                        setIsFocused(true);
                        // Ensure text stays centered when typing
                        if (editorRef.current) {
                          editorRef.current.style.textAlign = "center";
                        }
                      }}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={(e) => {
                        // Allow Enter key to create new lines
                        if (e.key === "Enter" && !e.shiftKey) {
                          // Prevent default to control the behavior
                          e.preventDefault();
                          // Insert a line break
                          const selection = window.getSelection();
                          if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const br = document.createElement("br");
                            range.deleteContents();
                            range.insertNode(br);
                            // Move cursor after the br
                            range.setStartAfter(br);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);

                            // Trigger input event to update state
                            const inputEvent = new Event("input", {
                              bubbles: true,
                            });
                            if (editorRef.current) {
                              editorRef.current.dispatchEvent(inputEvent);
                            }
                          }
                          // Ensure text stays centered and expand height
                          setTimeout(() => {
                            if (editorRef.current) {
                              editorRef.current.style.textAlign = "center";
                              autoExpandEditor(editorRef.current);
                            }
                          }, 0);
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const selection = window.getSelection();
                        if (selection.rangeCount === 0) return;

                        const range = selection.getRangeAt(0);
                        const currentText =
                          editorRef.current?.textContent || "";
                        const currentLength = currentText.length;
                        const remainingChars = 1000 - currentLength;

                        if (remainingChars <= 0) return; // Already at limit

                        range.deleteContents();

                        // Try to get HTML first to preserve superscript/subscript
                        let html = e.clipboardData.getData("text/html");
                        let text = e.clipboardData.getData("text/plain");

                        if (html) {
                          // Clean HTML while preserving superscript/subscript
                          html = cleanPastedHTML(html);
                          // Create a temporary container to parse and insert the cleaned HTML
                          const tempDiv = document.createElement("div");
                          tempDiv.innerHTML = html;

                          // Normalize spaces in all text nodes
                          const normalizeTextNodes = (node) => {
                            if (node.nodeType === Node.TEXT_NODE) {
                              node.textContent = node.textContent.replace(
                                /\s+/g,
                                " ",
                              );
                            } else {
                              node.childNodes.forEach(normalizeTextNodes);
                            }
                          };
                          normalizeTextNodes(tempDiv);

                          const pastedText =
                            tempDiv.textContent || tempDiv.innerText || "";

                          // Truncate if needed
                          if (pastedText.length > remainingChars) {
                            const truncatedText = pastedText.substring(
                              0,
                              remainingChars,
                            );
                            const textNode =
                              document.createTextNode(truncatedText);
                            range.insertNode(textNode);
                          } else {
                            const fragment = document.createDocumentFragment();
                            while (tempDiv.firstChild) {
                              fragment.appendChild(tempDiv.firstChild);
                            }
                            range.insertNode(fragment);
                          }
                        } else if (text) {
                          // Fallback to plain text if no HTML
                          // Normalize all whitespace (spaces, tabs, newlines) to single space
                          text = text.replace(/\s+/g, " ").trim();
                          // Truncate if needed
                          if (text.length > remainingChars) {
                            text = text.substring(0, remainingChars);
                          }
                          const textNode = document.createTextNode(text);
                          range.insertNode(textNode);
                        }

                        // Move cursor to end of inserted content
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);

                        // Trigger input event to update state
                        if (editorRef.current) {
                          autoExpandEditor(editorRef.current);
                          setFormData((prev) => ({
                            ...prev,
                            questionText: editorRef.current.innerHTML,
                          }));
                        }
                      }}
                      onInput={(e) => {
                        const editor = e.target;
                        const textLength = getTextLength(editor.innerHTML);

                        // Enforce 1000 character limit
                        if (textLength > 1000) {
                          // Truncate to 1000 characters
                          const tempDiv = document.createElement("div");
                          tempDiv.innerHTML = editor.innerHTML;
                          let text =
                            tempDiv.textContent || tempDiv.innerText || "";
                          text = text.substring(0, 1000);
                          editor.innerHTML = text;
                        }

                        autoExpandEditor(editor);
                        setFormData((prev) => ({
                          ...prev,
                          questionText: editor.innerHTML,
                        }));
                      }}
                      style={{
                        color: "black",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        maxWidth: "100%",
                        width: "100%",
                        textAlign: "center",
                        lineHeight: "1.5em",
                        minHeight: "1.5em",
                        overflow: "hidden",
                        display: "block",
                      }}
                    ></div>
                    {/* Character Counter */}
                    <div className="absolute right-2 bottom-2 text-[12px] text-gray-500">
                      {getTextLength(formData.questionText)}/1000
                    </div>
                  </div>
                </div>

                {/* Question Image Preview - Beside Question on Desktop, Below on Mobile */}
                {imagePreview && (
                  <>
                    {/* Desktop: Beside Question */}
                    <div className="relative hidden w-[400px] flex-shrink-0 md:block">
                      <img
                        src={imagePreview}
                        alt="Question"
                        className="h-auto max-h-[300px] w-full cursor-pointer rounded-lg object-contain shadow-lg hover:opacity-90"
                        onClick={() => setisQuestionModalOpen(true)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, image: null }));
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                      >
                        <i className="bx bx-x text-sm"></i>
                      </button>
                    </div>
                    {/* Mobile: Below Question */}
                    <div className="relative mt-4 flex w-full justify-center md:hidden">
                      <div className="relative max-w-full">
                        <img
                          src={imagePreview}
                          alt="Question"
                          className="h-auto max-h-[300px] w-full cursor-pointer rounded-lg object-contain shadow-lg hover:opacity-90"
                          onClick={() => setisQuestionModalOpen(true)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, image: null }));
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                        >
                          <i className="bx bx-x text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Choices Section - Colorful Cards */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                {formData.choices.map((choice, index) => (
                  <div
                    key={index}
                    className={`outfit-400 relative rounded-lg ${choiceColors[index]} min-w-0 overflow-hidden p-5 transition-all ${
                      choice.isCorrect
                        ? "border-none ring-2 ring-orange-500 ring-offset-2"
                        : ""
                    }`}
                  >
                    {/* Top Right: Correct Answer Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnimatingChoice(index);
                        setTimeout(() => setAnimatingChoice(null), 300);
                        handleChoiceChange(index, "isCorrect", true);
                      }}
                      className="absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-200"
                      title={
                        choice.isCorrect ? "Correct answer" : "Mark as correct"
                      }
                    >
                      <span className="flex h-5 w-5 items-center justify-center">
                        {choice.isCorrect ? (
                          <i className="bx bxs-check-circle text-[24px] text-orange-600" />
                        ) : (
                          <i className="bx bx-circle text-[24px]" />
                        )}
                      </span>
                    </button>

                    {/* Top Left: Delete and Image Upload */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {!choice.isFixed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageSelectionType(index);
                            setIsImageSelectionModalOpen(true);
                          }}
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-gray-700 transition hover:bg-gray-200"
                          title={choice.image ? "Replace image" : "Add image"}
                        >
                          <i className="bx bx-image-alt text-[24px]"></i>
                        </button>
                      )}
                      <input
                        id={`fileInput-${index}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handleChoiceImageUpload(index, event)
                        }
                      />
                    </div>

                    {/* Choice Content - key forces correct branch when switching text/image */}
                    <div
                      className="mt-8"
                      key={`choice-content-${index}-${choice.image ? "img" : "txt"}`}
                    >
                      {choice.image ? (
                        // If image exists, show image only (no text)
                        <div className="flex w-full min-w-0 flex-col items-center">
                          <div className="relative w-full">
                            <img
                              src={
                                choiceImagePreviews[index] ||
                                (choice.image instanceof File
                                  ? URL.createObjectURL(choice.image)
                                  : choice.image)
                              }
                              alt={`Choice ${index + 1}`}
                              className="h-auto max-h-[200px] w-full cursor-pointer rounded object-contain hover:opacity-90"
                              onClick={() => {
                                const imageUrl =
                                  choiceImagePreviews[index] ||
                                  (choice.image instanceof File
                                    ? URL.createObjectURL(choice.image)
                                    : choice.image);
                                setchoiceModalImage(imageUrl);
                                setIsChoiceModalOpen(true);
                              }}
                            />
                            {!choice.isFixed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeChoiceImage(index);
                                }}
                                className="absolute top-1 right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                                title="Remove image"
                              >
                                <i className="bx bx-x text-xs"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        // If no image, show contentEditable input
                        <div className="relative flex min-h-[60px] w-full items-center justify-center">
                          {focusedChoice !== index && !choice.choiceText && (
                            <span className="pointer-events-none absolute top-1/2 left-1/2 -mt-2 max-w-full -translate-x-1/2 -translate-y-1/2 transform overflow-hidden text-center text-[14px] whitespace-nowrap text-gray-400">
                              Type answer option here
                            </span>
                          )}
                          <div
                            ref={(el) => {
                              if (el) choiceEditors.current[index] = el;
                            }}
                            contentEditable={!choice.isFixed}
                            suppressContentEditableWarning
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            onPaste={(e) => {
                              if (choice.isFixed) {
                                e.preventDefault();
                                return;
                              }
                              e.preventDefault();
                              const selection = window.getSelection();
                              if (selection.rangeCount === 0) return;

                              const editor = choiceEditors.current[index];
                              if (!editor) return;

                              const currentText = editor.textContent || "";
                              const currentLength = currentText.length;
                              const remainingChars = 500 - currentLength;

                              if (remainingChars <= 0) return; // Already at limit

                              const range = selection.getRangeAt(0);
                              range.deleteContents();

                              // Try to get HTML first to preserve superscript/subscript
                              let html = e.clipboardData.getData("text/html");
                              let text = e.clipboardData.getData("text/plain");

                              if (html) {
                                // Clean HTML while preserving superscript/subscript
                                html = cleanPastedHTML(html);
                                const tempDiv = document.createElement("div");
                                tempDiv.innerHTML = html;
                                // Ensure no transforms or direction issues
                                tempDiv.style.direction = "ltr";
                                tempDiv.style.transform = "none";
                                tempDiv.style.writingMode = "horizontal-tb";

                                // Normalize spaces in all text nodes
                                const normalizeTextNodes = (node) => {
                                  if (node.nodeType === Node.TEXT_NODE) {
                                    node.textContent = node.textContent.replace(
                                      /\s+/g,
                                      " ",
                                    );
                                  } else {
                                    // Ensure no problematic styles on elements
                                    if (node.nodeType === Node.ELEMENT_NODE) {
                                      node.style.direction = "ltr";
                                      node.style.transform = "none";
                                      node.style.writingMode = "horizontal-tb";
                                    }
                                    node.childNodes.forEach(normalizeTextNodes);
                                  }
                                };
                                normalizeTextNodes(tempDiv);

                                const pastedText =
                                  tempDiv.textContent ||
                                  tempDiv.innerText ||
                                  "";

                                // Truncate if needed
                                if (pastedText.length > remainingChars) {
                                  const truncatedText = pastedText.substring(
                                    0,
                                    remainingChars,
                                  );
                                  const textNode =
                                    document.createTextNode(truncatedText);
                                  range.insertNode(textNode);
                                } else {
                                  const fragment =
                                    document.createDocumentFragment();
                                  while (tempDiv.firstChild) {
                                    fragment.appendChild(tempDiv.firstChild);
                                  }
                                  range.insertNode(fragment);
                                }
                              } else if (text) {
                                // Fallback to plain text if no HTML
                                // Normalize all whitespace (spaces, tabs, newlines) to single space
                                text = text.replace(/\s+/g, " ").trim();
                                // Truncate if needed
                                if (text.length > remainingChars) {
                                  text = text.substring(0, remainingChars);
                                }
                                const textNode = document.createTextNode(text);
                                range.insertNode(textNode);
                              }

                              range.collapse(false);
                              selection.removeAllRanges();
                              selection.addRange(range);

                              if (choiceEditors.current[index]) {
                                autoExpandTextarea(
                                  choiceEditors.current[index],
                                );
                                handleChoiceChange(
                                  index,
                                  "choiceText",
                                  choiceEditors.current[index].innerHTML,
                                );
                              }
                            }}
                            onInput={(e) => {
                              if (choice.isFixed) return;
                              const editor = e.target;
                              const textLength = getTextLength(
                                editor.innerHTML,
                              );

                              // Enforce 500 character limit
                              if (textLength > 500) {
                                // Truncate to 500 characters
                                const tempDiv = document.createElement("div");
                                tempDiv.innerHTML = editor.innerHTML;
                                let text =
                                  tempDiv.textContent ||
                                  tempDiv.innerText ||
                                  "";
                                text = text.substring(0, 500);
                                editor.innerHTML = text;
                              }

                              // Auto-expand height
                              editor.style.height = "auto";
                              editor.style.height = `${Math.max(60, editor.scrollHeight)}px`;
                              handleChoiceChange(
                                index,
                                "choiceText",
                                editor.innerHTML,
                              );
                            }}
                            onKeyDown={(e) => {
                              // Prevent input if at character limit
                              const currentLength = getTextLength(
                                choiceEditors.current[index]?.innerHTML || "",
                              );
                              if (
                                currentLength >= 500 &&
                                e.key !== "Backspace" &&
                                e.key !== "Delete" &&
                                !e.ctrlKey &&
                                !e.metaKey
                              ) {
                                e.preventDefault();
                                return;
                              }

                              // Allow Enter key to create new lines
                              if (e.key === "Enter" && !e.shiftKey) {
                                setTimeout(() => {
                                  if (choiceEditors.current[index]) {
                                    const editor = choiceEditors.current[index];
                                    editor.style.height = "auto";
                                    editor.style.height = `${Math.max(60, editor.scrollHeight)}px`;
                                  }
                                }, 0);
                              }
                            }}
                            onFocus={() => {
                              if (!choice.isFixed) setFocusedChoice(index);
                            }}
                            onBlur={() => {
                              setFocusedChoice(null);
                              if (choiceEditors.current[index]) {
                                handleChoiceChange(
                                  index,
                                  "choiceText",
                                  choiceEditors.current[index].innerHTML,
                                );
                              }
                            }}
                            className="-mt-4 w-full resize-none overflow-hidden rounded px-2 py-2 text-center text-[14px] break-words text-gray-700 focus:border-gray-300 focus:outline-none"
                            style={{
                              minHeight: "40px",
                              textAlign: "center",
                              wordWrap: "break-word",
                              overflowWrap: "break-word",
                              direction: "ltr",
                              transform: "none",
                              writingMode: "horizontal-tb",
                              textOrientation: "mixed",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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

      {/* Settings Modal - Mobile Only (hidden when creating quiz question) */}
      {mode !== "quiz" && isSettingsModalOpen && (
        <div
          className="lightbox-bg fixed inset-0 z-[9999] flex items-end justify-center px-2 md:items-center md:p-4"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="mb-2 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl md:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                  <i className="bx bx-cog text-[20px]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="outfit-700 text-[16px] text-gray-900">
                    Question settings
                  </h3>
                  <p className="outfit-400 text-[12px] text-gray-500">
                    Adjust difficulty, coverage, and purpose.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              {/* Difficulty */}
              {mode !== "quiz" && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="outfit-500 mb-0.5 text-[13px] text-gray-900">
                      Difficulty
                    </span>
                    <span className="outfit-400 text-[12px] text-gray-500">
                      How challenging this question is.
                    </span>
                  </div>
                  <div className="shrink-0">
                    <HeaderDropdown
                      name="difficulty_id"
                      value={formData.difficulty_id}
                      onChange={handleQuestionChange}
                      options={[
                        { value: 1, label: "Easy" },
                        { value: 2, label: "Moderate" },
                        { value: 3, label: "Hard" },
                      ]}
                      show={true}
                      label=""
                    />
                  </div>
                </div>
              )}

              {/* Coverage */}
              {mode !== "quiz" && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="outfit-500 mb-0.5 text-[13px] text-gray-900">
                      Coverage
                    </span>
                    <span className="outfit-400 text-[12px] text-gray-500">
                      Which part of the subject this belongs to.
                    </span>
                  </div>
                  <div className="shrink-0">
                    <HeaderDropdown
                      name="coverage_id"
                      value={formData.coverage_id}
                      onChange={handleQuestionChange}
                      options={[
                        { value: 1, label: "Midterms" },
                        { value: 2, label: "Finals" },
                      ]}
                      show={true}
                      label=""
                    />
                  </div>
                </div>
              )}

              {/* Purpose */}
              {mode !== "quiz" && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="outfit-500 mb-0.5 text-[13px] text-gray-900">
                      Purpose
                    </span>
                    <span className="outfit-400 text-[12px] text-gray-500">
                      How this question will be used.
                    </span>
                  </div>
                  <div className="shrink-0">
                    <HeaderDropdown
                      name="purpose_id"
                      value={formData.purpose_id}
                      onChange={handleQuestionChange}
                      options={[
                        { value: 2, label: "Practice" },
                        { value: 1, label: "Qualifying Exam" },
                      ]}
                      show={true}
                      label=""
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="outfit-500 rounded-xl bg-orange-500 px-4 py-2 text-[14px] text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Selection Modal */}
      <ImageSelectionModal
        isOpen={isImageSelectionModalOpen}
        onClose={() => {
          setIsImageSelectionModalOpen(false);
          setImageSelectionType(null);
        }}
        onImageSelected={handleImageSelected}
        title={
          imageSelectionType === "question"
            ? "Add question image"
            : typeof imageSelectionType === "number"
              ? `Add image to choice ${imageSelectionType + 1}`
              : "Add image"
        }
      />

      {/* Toast notification */}
      <div className="fixed top-4 right-4 z-[99999]">
        <Toast message={toast.message} type={toast.type} show={toast.show} />
      </div>
    </>
  );
};

export default CombinedQuestionForm;
