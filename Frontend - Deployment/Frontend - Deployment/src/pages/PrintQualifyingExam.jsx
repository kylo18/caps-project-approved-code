import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";

function shuffleArray(array) {
  // Fisher-Yates shuffle
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleChoicesKeepNoneAtEnd(choices) {
  if (!choices || choices.length < 2) return choices;
  const idx = choices.findIndex(
    (c) =>
      (typeof c === "string" ? c : c.choiceText)?.toLowerCase() ===
      "none of the above",
  );
  if (idx === -1) return shuffleArray(choices);
  const none = choices[idx];
  const rest = choices.slice(0, idx).concat(choices.slice(idx + 1));
  const shuffled = shuffleArray(rest);
  return [...shuffled, none];
}

export default function PrintQualifyingExam() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examData, examKey, totalItems, subjects, difficultyDistribution } =
    location.state || {};

  // Fallback to original component if no exam data
  const questions = [
    {
      question: "What type of animal is Bambi?",
      options: ["deer", "fox", "lion", "Deer"],
    },
    {
      question: "Which country features a maple leaf on its flag?",
      options: ["Australia", "Ireland", "Canada", "Spain"],
    },
    {
      question: "What game features the terms love, deuce, match and volley?",
      options: ["Hockey", "Soccer", "Tennis", "Basketball"],
    },
  ];

  // Use exam data if available, otherwise use fallback
  const originalQuestions = useRef(examData ? examData.questions : questions);

  const [answerKeys, setAnswerKeys] = useState(false);
  const [fontSize, setFontSize] = useState("L");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAnswerKey, setIsDownloadingAnswerKey] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const modalContentRef = useRef(null);
  const pdfContentRef = useRef(null); // Separate ref for PDF generation
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
  const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1200;

  // Auto-adjust zoom for small screens
  useEffect(() => {
    const adjustZoomForSmallScreens = () => {
      const isSmallScreen = window.innerWidth < 1200;
      const isMediumScreen =
        window.innerWidth >= 768 && window.innerWidth < 1200;

      if (isSmallScreen) {
        const contentWidth = 210; // A4 width in mm
        const screenWidth = window.innerWidth;
        const padding = 32; // 16px on each side (px-4)
        const sidebarWidth = isMediumScreen ? 320 : 0; // 20rem = 320px for md screens
        const availableWidth = screenWidth - padding - sidebarWidth;
        const calculatedZoom = availableWidth / (contentWidth * 3.779527559); // Convert mm to px (1mm = 3.779527559px)
        setZoom(Math.min(calculatedZoom, 1)); // Don't zoom in, only out
      } else {
        setZoom(1); // Reset to normal on larger screens
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

  // Initialize displayed questions with original ordering
  useEffect(() => {
    setDisplayedQuestions(originalQuestions.current);
  }, [examData]);

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
        } else if (q.options) {
          return { ...q, options: shuffleChoicesKeepNoneAtEnd(q.options) };
        }
        return q;
      });
    });
  };

  const questionCount = originalQuestions.current.length;
  const examTitle = examData
    ? "Qualifying Examination"
    : "Qualifying Examination";
  const subjectInfo =
    examData && subjects
      ? subjects.map((s) => s.subjectName).join(", ")
      : "Qualifying Examination";

  // Function to force all oklch colors to safe values before PDF
  const forceSafeColors = (element) => {
    const all = element.querySelectorAll("*");
    for (let el of all) {
      const style = getComputedStyle(el);
      if (style.color && style.color.includes("oklch")) {
        el.style.color = "#222";
      }
      if (style.backgroundColor && style.backgroundColor.includes("oklch")) {
        el.style.backgroundColor = "#fff";
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
            img.onerror = resolve; // resolve even if image fails to load
          }
        }),
    );
    return Promise.all(promises);
  };

  const handleDownload = async () => {
    try {
      setError(null);
      setIsDownloading(true);
      const element = pdfContentRef.current;
      if (!element) throw new Error("Content not found");

      forceSafeColors(element);
      await waitForImagesToLoad(element); // Wait for all images to load

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // Reduced from 20mm to 10mm
      const contentWidth = imgWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      // Get the header section and question containers
      const headerSection = element.querySelector(".exam-header"); // Header with logos
      const questionContainers = element.querySelectorAll(
        ".question-container",
      );
      // const answerKeySection = element.querySelector(".answer-key-page-break"); // REMOVE

      let currentY = margin;
      let currentPage = 0;

      // First, add the header to the first page
      if (headerSection) {
        console.log("Header section found:", headerSection);
        const headerCanvas = await html2canvas(headerSection, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          backgroundColor: "#ffffff",
        });

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

        currentY += headerHeight + 10; // Add 10mm spacing after header
      } else {
        console.log("Header section not found, trying alternative approach");
        // Fallback: capture the entire first page content
        const firstPageContent = element.querySelector(".a4-page");
        if (firstPageContent) {
          const firstPageCanvas = await html2canvas(firstPageContent, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            letterRendering: true,
            backgroundColor: "#ffffff",
          });

          const firstPageHeight =
            (firstPageCanvas.height * contentWidth) / firstPageCanvas.width;

          // Check if this fits on one page
          if (firstPageHeight <= contentHeight) {
            pdf.addImage(
              firstPageCanvas.toDataURL("image/png"),
              "PNG",
              margin,
              margin,
              contentWidth,
              firstPageHeight,
            );
            currentY = margin + firstPageHeight + 10;
          } else {
            // If it doesn't fit, we'll need to handle it differently
            console.log("First page content too large, processing separately");
          }
        }
      }

      // Process each question container
      for (let i = 0; i < questionContainers.length; i++) {
        const questionContainer = questionContainers[i];

        // Capture this question container
        const canvas = await html2canvas(questionContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          backgroundColor: "#ffffff",
        });

        const questionHeight = (canvas.height * contentWidth) / canvas.width;

        // Check if this question would fit on current page
        if (currentY + questionHeight > contentHeight && currentY > margin) {
          // Add new page
          pdf.addPage();
          currentPage++;
          currentY = margin;
        }

        // Add the question to the current page
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          margin,
          currentY,
          contentWidth,
          questionHeight,
        );

        currentY += questionHeight + 5; // Add 5mm spacing between questions
      }

      // Do NOT add answer key to worksheet PDF

      pdf.save("qualifying-exam.pdf");
      setRetryCount(0); // Reset retry count on success
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
            "PDF generation failed after multiple attempts. This might be due to large images or complex content. " +
              "Please try reducing the number of questions or images and try again.",
          );
        }
      } else {
        setError(err.message || "Failed to download the exam");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAnswerKey = async () => {
    try {
      setError(null);
      setIsDownloadingAnswerKey(true);
      const element = pdfContentRef.current;
      if (!element) throw new Error("Content not found");

      forceSafeColors(element);
      await waitForImagesToLoad(element);

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = imgWidth - margin * 2;

      // Get the header section and answer key
      const headerSection = element.querySelector(".exam-header");
      const answerKeySection = element.querySelector(".answer-key-page-break");

      if (!answerKeySection) {
        throw new Error("Answer key not found");
      }

      let currentY = margin;

      // Add header to first page
      if (headerSection) {
        const headerCanvas = await html2canvas(headerSection, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          backgroundColor: "#ffffff",
        });

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

        currentY += headerHeight + 10; // Add 10mm spacing after header
      }

      // Add answer key on the same page
      const answerCanvas = await html2canvas(answerKeySection, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
      });

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

      pdf.save("answer-key.pdf");
      setRetryCount(0);
    } catch (err) {
      console.error("Answer key download error:", err);
      setError(err.message || "Failed to download the answer key");
    } finally {
      setIsDownloadingAnswerKey(false);
    }
  };

  if (error) {
    return (
      <div className="lightbox-bg fixed inset-0 z-60 overflow-hidden bg-gray-100">
        <div className="flex h-screen items-center justify-center">
          <div className="rounded-lg bg-white p-8">
            <div className="mb-4 text-center text-red-600">
              <i className="bx bx-error-circle text-4xl"></i>
            </div>
            <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">
              {error.includes("Retrying")
                ? "Processing..."
                : "Error Loading Preview"}
            </h3>
            <p className="mb-4 text-center text-gray-600">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setError(null)}
                className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Close
              </button>
              {!error.includes("Retrying") && (
                <button
                  onClick={handleDownload}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the current font size in pixels
  const currentFontSize = fontSizeMap[fontSize] || 16;

  return (
    <div className="outfit -mx-2 mt-10 flex min-h-screen flex-col">
      {/* Settings Bar */}
      <div className="border-color fixed top-0 z-10 mt-10 flex w-full items-center space-x-6 border-b bg-white px-8 py-[6px] text-sm lg:mt-0">
        {/* Back button */}
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

        {/* Font size */}
        <div className="ml-10 hidden items-center space-x-2 min-[870px]:flex">
          <span className="text-[14px] text-gray-900">Font size</span>
          {["S", "M", "L", "XL"].map((size) => (
            <button
              key={size}
              className={`flex-1 cursor-pointer rounded-lg border p-[3px] text-sm font-bold focus:border-orange-500 focus:outline-none ${fontSize === size ? "border-orange-500 bg-orange-100 text-orange-500" : "border-color bg-white text-gray-700 hover:bg-gray-100"}`}
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
              className={`flex-1 cursor-pointer rounded-lg border p-[3px] text-sm font-bold focus:border-orange-500 focus:outline-none ${imageSize === size ? "border-orange-500 bg-orange-100 text-orange-500" : "border-color bg-white text-gray-700 hover:bg-gray-100"}`}
              style={{ minWidth: 30 }}
              onClick={() => setImageSize(size)}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="ml-2 hidden h-8 w-px bg-gray-300 min-[870px]:flex" />

        {/* Toggles */}
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

        {/* Settings Button for smaller screens - move to far right */}
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
              {/* Toggles */}
              <div className="space-y-3">
                <div className="px-4">
                  <h2 className="text-[16px] font-semibold sm:text-[14px]">
                    Qualifying Exam Settings
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

              {/* Font size */}
              <div className="space-y-2 px-5">
                <h3 className="text-[14px] text-gray-700">Font size</h3>
                <div className="flex space-x-2">
                  {["S", "M", "L", "XL"].map((size) => (
                    <button
                      key={size}
                      className={`flex-1 rounded border px-2 py-1 text-sm font-bold focus:border-orange-500 focus:outline-none ${fontSize === size ? "border-orange-500 bg-orange-100 text-orange-500" : "border-color bg-white text-gray-700"}`}
                      onClick={() => setFontSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              {/* Image size */}
              <div className="space-y-2 px-5">
                <h3 className="text-[14px] text-gray-700">Image size</h3>
                <div className="flex space-x-2">
                  {["S", "M", "L", "XL"].map((size) => (
                    <button
                      key={size}
                      className={`flex-1 rounded border px-2 py-1 text-sm font-bold focus:border-orange-500 focus:outline-none ${imageSize === size ? "border-orange-500 bg-orange-100 text-orange-500" : "border-color bg-white text-gray-700"}`}
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
        className="mt-10 mb-20 flex flex-1 pb-35 lg:mb-0"
        style={{
          maxWidth: "100%",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Main Content */}
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
            ref={modalContentRef}
            className="w-full max-w-4xl md:max-w-[calc(100vw-22rem)] lg:mx-auto lg:w-[210mm]"
            style={{
              fontFamily:
                "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
              width: "100%",
              maxWidth: "100%",
            }}
          >
            {/* Style override for PDF export to avoid oklch() errors and page breaks inside elements */}
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
              
              .page-break {
                page-break-before: always;
                break-before: page;
                margin-top: 0;
                padding-top: 0;
              }
              
              .page-break-indicator {
                display: none;
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
              
              .a4-page::before,
              .a4-page::after {
                display: none;
              }
              
              img, .image-container {
                page-break-inside: avoid;
                break-inside: avoid;
                max-width: 100%;
                height: auto;
                display: block;
              }
              
              /* Ensure questions and their content don't break across pages */
              .question-container * {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Prevent orphans and widows */
              .pdf-text {
                orphans: 3;
                widows: 3;
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
              
              /* PDF-specific styles that match jsPDF settings */
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
              
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                
                .pdf-preview {
                  width: 210mm !important;
                  height: 297mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                }
                
                .page-break-indicator {
                  display: none !important;
                }
                
                .a4-page {
                  box-shadow: none !important;
                  border: none !important;
                  margin: 0 !important;
                  padding: 10mm 8mm !important;
                  page-break-before: always;
                  break-before: page;
                }
                
                .a4-page::before,
                .a4-page::after {
                  display: none !important;
                }
                
                .question-container {
                  border: none !important;
                  background: white !important;
                  padding: 0.5rem 0 !important;
                }
                
                .answer-key-page-break {
                  border-radius: 0;
                  margin: 0;
                  padding: 2rem;
                  page-break-before: always;
                  break-before: page;
                }
                
                .modal-content-print {
                  transform: none !important;
                  width: 210mm !important;
                  min-width: 0 !important;
                  max-width: none !important;
                }
                
                .question-container {
                  page-break-inside: avoid;
                  break-inside: avoid;
                }
              }
            `}</style>
            <div className="pdf-preview w-full">
              <div className="space-y-2">
                {/* Header and Questions */}
                <div className="a4-page">
                  {/* Header with logos */}
                  <div className="exam-header flex items-center justify-between px-8 pb-6">
                    {/* Left Logo and code */}
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

                    {/* Centered Text */}
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
                        QUALIFYING EXAMINATION
                      </div>
                    </div>

                    {/* Right Logo (symmetrical to left) */}
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
                      {/* Optional: add a code label here if needed for symmetry */}
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

                  {/* Questions */}
                  <div className="mt-8 space-y-4">
                    {displayedQuestions.map((question, index) => (
                      <div key={index} className="question-container">
                        <div className="pdf-text flex items-start">
                          <span className="mr-2 min-w-[2ch]">{index + 1}.</span>
                          <span
                            className="break-words"
                            dangerouslySetInnerHTML={{
                              __html: question.questionText,
                            }}
                          />
                        </div>
                        {question.questionImage && (
                          <div className="mt-2">
                            <img
                              src={question.questionImage}
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
                                (choice.choiceText?.length || 0) < 20 &&
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
                                          {question.choices[idx].choiceText}
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
                                // Render images in a row if all images are small
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
                                            src={choice.choiceImage}
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
                                            style={{
                                              marginTop: 4,
                                            }}
                                          >
                                            {String.fromCharCode(
                                              65 + choiceIndex,
                                            )}
                                            . {choice.choiceText}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                );
                              } else {
                                // Default layout: stacked
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
                                          {choice.choiceText}
                                        </span>
                                      </div>
                                      {choice.choiceImage && (
                                        <img
                                          src={choice.choiceImage}
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
                <div className="answer-key-page-break">
                  <h2 className="pdf-header mb-10 text-center text-2xl font-bold text-black">
                    Answer Key
                  </h2>
                  <div
                    className="pdf-text ml-4"
                    style={{
                      fontSize: "15px",
                    }}
                  >
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

                      // Calculate how many columns we need (10 answers per column)
                      const answersPerColumn = 25;
                      const numColumns = Math.ceil(
                        answers.length / answersPerColumn,
                      );

                      // Create columns
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden PDF Content Container - No zoom applied */}
      <div
        ref={pdfContentRef}
        className="fixed top-0 -left-[9999px] w-full max-w-4xl lg:mx-auto lg:w-[210mm]"
        style={{
          fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {/* Style override for PDF export to avoid oklch() errors and page breaks inside elements */}
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
          
          .page-break {
            page-break-before: always;
            break-before: page;
            margin-top: 0;
            padding-top: 0;
          }
          
          .page-break-indicator {
            display: none;
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
          
          .a4-page::before,
          .a4-page::after {
            display: none;
          }
          
          img, .image-container {
            page-break-inside: avoid;
            break-inside: avoid;
            max-width: 100%;
            height: auto;
            display: block;
          }
          
          /* Ensure questions and their content don't break across pages */
          .question-container * {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Prevent orphans and widows */
          .pdf-text {
            orphans: 3;
            widows: 3;
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
          
          /* PDF-specific styles that match jsPDF settings */
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
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .pdf-preview {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            
            .page-break-indicator {
              display: none !important;
            }
            
            .a4-page {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 10mm 8mm !important;
              page-break-before: always;
              break-before: page;
            }
            
            .a4-page::before,
            .a4-page::after {
              display: none !important;
            }
            
            .question-container {
              border: none !important;
              background: white !important;
              padding: 0.5rem 0 !important;
            }
            
            .answer-key-page-break {
              border-radius: 0;
              margin: 0;
              padding: 2rem;
              page-break-before: always;
              break-before: page;
            }
            
            .modal-content-print {
              transform: none !important;
              width: 210mm !important;
              min-width: 0 !important;
              max-width: none !important;
            }
            
            .question-container {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        `}</style>
        <div className="pdf-preview w-full">
          <div className="space-y-2">
            {/* Header and Questions */}
            <div className="a4-page">
              {/* Header with logos */}
              <div className="exam-header flex items-center justify-between px-8 pb-6">
                {/* Left Logo and code */}
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

                {/* Centered Text */}
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
                    QUALIFYING EXAMINATION
                  </div>
                </div>

                {/* Right Logo (symmetrical to left) */}
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
                  {/* Optional: add a code label here if needed for symmetry */}
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

              {/* Questions */}
              <div className="mt-8 space-y-4">
                {displayedQuestions.map((question, index) => (
                  <div key={index} className="question-container">
                    <div className="pdf-text flex items-start">
                      <span className="mr-2 min-w-[2ch]">{index + 1}.</span>
                      <span
                        className="break-words"
                        dangerouslySetInnerHTML={{
                          __html: question.questionText,
                        }}
                      />
                    </div>
                    {question.questionImage && (
                      <div className="mt-2">
                        <img
                          src={question.questionImage}
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
                            (choice.choiceText?.length || 0) < 20 &&
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
                                      {question.choices[idx].choiceText}
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
                            // Render images in a row if all images are small
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
                                      src={choice.choiceImage}
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
                                      style={{
                                        marginTop: 4,
                                      }}
                                    >
                                      {String.fromCharCode(65 + choiceIndex)}.{" "}
                                      {choice.choiceText}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            // Default layout: stacked
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
                                      {choice.choiceText}
                                    </span>
                                  </div>
                                  {choice.choiceImage && (
                                    <img
                                      src={choice.choiceImage}
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
            <div className="answer-key-page-break">
              <h2 className="pdf-header mb-10 text-center text-2xl font-bold text-black">
                Answer Key
              </h2>
              <div
                className="pdf-text ml-4"
                style={{
                  fontSize: "15px",
                }}
              >
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

                  // Calculate how many columns we need (10 answers per column)
                  const answersPerColumn = 10;
                  const numColumns = Math.ceil(
                    answers.length / answersPerColumn,
                  );

                  // Create columns
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
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="border-color fixed right-0 bottom-0 left-0 z-9 flex h-auto w-full flex-col rounded-t-3xl border-t bg-white p-4 min-[1200px]:top-[48px] min-[1200px]:right-0 min-[1200px]:bottom-auto min-[1200px]:left-auto min-[1200px]:h-[calc(100vh-48px)] min-[1200px]:w-96 min-[1200px]:rounded-none min-[1200px]:border-l min-[1200px]:p-8">
        <div className="mb-1 text-xl font-bold min-[1200px]:text-[18px]">
          {examTitle}
        </div>
        {/* Summary line: questions and difficulty */}
        <div className="mb-4 text-[14px] text-gray-600 min-[1200px]:flex min-[1200px]:flex-col min-[1200px]:items-start min-[1200px]:justify-start">
          <span className="mb-1 flex items-center justify-start">
            <i className="bx bx-list-ul mr-1 text-[18px]"></i>
            {questionCount} questions
          </span>

          {difficultyDistribution && (
            <div className="flex flex-col items-start gap-1 text-[14px]">
              {/* Easy */}
              <div className="flex items-center gap-2">
                <i className="bx bx-happy-beaming text-[16px] text-green-500" />
                <span>{difficultyDistribution.easy}% easy</span>
              </div>

              {/* Moderate */}
              <div className="flex items-center gap-2">
                <i className="bx bx-smile text-[16px] text-yellow-500" />
                <span>{difficultyDistribution.moderate}% medium</span>
              </div>

              {/* Hard */}
              <div className="flex items-center gap-2">
                <i className="bx bx-meh text-[16px] text-red-500" />
                <span>{difficultyDistribution.hard}% hard</span>
              </div>
            </div>
          )}
        </div>

        {/* Show exam details if available */}
        {examData && (
          <div className="mb-4 hidden space-y-2 text-sm text-gray-700 min-[1200px]:block">
            {subjects && subjects.length > 0 && (
              <div>
                <span className="mb-1 text-[14px] font-medium">Subjects:</span>
                <div className="ml-2">
                  {subjects.map((subject, idx) => (
                    <div key={idx} className="text-[14px]">
                      {subject.subjectCode} - {subject.subjectName} (
                      {subject.percentage}%)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
          <button
            className="flex-1 cursor-pointer rounded-md border border-orange-500 py-2 text-[14px] font-semibold text-orange-500 transition-colors hover:bg-orange-200"
            onClick={handleDownloadAnswerKey}
            disabled={isDownloadingAnswerKey}
          >
            {isDownloadingAnswerKey ? "Downloading..." : " Answer Key"}
          </button>
        </div>

        <div className="mt-3 hidden items-start text-[12px] text-gray-600 min-[1200px]:flex">
          <span>
            You may choose to download the qualifying exam worksheet, or
            alternatively, download the corresponding answer key to review or
            check the exam results.
          </span>
        </div>
      </div>
      {/* Zoom Controls beside sidebar */}
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
