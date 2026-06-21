import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
}

function shuffleChoicesKeepNoneAtEnd(choices) {
  if (!choices || choices.length < 2) return choices;
  const idx = choices.findIndex(
    (c) =>
      stripHtml(typeof c === "string" ? c : c.choiceText)?.toLowerCase() ===
      "none of the above",
  );
  if (idx === -1) return shuffleArray(choices);
  const none = choices[idx];
  const rest = choices.slice(0, idx).concat(choices.slice(idx + 1));
  const shuffled = shuffleArray(rest);
  return [...shuffled, none];
}

export default function PrintPersonalQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz: quizInfo, pdfData, fromAPI } = location.state || {};

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback questions if no data
  const fallbackQuestions = [
    {
      questionText: "Sample question?",
      choices: [
        { choiceText: "Option A", isCorrect: true },
        { choiceText: "Option B", isCorrect: false },
      ],
    },
  ];

  // Transform API data to match display format
  const transformQuestions = (questions) => {
    if (!questions) return fallbackQuestions;
    return questions.map((q) => ({
      questionText: q.questionText || "",
      questionImage: q.questionImageUrl || q.questionImageBase64 || null,
      questionImageBase64: q.questionImageBase64 || null,
      choices: (q.choices || []).map((c) => ({
        choiceText: c.choiceText || "",
        choiceImage: c.choiceImageUrl || c.choiceImageBase64 || null,
        choiceImageBase64: c.choiceImageBase64 || null,
        isCorrect: c.isCorrect || false,
      })),
    }));
  };

  // Redirect if no quiz info and no PDF data
  useEffect(() => {
    if (!quizInfo?.personalQuizID && !pdfData) {
      navigate(-1);
    }
  }, [quizInfo, pdfData, navigate]);

  // Handle PDF data from API
  useEffect(() => {
    if (fromAPI && pdfData) {
      try {
        setIsLoading(true);
        setError(null);

        // Transform API data to match display format
        const transformedQuestions = transformQuestions(
          pdfData.questions || [],
        );

        // Build answer key if available
        let answerKey = null;
        if (pdfData.answerKey && pdfData.answerKey.length > 0) {
          // Use answer key from API
          answerKey = pdfData.answerKey.map((item) => {
            const question = pdfData.questions[item.questionNumber - 1];
            if (question && question.choices) {
              // Find the index of the correct choice(s)
              const correctChoices = item.correctChoices || [];
              if (correctChoices.length > 0) {
                // Find the first correct choice index
                const correctChoiceId = correctChoices[0]?.personalQuizChoiceID;
                const correctIdx = question.choices.findIndex(
                  (c) => c.personalQuizChoiceID === correctChoiceId,
                );
                const letter =
                  correctIdx !== -1
                    ? String.fromCharCode(65 + correctIdx)
                    : "-";
                return {
                  questionNumber: item.questionNumber,
                  answer: letter,
                };
              }
            }
            return {
              questionNumber: item.questionNumber,
              answer: "-",
            };
          });
        } else if (pdfData.settings?.includeAnswerKey) {
          // Generate answer key from questions if not provided but requested
          answerKey = transformedQuestions.map((q, idx) => {
            const correctIdx = q.choices?.findIndex((c) => c.isCorrect);
            return {
              questionNumber: idx + 1,
              answer:
                correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : "-",
            };
          });
        }

        setQuizData({
          quiz: {
            title: pdfData.quiz?.title || "Quiz",
            instructions:
              pdfData.quiz?.instructions || pdfData.quiz?.instruction || "",
          },
          questions: transformedQuestions,
          answerKey: answerKey,
        });
      } catch (err) {
        console.error("Error processing PDF data:", err);
        setError(err.message || "Failed to process PDF data");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Old method: Fetch questions from API
    const fetchQuestions = async () => {
      if (!quizInfo?.personalQuizID) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        // Fetch questions from the same endpoint as QuizContent
        const questionsResponse = await fetch(
          `${apiUrl}/personal-quiz-questions/${quizInfo.personalQuizID}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!questionsResponse.ok) {
          const errorData = await questionsResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch questions");
        }

        const questionsData = await questionsResponse.json();
        if (!questionsData.success) {
          throw new Error(questionsData.message || "Failed to fetch questions");
        }

        let fetchedQuestions = questionsData.questions || [];

        // Filter questions if selectedQuestionIds are provided
        if (
          quizInfo?.selectedQuestionIds &&
          quizInfo.selectedQuestionIds.length > 0
        ) {
          // Convert all IDs to strings for consistent comparison
          const selectedIds = quizInfo.selectedQuestionIds.map((id) =>
            String(id),
          );
          fetchedQuestions = fetchedQuestions.filter((q) => {
            const qId = String(
              q.personalQuizQuestionID || q.questionID || q.id,
            );
            return selectedIds.includes(qId);
          });
        }

        // Fetch choices for questions that don't have personalQuizChoices
        const choicesToFetch = [];
        fetchedQuestions.forEach((q) => {
          if (!q.personalQuizChoices || q.personalQuizChoices.length === 0) {
            if (q.personalQuizQuestionID) {
              choicesToFetch.push({
                personalQuizQuestionID: q.personalQuizQuestionID,
                questionID: q.questionID,
              });
            }
          }
        });

        // Fetch choices if needed
        if (choicesToFetch.length > 0) {
          const choicesPromises = choicesToFetch.map(
            async ({ personalQuizQuestionID, questionID }) => {
              try {
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
                    return {
                      personalQuizQuestionID,
                      choices: choicesData.choices,
                    };
                  }
                }

                if (questionID) {
                  const originalQuestionResponse = await fetch(
                    `${apiUrl}/questions/${questionID}`,
                    {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  );

                  if (originalQuestionResponse.ok) {
                    const originalQuestionData =
                      await originalQuestionResponse.json();
                    if (
                      originalQuestionData.success &&
                      originalQuestionData.data?.choices
                    ) {
                      return {
                        personalQuizQuestionID,
                        choices: originalQuestionData.data.choices,
                      };
                    }
                  }
                }
              } catch (error) {
                console.error(
                  `Error fetching choices for question ${personalQuizQuestionID}:`,
                  error,
                );
              }
              return null;
            },
          );

          const choicesResults = await Promise.all(choicesPromises);
          choicesResults.forEach((result) => {
            if (result) {
              fetchedQuestions = fetchedQuestions.map((q) => {
                if (
                  q.personalQuizQuestionID === result.personalQuizQuestionID
                ) {
                  return { ...q, personalQuizChoices: result.choices };
                }
                return q;
              });
            }
          });
        }

        // Helper to get image URL (defined before use)
        const getImageUrlForQuestion = (imagePath) => {
          if (!imagePath) return null;
          if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://")
          ) {
            return imagePath;
          }
          if (imagePath.startsWith("data:")) {
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

        // Transform questions to match the expected format
        const transformedQuestions = fetchedQuestions.map((q) => {
          const question = q.question || q;
          const choices =
            q.personalQuizChoices || (question && question.choices) || [];

          const questionImagePath =
            q.personalQuizImage || q.image || question.image || null;

          return {
            questionText:
              q.personalQuizQuestionText ||
              q.questionText ||
              question.questionText ||
              "",
            questionImage: questionImagePath
              ? getImageUrlForQuestion(questionImagePath)
              : null,
            questionImageBase64: null, // Will be populated by PDF endpoint if needed
            choices: choices.map((c) => {
              const choiceImagePath = c.image || c.personalQuizImage || null;
              return {
                choiceText: c.choiceText || c.personalQuizChoiceText || "",
                choiceImage: choiceImagePath
                  ? getImageUrlForQuestion(choiceImagePath)
                  : null,
                choiceImageBase64: null,
                isCorrect:
                  c.isCorrect !== undefined
                    ? c.isCorrect
                    : c.personalQuizIsCorrect !== undefined
                      ? c.personalQuizIsCorrect
                      : false,
              };
            }),
          };
        });

        // Set quiz data with transformed questions
        setQuizData({
          quiz: {
            title: quizInfo.title || "Quiz",
            instructions: quizInfo.instruction || "",
          },
          questions: transformedQuestions,
          answerKey: transformedQuestions.map((q, idx) => {
            const correctIdx = q.choices?.findIndex((c) => c.isCorrect);
            return {
              questionNumber: idx + 1,
              answer:
                correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : "-",
            };
          }),
        });
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError(err.message || "Failed to load quiz data");
      } finally {
        setIsLoading(false);
      }
    };

    if (!fromAPI || !pdfData) {
      fetchQuestions();
    }
  }, [quizInfo, apiUrl, pdfData, fromAPI]);

  const originalQuestions = useRef(
    quizData?.questions
      ? transformQuestions(quizData.questions)
      : fallbackQuestions,
  );

  const [fontSize, setFontSize] = useState("L");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAnswerKey, setIsDownloadingAnswerKey] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const pdfContentRef = useRef(null);
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [zoom, setZoom] = useState(1);
  const fontSizeMap = {
    S: 12,
    M: 14,
    L: 16,
    XL: 20,
  };
  const imageSizeMap = {
    S: 50,
    M: 60,
    L: 80,
    XL: 140,
  };
  const [imageSize, setImageSize] = useState("S");
  const [showSettings, setShowSettings] = useState(false);
  const settingsButtonRef = useRef(null);
  const settingsDropdownRef = useRef(null);

  // Auto-adjust zoom for small screens
  useEffect(() => {
    const adjustZoomForSmallScreens = () => {
      const isSmallScreen = window.innerWidth < 1200;
      const isMediumScreen =
        window.innerWidth >= 768 && window.innerWidth < 1200;

      if (isSmallScreen) {
        const contentWidth = 210;
        const screenWidth = window.innerWidth;
        const padding = 32;
        const sidebarWidth = isMediumScreen ? 320 : 0;
        const availableWidth = screenWidth - padding - sidebarWidth;
        const calculatedZoom = availableWidth / (contentWidth * 3.779527559);
        setZoom(Math.min(calculatedZoom, 1));
      } else {
        setZoom(1);
      }
    };

    adjustZoomForSmallScreens();
    window.addEventListener("resize", adjustZoomForSmallScreens);

    return () =>
      window.removeEventListener("resize", adjustZoomForSmallScreens);
  }, []);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    function handleClick(e) {
      if (
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(e.target) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(e.target)
      ) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  // Initialize displayed questions when quizData changes
  useEffect(() => {
    if (quizData?.questions) {
      const transformed = transformQuestions(quizData.questions);
      originalQuestions.current = transformed;
      setDisplayedQuestions(transformed);
    } else if (quizData && !quizData.questions) {
      // If quizData exists but no questions, use fallback
      originalQuestions.current = fallbackQuestions;
      setDisplayedQuestions(fallbackQuestions);
    }
  }, [quizData]);

  const handleShuffleQuestionsClick = () => {
    setDisplayedQuestions((prev) => {
      const source = prev && prev.length ? prev : originalQuestions.current;
      return shuffleArray(source.map((q) => ({ ...q })));
    });
  };

  const handleShuffleChoicesClick = () => {
    setDisplayedQuestions((prev) => {
      const source = prev && prev.length ? prev : originalQuestions.current;
      return source.map((q) => {
        if (q.choices) {
          return { ...q, choices: shuffleChoicesKeepNoneAtEnd(q.choices) };
        }
        return q;
      });
    });
  };

  const questionCount = originalQuestions.current.length;
  const quizTitle =
    quizData?.quiz?.title || quizInfo?.title || "Quiz Worksheet";
  const quizInstructions =
    quizData?.quiz?.instructions ||
    quizData?.quiz?.instruction ||
    quizInfo?.instruction ||
    "";

  // Sanitize a cloned document to remove oklch() colors before html2canvas renders it.
  // This runs inside html2canvas's `onclone` callback so the live DOM is never touched.
  const sanitizeClonedDoc = (clonedDoc) => {
    // Replace oklch() values in stylesheets with safe fallbacks (keeps all layout rules intact)
    const oklchRegex = /oklch\([^)]*\)/gi;
    for (const sheet of clonedDoc.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;

        let hasOklch = false;
        let sanitizedCss = "";

        for (const rule of rules) {
          if (rule.cssText && rule.cssText.includes("oklch")) {
            hasOklch = true;
            sanitizedCss +=
              rule.cssText.replace(oklchRegex, "transparent") + "\n";
          } else {
            sanitizedCss += (rule.cssText || "") + "\n";
          }
        }

        if (hasOklch) {
          // Disable the original stylesheet and inject a cleaned copy
          sheet.disabled = true;
          const cleanStyle = clonedDoc.createElement("style");
          cleanStyle.textContent = sanitizedCss;
          clonedDoc.head.appendChild(cleanStyle);
        }
      } catch (e) {
        // Cross-origin stylesheets will throw - skip them
      }
    }

    // Also fix any computed oklch values on elements (belt-and-suspenders)
    const colorProps = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
      "caretColor",
      "columnRuleColor",
      "fill",
      "stroke",
    ];

    const elements = clonedDoc.querySelectorAll("*");
    for (const el of elements) {
      const style = clonedDoc.defaultView.getComputedStyle(el);

      for (const prop of colorProps) {
        const val = style[prop];
        if (val && val.includes("oklch")) {
          if (prop === "color" || prop === "fill") {
            el.style[prop] = "#222";
          } else if (prop === "backgroundColor") {
            el.style[prop] = "transparent";
          } else {
            el.style[prop] = "#d1d5db";
          }
        }
      }

      if (style.boxShadow && style.boxShadow.includes("oklch")) {
        el.style.boxShadow = "none";
      }
    }
  };

  // Function to wait for all images to load
  const waitForImagesToLoad = (container) => {
    const images = container.querySelectorAll("img");
    const promises = Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        }),
    );
    return Promise.all(promises);
  };

  // Helper function to construct image URL (matches backend generateUrl logic)
  const getImageUrl = (imagePath) => {
    // If path is null or empty, return null
    if (!imagePath) {
      return null;
    }

    // If it's already a full URL, return as is (works for external URLs)
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // If it's a data URL, return as is
    if (imagePath.startsWith("data:")) {
      return imagePath;
    }

    // Remove /storage/ prefix if present (path might be stored with or without it)
    let cleanPath = imagePath;
    if (imagePath.startsWith("/storage/")) {
      cleanPath = imagePath.substring("/storage/".length);
    } else if (imagePath.startsWith("storage/")) {
      cleanPath = imagePath.substring("storage/".length);
    }

    // Check if it looks like a valid storage path (contains question_images/ or choices/)
    // If it doesn't look like a storage path, return null
    if (
      !cleanPath.includes("question_images/") &&
      !cleanPath.includes("choices/")
    ) {
      return null;
    }

    // Generate the full URL for the file
    // Use the base URL from API (removing /api suffix) and append /storage/
    const baseUrl = apiUrl.replace("/api", "");
    return `${baseUrl}/storage/${cleanPath}`;
  };

  // Helper to get image source (handles base64 and URLs)
  const getImageSrc = (imageUrl, imageBase64) => {
    // Prefer base64 if available
    if (imageBase64) {
      // If it's already a data URL, return as is
      if (typeof imageBase64 === "string" && imageBase64.startsWith("data:")) {
        return imageBase64;
      }
      // Otherwise, assume it's base64 string and prepend data URL prefix
      return `data:image/png;base64,${imageBase64}`;
    }
    // Fall back to URL - convert path to full URL if needed
    if (imageUrl) {
      // If URL is already a data URL, return as is
      if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
        return imageUrl;
      }
      // If it's a full URL, return as is
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
      }
      // Otherwise, try to convert path to full URL
      return getImageUrl(imageUrl);
    }
    return null;
  };

  const handleDownload = async () => {
    try {
      setError(null);
      setIsDownloading(true);
      const element = pdfContentRef.current;
      if (!element) throw new Error("Content not found");

      await waitForImagesToLoad(element);

      const html2canvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
        onclone: sanitizeClonedDoc,
      };

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = imgWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      const headerSection = element.querySelector(".exam-header");
      const instructionsSection = element.querySelector(".exam-instructions");
      const questionContainers = element.querySelectorAll(
        ".question-container",
      );

      let currentY = margin;
      let currentPage = 0;

      // Add header to first page
      if (headerSection) {
        const headerCanvas = await html2canvas(
          headerSection,
          html2canvasOptions,
        );

        const headerHeight =
          (headerCanvas.height * contentWidth) / headerCanvas.width;

        pdf.addImage(
          headerCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          currentY,
          contentWidth,
          headerHeight,
        );

        currentY += headerHeight + 5;
      }

      // Add instructions
      if (instructionsSection) {
        const instrCanvas = await html2canvas(
          instructionsSection,
          html2canvasOptions,
        );

        const instrHeight =
          (instrCanvas.height * contentWidth) / instrCanvas.width;

        pdf.addImage(
          instrCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          currentY,
          contentWidth,
          instrHeight,
        );

        currentY += instrHeight + 2;
      }

      // Process each question container
      for (let i = 0; i < questionContainers.length; i++) {
        const questionContainer = questionContainers[i];

        const canvas = await html2canvas(questionContainer, html2canvasOptions);

        const questionHeight = (canvas.height * contentWidth) / canvas.width;

        if (currentY + questionHeight > contentHeight && currentY > margin) {
          pdf.addPage();
          currentPage++;
          currentY = margin;
        }

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          margin,
          currentY,
          contentWidth,
          questionHeight,
        );

        currentY += questionHeight + 2;
      }

      pdf.save(`${quizTitle.replace(/[^a-z0-9]/gi, "_")}_worksheet.pdf`);
      setRetryCount(0);
    } catch (err) {
      console.error("Download error:", err);
      if (
        err.message.includes("Failed to generate PDF") ||
        err.message.includes("canvas")
      ) {
        if (retryCount < 2) {
          setRetryCount((prev) => prev + 1);
          setError(
            `PDF generation failed. Retrying... (Attempt ${retryCount + 1}/2)`,
          );
          setTimeout(() => {
            handleDownload();
          }, 2000);
        } else {
          setError(
            "PDF generation failed after multiple attempts. Please try reducing the number of questions or images and try again.",
          );
        }
      } else {
        setError(err.message || "Failed to download the worksheet");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAnswerKey = async () => {
    if (!quizData?.answerKey) {
      setError("Answer key was not included in the generated data.");
      return;
    }

    try {
      setError(null);
      setIsDownloadingAnswerKey(true);
      const element = pdfContentRef.current;
      if (!element) throw new Error("Content not found");

      await waitForImagesToLoad(element);

      const html2canvasOptions = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
        onclone: sanitizeClonedDoc,
      };

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = imgWidth - margin * 2;

      const headerSection = element.querySelector(".exam-header");
      const answerKeySection = element.querySelector(".answer-key-page-break");

      if (!answerKeySection) {
        throw new Error("Answer key not found");
      }

      let currentY = margin;

      // Add header to first page
      if (headerSection) {
        const headerCanvas = await html2canvas(
          headerSection,
          html2canvasOptions,
        );

        const headerHeight =
          (headerCanvas.height * contentWidth) / headerCanvas.width;

        pdf.addImage(
          headerCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          currentY,
          contentWidth,
          headerHeight,
        );

        currentY += headerHeight + 10;
      }

      // Add answer key
      const answerCanvas = await html2canvas(
        answerKeySection,
        html2canvasOptions,
      );

      const answerHeight =
        (answerCanvas.height * contentWidth) / answerCanvas.width;

      pdf.addImage(
        answerCanvas.toDataURL("image/png"),
        "PNG",
        margin,
        currentY,
        contentWidth,
        answerHeight,
      );

      pdf.save(`${quizTitle.replace(/[^a-z0-9]/gi, "_")}_answer_key.pdf`);
      setRetryCount(0);
    } catch (err) {
      console.error("Answer key download error:", err);
      setError(err.message || "Failed to download the answer key");
    } finally {
      setIsDownloadingAnswerKey(false);
    }
  };

  if (isLoading) {
    return (
      <div className="lightbox-bg fixed inset-0 z-60 overflow-hidden bg-gray-100">
        <div className="flex h-screen items-center justify-center">
          <div className="rounded-lg bg-white p-8">
            <div className="mb-4 text-center">
              <div className="loader mx-auto"></div>
            </div>
            <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">
              Loading Quiz Data
            </h3>
            <p className="text-center text-gray-600">Preparing worksheet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !error.includes("Retrying")) {
    return (
      <div className="lightbox-bg fixed inset-0 z-60 overflow-hidden bg-gray-100">
        <div className="flex h-screen items-center justify-center">
          <div className="rounded-lg bg-white p-8">
            <div className="mb-4 text-center text-red-600">
              <i className="bx bx-error-circle text-4xl"></i>
            </div>
            <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">
              Error Loading Preview
            </h3>
            <p className="mb-4 text-center text-gray-600">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setError(null);
                  navigate(-1);
                }}
                className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentFontSize = fontSizeMap[fontSize] || 16;

  return (
    <div className="outfit -mx-2 mt-10 flex min-h-screen flex-col">
      {/* Settings Bar */}
      <div className="border-color fixed top-0 z-10 mt-10 flex w-full items-center space-x-6 border-b bg-white px-8 py-[6px] text-sm lg:mt-0">
        <button
          onClick={() => navigate(-1)}
          className="mr-5 -ml-5 flex cursor-pointer items-center justify-center rounded-2xl p-2 hover:bg-gray-100"
          aria-label="Go back"
        >
          <i className="bx bx-arrow-left-stroke text-[30px] leading-none"></i>
        </button>
        <span className="-ml-5 text-[16px] font-semibold text-gray-900">
          Back
        </span>

        <div className="ml-10 hidden items-center space-x-2 min-[870px]:flex">
          <span className="text-[14px] text-gray-900">Font size</span>
          {["S", "M", "L", "XL"].map((size) => (
            <button
              key={size}
              className={`flex-1 cursor-pointer rounded-lg border p-[3px] text-sm font-bold focus:border-orange-500 focus:outline-none ${
                fontSize === size
                  ? "border-orange-500 bg-orange-100 text-orange-500"
                  : "border-color bg-white text-gray-700 hover:bg-gray-100"
              }`}
              style={{ minWidth: 30 }}
              onClick={() => setFontSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
        <div className="hidden items-center space-x-2 min-[870px]:flex">
          <span className="text-[14px] text-gray-900">Image size</span>
          {["S", "M", "L", "XL"].map((size) => (
            <button
              key={size}
              className={`flex-1 cursor-pointer rounded-lg border p-[3px] text-sm font-bold focus:border-orange-500 focus:outline-none ${
                imageSize === size
                  ? "border-orange-500 bg-orange-100 text-orange-500"
                  : "border-color bg-white text-gray-700 hover:bg-gray-100"
              }`}
              style={{ minWidth: 30 }}
              onClick={() => setImageSize(size)}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="ml-2 hidden h-8 w-px bg-gray-300 min-[870px]:flex" />

        <div className="ml-2 hidden items-center space-x-[10px] min-[870px]:flex">
          <button
            type="button"
            onClick={handleShuffleQuestionsClick}
            className="cursor-pointer rounded-lg border border-gray-300 px-3 py-[5px] text-[14px] font-medium text-gray-900 hover:border-orange-500 hover:bg-orange-50"
          >
            Shuffle questions
          </button>
          <button
            type="button"
            onClick={handleShuffleChoicesClick}
            className="cursor-pointer rounded-lg border border-gray-300 px-3 py-[5px] text-[14px] font-medium text-gray-900 hover:border-orange-500 hover:bg-orange-50"
          >
            Shuffle choices
          </button>
        </div>

        <div className="mt-[2px] -mr-5 ml-auto flex min-[870px]:hidden">
          <button
            ref={settingsButtonRef}
            onClick={() => setShowSettings((v) => !v)}
            className="border-color flex cursor-pointer items-center gap-1 rounded-xl border px-[10px] py-[6px] text-sm font-medium transition duration-100 hover:bg-gray-100"
          >
            <i className="bx bx-cog text-[14px]"></i>
            <span>Settings</span>
            <i className="bx bx-chevron-down text-[18px]"></i>
          </button>
        </div>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="outfit lightbox-bg fixed inset-0 z-100 flex items-end justify-center min-[1150px]:hidden">
          <div
            ref={settingsDropdownRef}
            className="animate-fade-in-up w-full rounded-t-2xl bg-white py-3 shadow-lg"
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="px-4">
                  <h2 className="text-[16px] font-semibold sm:text-[14px]">
                    Quiz Worksheet Settings
                  </h2>
                </div>
                <div className="h-[0.5px] w-full bg-gray-300" />
                <div className="flex flex-col space-y-2 px-5">
                  <button
                    type="button"
                    onClick={handleShuffleQuestionsClick}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-left text-[14px] font-medium text-gray-700 hover:border-orange-500 hover:bg-orange-50"
                  >
                    Shuffle questions
                  </button>
                  <button
                    type="button"
                    onClick={handleShuffleChoicesClick}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-left text-[14px] font-medium text-gray-700 hover:border-orange-500 hover:bg-orange-50"
                  >
                    Shuffle choices
                  </button>
                </div>
              </div>

              <div className="mx-5 h-[1px] bg-gray-300" />

              <div className="space-y-2 px-5">
                <h3 className="text-[14px] text-gray-700">Font size</h3>
                <div className="flex space-x-2">
                  {["S", "M", "L", "XL"].map((size) => (
                    <button
                      key={size}
                      className={`flex-1 rounded border px-2 py-1 text-sm font-bold focus:border-orange-500 focus:outline-none ${
                        fontSize === size
                          ? "border-orange-500 bg-orange-100 text-orange-500"
                          : "border-color bg-white text-gray-700"
                      }`}
                      onClick={() => setFontSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 px-5">
                <h3 className="text-[14px] text-gray-700">Image size</h3>
                <div className="flex space-x-2">
                  {["S", "M", "L", "XL"].map((size) => (
                    <button
                      key={size}
                      className={`flex-1 rounded border px-2 py-1 text-sm font-bold focus:border-orange-500 focus:outline-none ${
                        imageSize === size
                          ? "border-orange-500 bg-orange-100 text-orange-500"
                          : "border-color bg-white text-gray-700"
                      }`}
                      onClick={() => setImageSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Row */}
      <div
        className="mt-10 mb-20 flex flex-1 pb-20 lg:mb-0"
        style={{
          maxWidth: "100%",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <div
          className="flex w-full flex-1 flex-col items-center justify-center overflow-x-auto px-4 py-8 min-[1200px]:mr-96 md:mr-80 lg:mr-96"
          style={{
            zoom: zoom,
            transition: "zoom 0.2s",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <div
            className="w-full max-w-4xl md:max-w-[calc(100vw-22rem)] lg:mx-auto lg:w-[210mm]"
            style={{
              fontFamily:
                "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
              width: "100%",
              maxWidth: "100%",
            }}
          >
            <style>{`
              @page {
                size: A4;
                margin: 1cm 0.8cm;
              }
              
              /* Override oklch colors from Tailwind CSS v4 - html2canvas cannot parse oklch() */
              .pdf-preview, .pdf-preview * {
                --tw-ring-color: transparent !important;
                --tw-ring-offset-color: transparent !important;
                --tw-shadow-color: transparent !important;
                --tw-gradient-from: #000 !important;
                --tw-gradient-to: #fff !important;
                --tw-divide-color: #e5e7eb !important;
                --tw-border-color: #e5e7eb !important;
                border-color: #e5e7eb !important;
                outline-color: transparent !important;
                text-decoration-color: currentColor !important;
                caret-color: auto !important;
                accent-color: auto !important;
                box-shadow: none !important;
              }
              
              .pdf-preview {
                width: 210mm;
                margin: 0 auto;
                background: white !important;
                box-shadow: 0 0 10px rgba(0,0,0,0.1) !important;
                position: relative;
                font-family: 'Times New Roman', Times, serif !important;
                color: #000 !important;
              }
              
              .question-container {
                page-break-inside: avoid;
                break-inside: avoid;
                margin-bottom: 1rem;
                padding: 0.5rem 0;
                font-family: 'Times New Roman', Times, serif !important;
                min-height: fit-content;
                display: block;
              }
              
              .a4-page {
                width: 210mm;
                margin: 0 auto;
                padding: 10mm 8mm;
                background: white !important;
                border: none !important;
                position: relative;
                box-sizing: border-box;
                font-family: 'Times New Roman', Times, serif !important;
                box-shadow: none !important;
              }
              
              .pdf-text {
                font-family: 'Times New Roman', Times, serif !important;
                font-size: ${currentFontSize}px !important;
                line-height: 1.4 !important;
                color: #000 !important;
                margin: 0;
                padding: 0;
              }
              
              .pdf-header {
                font-family: 'Times New Roman', Times, serif !important;
                line-height: 1.2 !important;
                color: #000 !important;
                margin: 0;
                padding: 0;
              }
              
              .pdf-choice {
                font-family: 'Times New Roman', Times, serif !important;
                font-size: ${currentFontSize}px !important;
                line-height: 1.3 !important;
                color: #000 !important;
                margin: 0;
                padding: 0;
              }
            `}</style>
            <div className="pdf-preview w-full">
              <div className="space-y-2">
                <div className="a4-page">
                  {/* Header with logos */}
                  <div className="exam-header flex items-center justify-between px-8 pb-6">
                    <div className="flex w-32 flex-col items-center">
                      <img
                        src={univLogo}
                        alt="Left Logo"
                        className="mb-1 size-[70px] md:size-[80px]"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                      <span
                        className="pdf-header mt-1 text-center text-[10.33px] tracking-widest text-black"
                        style={{
                          fontFamily:
                            "'Calibri', 'Calibri Body', Arial, Helvetica, sans-serif",
                        }}
                      >
                        JRMSU-COE-027
                      </span>
                    </div>

                    <div className="flex-1 text-center">
                      <div className="pdf-header text-[13.33px] leading-tight font-normal">
                        Republic of the Philippines
                      </div>
                      <div className="pdf-header text-[16px] leading-tight font-extrabold tracking-tight uppercase">
                        JOSE RIZAL MEMORIAL STATE UNIVERSITY
                      </div>
                      <div className="pdf-header text-[13.33px] leading-tight font-light italic">
                        The Premiere University in Zamboanga del Norte
                      </div>
                      <div className="pdf-header mt-2 text-[18.67px] leading-tight font-extrabold uppercase">
                        COLLEGE OF ENGINEERING
                      </div>
                      <div className="pdf-header mt-2 text-[13.33px] leading-tight font-extrabold uppercase">
                        {quizTitle.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex w-32 flex-col items-center">
                      <img
                        src={collegeLogo}
                        alt="Right Logo"
                        className="mt-1 mb-1 size-[70px] md:size-[80px]"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                      <span
                        className="invisible mt-1 text-[10.33px] tracking-widest text-black"
                        style={{
                          fontFamily:
                            "'Calibri', 'Calibri Body', Arial, Helvetica, sans-serif",
                        }}
                      >
                        PLACEHOLDER
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                  {quizInstructions && (
                    <div className="exam-instructions px-4 pb-4">
                      <p className="pdf-text">
                        <span className="font-semibold">Instructions: </span>
                        {quizInstructions}
                      </p>
                    </div>
                  )}

                  {/* Questions */}
                  <div className="mt-4 space-y-4">
                    {displayedQuestions.map((question, index) => (
                      <div key={index} className="question-container">
                        <div className="pdf-text flex items-start">
                          <span className="mr-2 min-w-[2ch]">{index + 1}.</span>
                          <span className="break-words">
                            {stripHtml(question.questionText)}
                          </span>
                        </div>
                        {question.questionImage && (
                          <div className="mt-2">
                            <img
                              src={getImageSrc(
                                question.questionImage,
                                question.questionImageBase64,
                              )}
                              alt={`Question ${index + 1} image`}
                              style={{
                                maxHeight: imageSizeMap[imageSize],
                                width: "auto",
                                maxWidth: "100%",
                              }}
                              className="rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        {question.choices &&
                          question.choices.length > 0 &&
                          (() => {
                            const allShort = question.choices.every(
                              (choice) =>
                                (stripHtml(choice.choiceText)?.length || 0) < 20 &&
                                !choice.choiceImage,
                            );
                            if (allShort) {
                              const columns = 3;
                              const rows = Math.ceil(
                                question.choices.length / columns,
                              );
                              const gridRows = [];
                              for (let row = 0; row < rows; row++) {
                                const rowChoices = [];
                                for (let col = 0; col < columns; col++) {
                                  const idx = row + col * rows;
                                  if (idx < question.choices.length) {
                                    rowChoices.push(
                                      <div
                                        key={col}
                                        className="flex items-center"
                                      >
                                        <p className="pdf-choice ml-5">
                                          {String.fromCharCode(65 + idx)}.{" "}
                                          {stripHtml(question.choices[idx].choiceText)}
                                        </p>
                                      </div>,
                                    );
                                  } else {
                                    rowChoices.push(<div key={col} />);
                                  }
                                }
                                gridRows.push(
                                  <div
                                    key={row}
                                    className="grid grid-cols-3 gap-x-2 gap-y-0.5"
                                    style={{
                                      pageBreakInside: "avoid",
                                      breakInside: "avoid",
                                    }}
                                  >
                                    {rowChoices}
                                  </div>,
                                );
                              }
                              return <div className="mt-3">{gridRows}</div>;
                            } else {
                              const allHaveImages = question.choices.every(
                                (choice) => !!choice.choiceImage,
                              );
                              if (allHaveImages) {
                                return (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "32px",
                                      alignItems: "flex-start",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {question.choices.map(
                                      (choice, choiceIndex) => (
                                        <div
                                          key={choiceIndex}
                                          style={{
                                            textAlign: "center",
                                            minWidth: 0,
                                            maxWidth: "300px",
                                            flex: "1 1 0",
                                          }}
                                        >
                                          <img
                                            src={getImageSrc(
                                              choice.choiceImage,
                                              choice.choiceImageBase64,
                                            )}
                                            alt={`Choice ${String.fromCharCode(65 + choiceIndex)} image`}
                                            style={{
                                              maxHeight:
                                                imageSizeMap[imageSize],
                                              maxWidth: "300px",
                                              width: "auto",
                                              display: "inline-block",
                                              borderRadius: "0.5rem",
                                            }}
                                            className="rounded-lg"
                                            onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.style.display = "none";
                                            }}
                                          />
                                          <p
                                            className="pdf-choice"
                                            style={{ marginTop: 4 }}
                                          >
                                            {String.fromCharCode(
                                              65 + choiceIndex,
                                            )}
                                            . {stripHtml(choice.choiceText)}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                );
                              } else {
                                return question.choices.map(
                                  (choice, choiceIndex) => (
                                    <div
                                      key={choiceIndex}
                                      className="mb-2 flex items-center gap-4"
                                    >
                                      <div>
                                        <span className="mr-2 ml-5 text-black">
                                          {String.fromCharCode(
                                            65 + choiceIndex,
                                          )}
                                          .
                                        </span>
                                        <span className="pdf-choice">
                                          {stripHtml(choice.choiceText)}
                                        </span>
                                      </div>
                                      {choice.choiceImage && (
                                        <img
                                          src={getImageSrc(
                                            choice.choiceImage,
                                            choice.choiceImageBase64,
                                          )}
                                          alt={`Choice ${String.fromCharCode(65 + choiceIndex)} image`}
                                          style={{
                                            maxHeight: imageSizeMap[imageSize],
                                            width: "auto",
                                            maxWidth: "300px",
                                            borderRadius: "0.5rem",
                                          }}
                                          className="rounded-lg"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      )}
                                    </div>
                                  ),
                                );
                              }
                            }
                          })()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer Key */}
                {quizData?.answerKey && quizData.answerKey.length > 0 && (
                  <div className="answer-key-page-break">
                    <h2 className="pdf-header mb-10 text-center text-2xl font-bold text-black">
                      Answer Key
                    </h2>
                    <div className="pdf-text ml-4" style={{ fontSize: "15px" }}>
                      {(() => {
                        const answers = displayedQuestions.map(
                          (question, idx) => {
                            const correctIdx = question.choices?.findIndex(
                              (c) => c.isCorrect,
                            );
                            const correctLetter =
                              correctIdx !== -1
                                ? String.fromCharCode(65 + correctIdx)
                                : "-";
                            return { number: idx + 1, answer: correctLetter };
                          },
                        );

                        // Calculate how many columns we need (25 answers per column)
                        const answersPerColumn = 25;
                        const numColumns = Math.ceil(
                          answers.length / answersPerColumn,
                        );

                        const columns = [];
                        for (let col = 0; col < numColumns; col++) {
                          const columnAnswers = [];
                          for (let row = 0; row < answersPerColumn; row++) {
                            const answerIndex = col * answersPerColumn + row;
                            if (answerIndex < answers.length) {
                              columnAnswers.push(answers[answerIndex]);
                            }
                          }
                          columns.push(columnAnswers);
                        }

                        return (
                          <div className="flex gap-8">
                            {columns.map((column, colIndex) => (
                              <div key={colIndex} className="flex flex-col">
                                {column.map((item) => (
                                  <div
                                    key={item.number}
                                    className="mb-1 flex items-center"
                                    style={{ minWidth: "60px" }}
                                  >
                                    <span className="mr-2 font-medium">
                                      {item.number}.
                                    </span>
                                    <span>{item.answer}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden PDF Content Container */}
      <div
        ref={pdfContentRef}
        className="fixed top-0 -left-[9999px] w-full max-w-4xl lg:mx-auto lg:w-[210mm]"
        style={{
          fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <style>{`
          @page {
            size: A4;
            margin: 1cm 0.8cm;
          }
          
          .pdf-preview {
            width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            font-family: 'Times New Roman', Times, serif !important;
          }
          
          .question-container {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 1rem;
            padding: 0.5rem 0;
            font-family: 'Times New Roman', Times, serif !important;
            min-height: fit-content;
            display: block;
          }
          
          .a4-page {
            width: 210mm;
            margin: 0 auto;
            padding: 10mm 8mm;
            background: white;
            border: none;
            position: relative;
            box-sizing: border-box;
            font-family: 'Times New Roman', Times, serif !important;
            box-shadow: none;
          }
          
          .pdf-text {
            font-family: 'Times New Roman', Times, serif !important;
            font-size: ${currentFontSize}px !important;
            line-height: 1.4 !important;
            color: #000 !important;
            margin: 0;
            padding: 0;
          }
          
          .pdf-header {
            font-family: 'Times New Roman', Times, serif !important;
            line-height: 1.2 !important;
            color: #000 !important;
            margin: 0;
            padding: 0;
          }
          
          .pdf-choice {
            font-family: 'Times New Roman', Times, serif !important;
            font-size: ${currentFontSize}px !important;
            line-height: 1.3 !important;
            color: #000 !important;
            margin: 0;
            padding: 0;
          }
          
          .answer-key-page-break {
            margin-top: 2rem;
            padding-top: 2rem;
            background: white;
            width: 210mm;
            margin-left: auto;
            margin-right: auto;
            padding: 2rem;
            border-radius: 8px;
            font-family: 'Times New Roman', Times, serif !important;
            border-top: 2px solid #e5e7eb;
          }
        `}</style>
        <div className="pdf-preview w-full">
          <div className="space-y-2">
            <div className="a4-page">
              <div className="exam-header flex items-center justify-between px-8 pb-2">
                <div className="flex w-32 flex-col items-center">
                  <img
                    src={univLogo}
                    alt="Left Logo"
                    className="mb-1 size-[70px] md:size-[80px]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                  <span
                    className="pdf-header mt-1 text-center text-[10.33px] tracking-widest text-black"
                    style={{
                      fontFamily:
                        "'Calibri', 'Calibri Body', Arial, Helvetica, sans-serif",
                    }}
                  >
                    JRMSU-COE-027
                  </span>
                </div>

                <div className="flex-1 text-center">
                  <div className="pdf-header text-[13.33px] leading-tight font-normal">
                    Republic of the Philippines
                  </div>
                  <div className="pdf-header text-[16px] leading-tight font-extrabold tracking-tight uppercase">
                    JOSE RIZAL MEMORIAL STATE UNIVERSITY
                  </div>
                  <div className="pdf-header text-[13.33px] leading-tight font-light italic">
                    The Premiere University in Zamboanga del Norte
                  </div>
                  <div className="pdf-header mt-2 text-[18.67px] leading-tight font-extrabold uppercase">
                    COLLEGE OF ENGINEERING
                  </div>
                  <div className="pdf-header mt-2 text-[13.33px] leading-tight font-extrabold uppercase">
                    {quizTitle.toUpperCase()}
                  </div>
                </div>

                <div className="flex w-32 flex-col items-center">
                  <img
                    src={collegeLogo}
                    alt="Right Logo"
                    className="mt-1 mb-1 size-[70px] md:size-[80px]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                  <span
                    className="invisible mt-1 text-[10.33px] tracking-widest text-black"
                    style={{
                      fontFamily:
                        "'Calibri', 'Calibri Body', Arial, Helvetica, sans-serif",
                    }}
                  >
                    PLACEHOLDER
                  </span>
                </div>
              </div>

              {quizInstructions && (
                <div className="exam-instructions px-4 pb-1">
                  <p className="pdf-text">
                    <span className="font-semibold">Instructions: </span>
                    {quizInstructions}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {displayedQuestions.map((question, index) => (
                  <div key={index} className="question-container">
                    <div className="pdf-text flex items-start">
                      <span className="mr-2 min-w-[2ch]">{index + 1}.</span>
                      <span className="break-words">
                        {stripHtml(question.questionText)}
                      </span>
                    </div>
                    {question.questionImage && (
                      <div className="mt-2">
                        <img
                          src={getImageSrc(
                            question.questionImage,
                            question.questionImageBase64,
                          )}
                          alt={`Question ${index + 1} image`}
                          style={{
                            maxHeight: imageSizeMap[imageSize],
                            width: "auto",
                            maxWidth: "100%",
                          }}
                          className="rounded-lg"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    {question.choices &&
                      question.choices.length > 0 &&
                      (() => {
                        const allShort = question.choices.every(
                          (choice) =>
                            (stripHtml(choice.choiceText)?.length || 0) < 20 &&
                            !choice.choiceImage,
                        );
                        if (allShort) {
                          const columns = 3;
                          const rows = Math.ceil(
                            question.choices.length / columns,
                          );
                          const gridRows = [];
                          for (let row = 0; row < rows; row++) {
                            const rowChoices = [];
                            for (let col = 0; col < columns; col++) {
                              const idx = row + col * rows;
                              if (idx < question.choices.length) {
                                rowChoices.push(
                                  <div key={col} className="flex items-center">
                                    <p className="pdf-choice ml-5">
                                      {String.fromCharCode(65 + idx)}.{" "}
                                      {stripHtml(question.choices[idx].choiceText)}
                                    </p>
                                  </div>,
                                );
                              } else {
                                rowChoices.push(<div key={col} />);
                              }
                            }
                            gridRows.push(
                              <div
                                key={row}
                                className="grid grid-cols-3 gap-x-2 gap-y-0.5"
                                style={{
                                  pageBreakInside: "avoid",
                                  breakInside: "avoid",
                                }}
                              >
                                {rowChoices}
                              </div>,
                            );
                          }
                          return <div className="mt-3">{gridRows}</div>;
                        } else {
                          const allHaveImages = question.choices.every(
                            (choice) => !!choice.choiceImage,
                          );
                          if (allHaveImages) {
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "32px",
                                  alignItems: "flex-start",
                                  flexWrap: "wrap",
                                }}
                              >
                                {question.choices.map((choice, choiceIndex) => (
                                  <div
                                    key={choiceIndex}
                                    style={{
                                      textAlign: "center",
                                      minWidth: 0,
                                      maxWidth: "300px",
                                      flex: "1 1 0",
                                    }}
                                  >
                                    <img
                                      src={getImageSrc(
                                        choice.choiceImage,
                                        choice.choiceImageBase64,
                                      )}
                                      alt={`Choice ${String.fromCharCode(65 + choiceIndex)} image`}
                                      style={{
                                        maxHeight: imageSizeMap[imageSize],
                                        maxWidth: "300px",
                                        width: "auto",
                                        display: "inline-block",
                                        borderRadius: "0.5rem",
                                      }}
                                      className="rounded-lg"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                      }}
                                    />
                                    <p
                                      className="pdf-choice"
                                      style={{ marginTop: 4 }}
                                    >
                                      {String.fromCharCode(65 + choiceIndex)}.{" "}
                                      {stripHtml(choice.choiceText)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            return question.choices.map(
                              (choice, choiceIndex) => (
                                <div
                                  key={choiceIndex}
                                  className="mb-2 flex items-center gap-4"
                                >
                                  <div>
                                    <span className="mr-2 ml-5 text-black">
                                      {String.fromCharCode(65 + choiceIndex)}.
                                    </span>
                                    <span className="pdf-choice">
                                      {stripHtml(choice.choiceText)}
                                    </span>
                                  </div>
                                  {choice.choiceImage && (
                                    <img
                                      src={getImageSrc(
                                        choice.choiceImage,
                                        choice.choiceImageBase64,
                                      )}
                                      alt={`Choice ${String.fromCharCode(65 + choiceIndex)} image`}
                                      style={{
                                        maxHeight: imageSizeMap[imageSize],
                                        width: "auto",
                                        maxWidth: "300px",
                                        borderRadius: "0.5rem",
                                      }}
                                      className="rounded-lg"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  )}
                                </div>
                              ),
                            );
                          }
                        }
                      })()}
                  </div>
                ))}
              </div>
            </div>

            {quizData?.answerKey && quizData.answerKey.length > 0 && (
              <div className="answer-key-page-break">
                <h2 className="pdf-header mb-10 text-center text-2xl font-bold text-black">
                  Answer Key
                </h2>
                <div className="pdf-text ml-4" style={{ fontSize: "15px" }}>
                  {(() => {
                    const answers = displayedQuestions.map((question, idx) => {
                      const correctIdx = question.choices?.findIndex(
                        (c) => c.isCorrect,
                      );
                      const correctLetter =
                        correctIdx !== -1
                          ? String.fromCharCode(65 + correctIdx)
                          : "-";
                      return { number: idx + 1, answer: correctLetter };
                    });

                    const answersPerColumn = 25;
                    const numColumns = Math.ceil(
                      answers.length / answersPerColumn,
                    );

                    const columns = [];
                    for (let col = 0; col < numColumns; col++) {
                      const columnAnswers = [];
                      for (let row = 0; row < answersPerColumn; row++) {
                        const answerIndex = col * answersPerColumn + row;
                        if (answerIndex < answers.length) {
                          columnAnswers.push(answers[answerIndex]);
                        }
                      }
                      columns.push(columnAnswers);
                    }

                    return (
                      <div className="flex gap-8">
                        {columns.map((column, colIndex) => (
                          <div key={colIndex} className="flex flex-col">
                            {column.map((item) => (
                              <div
                                key={item.number}
                                className="mb-1 flex items-center"
                                style={{ minWidth: "60px" }}
                              >
                                <span className="mr-2 font-medium">
                                  {item.number}.
                                </span>
                                <span>{item.answer}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="border-color fixed right-0 bottom-0 left-0 z-9 flex h-auto w-full flex-col rounded-t-3xl border-t bg-white p-4 min-[1200px]:top-[48px] min-[1200px]:right-0 min-[1200px]:bottom-auto min-[1200px]:left-auto min-[1200px]:h-[calc(100vh-48px)] min-[1200px]:w-96 min-[1200px]:rounded-none min-[1200px]:border-l min-[1200px]:p-8">
        <div className="mb-1 text-xl font-bold min-[1200px]:text-[18px]">
          {quizTitle}
        </div>
        <div className="mb-4 text-[14px] text-gray-600 min-[1200px]:flex min-[1200px]:flex-col min-[1200px]:items-start min-[1200px]:justify-start">
          <span className="mb-1 flex items-center justify-start">
            <i className="bx bx-list-ul mr-1 text-[18px]"></i>
            {questionCount} questions
          </span>
        </div>

        <span className="mb-1 text-[14px] font-medium text-gray-700 min-[1200px]:mt-4">
          Download:
        </span>

        <div className="flex flex-row space-x-2">
          <button
            className="flex-1 cursor-pointer rounded-lg bg-orange-500 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-orange-600"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? "Downloading..." : "Worksheet"}
          </button>
          {quizData?.answerKey && quizData.answerKey.length > 0 && (
            <button
              className="flex-1 cursor-pointer rounded-md border border-orange-500 py-2 text-[14px] font-semibold text-orange-500 transition-colors hover:bg-orange-200"
              onClick={handleDownloadAnswerKey}
              disabled={isDownloadingAnswerKey}
            >
              {isDownloadingAnswerKey ? "Downloading..." : "Answer Key"}
            </button>
          )}
        </div>

        <div className="mt-3 hidden items-start text-[12px] text-gray-600 min-[1200px]:flex">
          <span>Download the quiz worksheet or the answer key for review.</span>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="fixed right-4 bottom-20 z-50 hidden gap-2 min-[1200px]:right-[calc(24rem+20px)] min-[1200px]:bottom-4 min-[1200px]:flex min-[1200px]:flex-row">
        <button
          className="flex cursor-pointer items-center justify-center rounded bg-gray-800 p-2 text-white shadow hover:bg-gray-700"
          onClick={() => setZoom(1)}
        >
          <i className="bx bx-rotate-ccw text-[18px] leading-none"></i>
        </button>
        <button
          className="flex cursor-pointer items-center justify-center rounded bg-gray-800 p-2 text-white shadow hover:bg-gray-700"
          onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
        >
          <i className="bx bx-search-minus text-[18px] leading-none"></i>
        </button>
        <button
          className="flex cursor-pointer items-center justify-center rounded bg-gray-800 p-2 text-white shadow hover:bg-gray-700"
          onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}
        >
          <i className="bx bx-search-plus text-[18px] leading-none"></i>
        </button>
      </div>
    </div>
  );
}
