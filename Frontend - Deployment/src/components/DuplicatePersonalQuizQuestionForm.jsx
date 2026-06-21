import React, { useState, useRef, useEffect } from "react";
import WarnOnExit from "../hooks/WarnOnExit";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import ImageSelectionModal from "./ImageSelectionModal";
import { isAuthenticated } from "../utils/authStorage";

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
    <div className="flex items-center gap-2">
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

const DuplicatePersonalQuizQuestionForm = ({
  quizQuestion,
  quiz,
  onComplete,
  onCancel,
}) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionModalOpen, setisQuestionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const fileInputRef = useRef(null);
  const [focusedChoice, setFocusedChoice] = useState(null);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [animatingChoice, setAnimatingChoice] = useState(null);
  const choiceEditors = useRef({});
  const [choiceImagePreviews, setChoiceImagePreviews] = useState({});
  const [isImageSelectionModalOpen, setIsImageSelectionModalOpen] =
    useState(false);
  const [imageSelectionType, setImageSelectionType] = useState(null);

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
    if (
      !cleanPath.includes("question_images/") &&
      !cleanPath.includes("choices/")
    ) {
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
    quizQuestion.personalQuizQuestionText || quizQuestion.questionText || "";

  const initialImagePath =
    quizQuestion.personalQuizImage || quizQuestion.image || null;
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
    const choices =
      quizQuestion.personalQuizChoices || quizQuestion.choices || [];

    const sortedChoices = choices
      .filter((choice) => choice.position !== undefined && choice.position <= 5)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const result = [];
    for (let i = 0; i < 5; i++) {
      const existingChoice = sortedChoices.find((c) => c.position === i + 1);
      if (existingChoice) {
        const isCorrect =
          existingChoice.personalQuizIsCorrect !== undefined
            ? existingChoice.personalQuizIsCorrect === true ||
              existingChoice.personalQuizIsCorrect === 1 ||
              existingChoice.personalQuizIsCorrect === "1"
            : existingChoice.isCorrect === true ||
              existingChoice.isCorrect === 1 ||
              existingChoice.isCorrect === "1";

        const rawChoiceText =
          existingChoice.personalQuizChoiceText ||
          existingChoice.choiceText ||
          "";
        const displayChoiceText = stripHtml(rawChoiceText);

        const hasImage = !!(
          existingChoice.personalQuizImage || existingChoice.image
        );
        result.push({
          choiceText: hasImage ? "" : displayChoiceText,
          isCorrect: isCorrect,
          image:
            existingChoice.personalQuizImage || existingChoice.image || null,
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

  const [formData, setFormData] = useState({
    coverage_id:
      quizQuestion.personalQuizCoverageId ||
      quizQuestion.personalQuizCoverage?.id ||
      null,
    questionText: initialQuestionText,
    image: initialImagePath,
    remove_image: false,
    score: quizQuestion.personalQuizScore || quizQuestion.score || 1,
    choices: getInitialChoices(),
  });

  // Fetch choices if not available
  useEffect(() => {
    const fetchChoices = async () => {
      if (
        quizQuestion.personalQuizChoices &&
        quizQuestion.personalQuizChoices.length > 0
      ) {
        return;
      }

      const personalQuizQuestionID =
        quizQuestion.personalQuizQuestionID || quizQuestion.id;

      if (!personalQuizQuestionID) {
        return;
      }

      try {
        if (!isAuthenticated()) return;

        const choicesResponse = await fetch(
          `${apiUrl}/personal-quiz-choices/${personalQuizQuestionID}`,
          {
          credentials: "include",
            method: "GET",
            headers: {
              "Content-Type": "application/json",
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
              const existingChoice = fetchedChoices.find(
                (c) => c.position === i + 1,
              );
              if (existingChoice) {
                const isCorrect =
                  existingChoice.personalQuizIsCorrect !== undefined
                    ? existingChoice.personalQuizIsCorrect === true ||
                      existingChoice.personalQuizIsCorrect === 1 ||
                      existingChoice.personalQuizIsCorrect === "1"
                    : existingChoice.isCorrect === true ||
                      existingChoice.isCorrect === 1 ||
                      existingChoice.isCorrect === "1";

                const rawChoiceText =
                  existingChoice.personalQuizChoiceText ||
                  existingChoice.choiceText ||
                  "";
                const displayChoiceText = stripHtml(rawChoiceText);

                const hasImage = !!(
                  existingChoice.personalQuizImage || existingChoice.image
                );
                result.push({
                  choiceText: hasImage ? "" : displayChoiceText,
                  isCorrect: isCorrect,
                  image:
                    existingChoice.personalQuizImage ||
                    existingChoice.image ||
                    null,
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
            setFormData((prev) => ({ ...prev, choices: result }));
          }
        }
      } catch (error) {
        console.error("Error fetching choices:", error);
      }
    };

    fetchChoices();
  }, [quizQuestion.personalQuizQuestionID, apiUrl]);

  useEffect(() => {
    if (editorRef.current) {
      const text =
        quizQuestion.personalQuizQuestionText ||
        quizQuestion.questionText ||
        "";
      if (text) {
        editorRef.current.innerHTML = text;
        setFormData((prev) => ({ ...prev, questionText: text }));
      }
    }
  }, [quizQuestion.personalQuizQuestionText, quizQuestion.questionText]);

  WarnOnExit(formData);

  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        typeof imagePreview === "string" &&
        imagePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imagePreview);
      }
      Object.values(choiceImagePreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreview, choiceImagePreviews]);

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
    if (editorRef.current) editorRef.current.style.textAlign = "center";
    editorRef.current?.focus();
  };

  const checkFormatting = () => {
    setTimeout(() => {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
      setIsStrikethrough(document.queryCommandState("strikeThrough"));
    }, 10);
  };

  const autoExpandEditor = (element) => {
    if (element) {
      element.style.height = "auto";
      element.style.height = `${Math.max(120, element.scrollHeight)}px`;
      element.style.maxWidth = "100%";
    }
  };

  const autoExpandTextarea = (element) => {
    if (element) {
      element.style.height = "auto";
      element.style.height = `${Math.max(40, element.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.addEventListener("focus", () => setIsFocused(true));
      editorRef.current.addEventListener("blur", () => setIsFocused(false));
      editorRef.current.addEventListener("mouseup", checkFormatting);
      editorRef.current.addEventListener("keyup", () => {
        checkFormatting();
        if (editorRef.current) editorRef.current.style.textAlign = "center";
      });
      editorRef.current.style.textAlign = "center";
      autoExpandEditor(editorRef.current);
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && formData.questionText) {
      autoExpandEditor(editorRef.current);
    }
  }, [formData.questionText]);

  useEffect(() => {
    formData.choices.forEach((choice, index) => {
      const editor = choiceEditors.current[index];
      if (editor) {
        const currentHTML = editor.innerHTML?.trim() || "";
        const newHTML = (choice.choiceText || "").trim();
        if (currentHTML !== newHTML) {
          editor.innerHTML = newHTML || "";
        }
        autoExpandTextarea(editor);
      }
    });
  }, [formData.choices]);

  const handleRemoveQuestionImage = () => {
    setFormData((prev) => ({ ...prev, image: null, remove_image: true }));
    setImagePreview(null);
  };

  const handleQuestionChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files?.[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file, remove_image: false }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageSelected = (file) => {
    if (imageSelectionType === "question") {
      setFormData((prev) => ({ ...prev, image: file, remove_image: false }));
      setImagePreview(URL.createObjectURL(file));
      setIsImageSelectionModalOpen(false);
      setImageSelectionType(null);
    } else if (typeof imageSelectionType === "number") {
      const index = imageSelectionType;
      if (choiceImagePreviews[index]) {
        URL.revokeObjectURL(choiceImagePreviews[index]);
      }
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => {
        const updated = [...prev.choices];
        updated[index] = {
          ...updated[index],
          image: file,
          choiceText: "",
          position: index + 1,
        };
        return { ...prev, choices: updated };
      });
      setChoiceImagePreviews((prev) => ({ ...prev, [index]: previewUrl }));
      const editor = choiceEditors.current[index];
      if (editor) editor.innerHTML = "";
      setIsImageSelectionModalOpen(false);
      setImageSelectionType(null);
    }
  };

  const handleChoiceChange = (index, field, value) => {
    const updated = [...formData.choices];
    if (field === "isCorrect" && value) {
      updated.forEach((c, i) => {
        if (i !== index) c.isCorrect = false;
      });
    }
    // Enforce mutual exclusion: choice must have either text OR image, never both
    if (field === "choiceText") {
      const hasText = getTextLength(value || "") > 0;
      if (hasText) {
        updated[index] = {
          ...updated[index],
          [field]: value,
          image: null,
          position: index + 1,
        };
        if (choiceImagePreviews[index]) {
          URL.revokeObjectURL(choiceImagePreviews[index]);
          setChoiceImagePreviews((prev) => {
            const next = { ...prev };
            delete next[index];
            return next;
          });
        }
        const editor = choiceEditors.current[index];
        if (editor) editor.innerHTML = value || "";
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
          position: index + 1,
        };
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
        position: index + 1,
      };
    }
    setFormData((prev) => ({ ...prev, choices: updated }));
  };

  const handleChoiceImageUpload = (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (choiceImagePreviews[index]) {
      URL.revokeObjectURL(choiceImagePreviews[index]);
    }
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => {
      const updated = [...prev.choices];
      updated[index] = {
        ...updated[index],
        image: file,
        choiceText: "",
        position: index + 1,
      };
      return { ...prev, choices: updated };
    });
    setChoiceImagePreviews((prev) => ({ ...prev, [index]: previewUrl }));
    const editor = choiceEditors.current[index];
    if (editor) editor.innerHTML = "";
    event.target.value = "";
  };

  const removeChoiceImage = (index) => {
    if (choiceImagePreviews[index]) {
      URL.revokeObjectURL(choiceImagePreviews[index]);
      setChoiceImagePreviews((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
    setFormData((prev) => {
      const updated = [...prev.choices];
      updated[index] = {
        ...updated[index],
        image: null,
        position: index + 1,
      };
      return { ...prev, choices: updated };
    });
  };

  const getTextLength = (html) => {
    if (!html) return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || "").length;
  };

  const cleanPastedHTML = (html) => {
    if (!html) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const allElements = tempDiv.querySelectorAll("*");
    allElements.forEach((el) => {
      el.style.backgroundColor = "";
      el.style.background = "";
      el.style.color = "";
      el.style.fontFamily = "";
      el.style.fontSize = "";
      el.style.fontWeight = "";
      el.style.fontStyle = "";
      el.style.transform = "";
      el.style.webkitTransform = "";
      el.style.mozTransform = "";
      el.style.msTransform = "";
      el.style.direction = "";
      el.style.writingMode = "";
      el.style.textOrientation = "";
      el.style.unicodeBidi = "";
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
        el.setAttribute("style", cleanedStyle || "");
        if (!cleanedStyle) el.removeAttribute("style");
      }
      el.removeAttribute("bgcolor");
      el.removeAttribute("face");
      el.removeAttribute("size");
      el.removeAttribute("dir");
    });
    let cleanedHTML = tempDiv.innerHTML;
    cleanedHTML = cleanedHTML.replace(/\r?\n/g, " ").replace(/\r/g, " ");
    cleanedHTML = cleanedHTML.replace(/[ \t]+/g, " ");
    return cleanedHTML;
  };

  const choiceColors = [
    "bg-white border border-gray-300",
    "bg-gray-100 border border-gray-300",
    "bg-white border border-gray-300",
    "bg-gray-100 border border-gray-300",
    "bg-white border border-gray-300",
  ];

  const handleCloseForm = () => {
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setIsStrikethrough(false);
    onCancel();
  };

  const getChoiceImageSrc = (choice, index) => {
    if (choiceImagePreviews[index]) return choiceImagePreviews[index];
    if (choice.image instanceof File) return URL.createObjectURL(choice.image);
    return typeof choice.image === "string"
      ? getImageUrl(choice.image)
      : choice.image;
  };

  const handleSubmit = async () => {
    setError(null);
    const formattedQuestionText = editorRef.current?.innerHTML?.trim() || "";

    if (!formattedQuestionText || formattedQuestionText === "<br>") {
      setError("Please enter a question before submitting.");
      showToast("Please enter a question before submitting.", "error");
      return;
    }

    const choicesToValidate = formData.choices.slice(0, 4);
    if (
      !choicesToValidate.every((choice) => {
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

    const correctChoices = formData.choices.filter((c) => c.isCorrect);
    if (correctChoices.length !== 1) {
      setError("Please select exactly one correct answer.");
      showToast("Please select exactly one correct answer.", "error");
      return;
    }

    const isSubjectBased = quiz?.quiz_type_id === 1;
    if (isSubjectBased && !formData.coverage_id) {
      setError("Coverage is required for subject-based quizzes.");
      showToast("Coverage is required for subject-based quizzes.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const personalQuizQuestionID =
        quizQuestion.personalQuizQuestionID || quizQuestion.id;

      if (!personalQuizQuestionID) {
        throw new Error("Unable to determine question ID for duplication.");
      }

      const targetPersonalQuizID =
        quiz.personalQuizID || quiz.id || quiz.quizID || quiz.personalQuizId;

      if (!targetPersonalQuizID) {
        throw new Error("Unable to determine target quiz ID.");
      }

      const submitData = new FormData();
      submitData.append("targetPersonalQuizID", targetPersonalQuizID);
      submitData.append("questionText", formattedQuestionText);
      submitData.append("score", formData.score);
      submitData.append("remove_image", formData.remove_image ? "1" : "0");
      if (formData.image instanceof File) {
        submitData.append("image", formData.image);
      } else if (formData.image && typeof formData.image === "string") {
        submitData.append("image", formData.image);
      }
      if (isSubjectBased && formData.coverage_id) {
        submitData.append("coverage_id", formData.coverage_id);
      }

      const choicesToSend = formData.choices.filter((_, index) => index < 4);
      const isNoneOfAboveSelected = formData.choices[4]?.isCorrect === true;

      choicesToSend.forEach((choice, index) => {
        submitData.append(
          `choices[${index}][choiceText]`,
          (choice.choiceText || "").trim(),
        );
        const isCorrectValue = isNoneOfAboveSelected ? false : choice.isCorrect;
        submitData.append(
          `choices[${index}][isCorrect]`,
          isCorrectValue ? "1" : "0",
        );
        if (choice.image instanceof File) {
          submitData.append(`choices[${index}][image]`, choice.image);
        } else if (choice.image && typeof choice.image === "string") {
          submitData.append(`choices[${index}][image]`, choice.image);
        }
      });

      // Make API call to duplicate endpoint
      const response = await fetch(
        `${apiUrl}/personal-quiz-questions/${personalQuizQuestionID}/duplicate`,
        {
          credentials: "include",
          method: "POST",
          headers: { },
          body: submitData,
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
    // Use formData so placeholder respects initial question text immediately
    return getTextLength(formData.questionText) === 0;
  };

  const isSubjectBased = quiz?.quiz_type_id === 1;

  const getQuestionImagePreviewSrc = () => {
    if (!imagePreview) return null;
    if (typeof imagePreview === "string" && imagePreview.startsWith("blob:"))
      return imagePreview;
    if (typeof imagePreview === "string") return getImageUrl(imagePreview);
    if (imagePreview instanceof File) return URL.createObjectURL(imagePreview);
    return getImageUrl(imagePreview);
  };

  return (
    <>
      <div className="outfit lightbox-bg animate-slide-up fixed inset-0 z-105 flex flex-col overflow-hidden bg-gray-100">
        <div className="outfit-400 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCloseForm}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-gray-800 transition duration-100 hover:bg-gray-100 hover:text-gray-800"
            >
              <i className="bx bx-arrow-left-stroke text-2xl"></i>
            </button>
            <span className="text-[16px] font-medium text-gray-800">
              Copy Question
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isSubjectBased && (
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-100 md:hidden"
              >
                <i className="bx bx-cog text-[20px]"></i>
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-1.5 text-[14px] font-medium text-white transition ${
                isLoading
                  ? "cursor-not-allowed bg-orange-500"
                  : "hover:bg-orange-600"
              }`}
          >
            <span>{isLoading ? "Copying..." : "Copy"}</span>
            </button>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between border-b border-gray-300 bg-gray-50 px-6 shadow-sm">
          <div className="flex items-center gap-3">
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
            <div className="h-6 w-px bg-gray-300"></div>
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
                onInput={(e) => {
                  const val = parseInt(e.target.value);
                  if (val < 1) e.target.value = 1;
                  if (val > 100) e.target.value = 100;
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="min-w-0 flex-1">
                  <div
                    className="outfit-400 relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-lg border border-gray-200 p-15 transition-all duration-150"
                    onClick={(e) => {
                      if (e.target === e.currentTarget)
                        editorRef.current?.focus();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
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
                      onClick={(e) => e.stopPropagation()}
                      onFocus={() => {
                        setIsFocused(true);
                        if (editorRef.current)
                          editorRef.current.style.textAlign = "center";
                      }}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          const sel = window.getSelection();
                          if (sel.rangeCount > 0) {
                            const range = sel.getRangeAt(0);
                            const br = document.createElement("br");
                            range.deleteContents();
                            range.insertNode(br);
                            range.setStartAfter(br);
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);
                            editorRef.current?.dispatchEvent(
                              new Event("input", { bubbles: true }),
                            );
                          }
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
                        const sel = window.getSelection();
                        if (sel.rangeCount === 0) return;
                        const range = sel.getRangeAt(0);
                        const currentText =
                          editorRef.current?.textContent || "";
                        const remaining = 1000 - currentText.length;
                        if (remaining <= 0) return;
                        range.deleteContents();
                        let html = e.clipboardData.getData("text/html");
                        let text = e.clipboardData.getData("text/plain");
                        if (html) {
                          html = cleanPastedHTML(html);
                          const temp = document.createElement("div");
                          temp.innerHTML = html;
                          temp.style.direction = "ltr";
                          temp.style.transform = "none";
                          temp.style.writingMode = "horizontal-tb";
                          const pasted =
                            temp.textContent || temp.innerText || "";
                          if (pasted.length > remaining) {
                            range.insertNode(
                              document.createTextNode(
                                pasted.substring(0, remaining),
                              ),
                            );
                          } else {
                            const frag = document.createDocumentFragment();
                            while (temp.firstChild)
                              frag.appendChild(temp.firstChild);
                            range.insertNode(frag);
                          }
                        } else if (text) {
                          text = text.replace(/\s+/g, " ").trim();
                          if (text.length > remaining)
                            text = text.substring(0, remaining);
                          range.insertNode(document.createTextNode(text));
                        }
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
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
                        const len = getTextLength(editor.innerHTML);
                        if (len > 1000) {
                          const temp = document.createElement("div");
                          temp.innerHTML = editor.innerHTML;
                          let t = temp.textContent || temp.innerText || "";
                          editor.innerHTML = t.substring(0, 1000);
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
                    <div className="absolute right-2 bottom-2 text-[12px] text-gray-500">
                      {getTextLength(formData.questionText)}/1000
                    </div>
                  </div>
                </div>

                {imagePreview && (
                  <>
                    <div className="relative hidden w-[400px] flex-shrink-0 md:block">
                      <img
                        src={getQuestionImagePreviewSrc()}
                        alt="Question"
                        className="h-auto max-h-[300px] w-full cursor-pointer rounded-lg object-contain shadow-lg hover:opacity-90"
                        onClick={() => setisQuestionModalOpen(true)}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveQuestionImage}
                        className="absolute top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                      >
                        <i className="bx bx-x text-sm"></i>
                      </button>
                    </div>
                    <div className="relative mt-4 flex w-full justify-center md:hidden">
                      <div className="relative max-w-full">
                        <img
                          src={getQuestionImagePreviewSrc()}
                          alt="Question"
                          className="h-auto max-h-[300px] w-full cursor-pointer rounded-lg object-contain shadow-lg hover:opacity-90"
                          onClick={() => setisQuestionModalOpen(true)}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveQuestionImage}
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
                        onChange={(e) => handleChoiceImageUpload(index, e)}
                      />
                    </div>

                    <div
                      className="mt-8"
                      key={`choice-content-${index}-${choice.image ? "img" : "txt"}`}
                    >
                      {choice.image ? (
                        <div className="flex w-full min-w-0 flex-col items-center">
                          <div className="relative w-full">
                            <img
                              src={getChoiceImageSrc(choice, index)}
                              alt={`Choice ${index + 1}`}
                              className="h-auto max-h-[200px] w-full cursor-pointer rounded object-contain hover:opacity-90"
                              onClick={() => {
                                setchoiceModalImage(
                                  getChoiceImageSrc(choice, index),
                                );
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
                            onClick={(e) => e.stopPropagation()}
                            onPaste={(e) => {
                              if (choice.isFixed) {
                                e.preventDefault();
                                return;
                              }
                              e.preventDefault();
                              const sel = window.getSelection();
                              if (sel.rangeCount === 0) return;
                              const editor = choiceEditors.current[index];
                              if (!editor) return;
                              const cur = editor.textContent || "";
                              const remain = 500 - cur.length;
                              if (remain <= 0) return;
                              const range = sel.getRangeAt(0);
                              range.deleteContents();
                              let html = e.clipboardData.getData("text/html");
                              let text = e.clipboardData.getData("text/plain");
                              if (html) {
                                html = cleanPastedHTML(html);
                                const temp = document.createElement("div");
                                temp.innerHTML = html;
                                temp.style.direction = "ltr";
                                temp.style.transform = "none";
                                temp.style.writingMode = "horizontal-tb";
                                const pasted =
                                  temp.textContent || temp.innerText || "";
                                if (pasted.length > remain) {
                                  range.insertNode(
                                    document.createTextNode(
                                      pasted.substring(0, remain),
                                    ),
                                  );
                                } else {
                                  const frag =
                                    document.createDocumentFragment();
                                  while (temp.firstChild)
                                    frag.appendChild(temp.firstChild);
                                  range.insertNode(frag);
                                }
                              } else if (text) {
                                text = text.replace(/\s+/g, " ").trim();
                                if (text.length > remain)
                                  text = text.substring(0, remain);
                                range.insertNode(document.createTextNode(text));
                              }
                              range.collapse(false);
                              sel.removeAllRanges();
                              sel.addRange(range);
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
                              const len = getTextLength(editor.innerHTML);
                              if (len > 500) {
                                const temp = document.createElement("div");
                                temp.innerHTML = editor.innerHTML;
                                let t =
                                  temp.textContent || temp.innerText || "";
                                editor.innerHTML = t.substring(0, 500);
                              }
                              editor.style.height = "auto";
                              editor.style.height = `${Math.max(60, editor.scrollHeight)}px`;
                              handleChoiceChange(
                                index,
                                "choiceText",
                                editor.innerHTML,
                              );
                            }}
                            onKeyDown={(e) => {
                              const len = getTextLength(
                                choiceEditors.current[index]?.innerHTML || "",
                              );
                              if (
                                len >= 500 &&
                                e.key !== "Backspace" &&
                                e.key !== "Delete" &&
                                !e.ctrlKey &&
                                !e.metaKey
                              ) {
                                e.preventDefault();
                                return;
                              }
                              if (e.key === "Enter" && !e.shiftKey) {
                                setTimeout(() => {
                                  const ed = choiceEditors.current[index];
                                  if (ed) {
                                    ed.style.height = "auto";
                                    ed.style.height = `${Math.max(60, ed.scrollHeight)}px`;
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

      {isSettingsModalOpen && isSubjectBased && (
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
                    Adjust coverage for this question.
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

      {isQuestionModalOpen && imagePreview && (
        <div
          className="bg-opacity-70 lightbox-bg-image fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={() => setisQuestionModalOpen(false)}
        >
          <div className="relative">
            <img
              src={getQuestionImagePreviewSrc()}
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
