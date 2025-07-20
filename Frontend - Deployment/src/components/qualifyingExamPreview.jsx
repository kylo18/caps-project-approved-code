import React, { useEffect, useState, useRef } from "react";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import html2pdf from "html2pdf.js";

export default function ExamPreviewModal({ previewData, onClose, loading }) {
  const [scale, setScale] = useState(1);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const PAGE_WIDTH = 793.7; // 210mm in px at 96dpi
  const modalContentRef = useRef(null);

  useEffect(() => {
    // Validate preview data
    if (!previewData) {
      setError("No preview data available");
      return;
    }

    // Support both new and old structures
    if (Array.isArray(previewData.questions)) {
      if (previewData.questions.length === 0) {
        setError("No questions available in the preview");
        return;
      }
    } else if (previewData.questionsBySubject) {
      const hasQuestions = Object.values(previewData.questionsBySubject).some(
        (subject) => subject.questions && subject.questions.length > 0,
      );
      if (!hasQuestions) {
        setError("No questions available in the preview");
        return;
      }
    } else {
      setError("Invalid preview data structure");
      return;
    }

    setError(null);
  }, [previewData]);

  useEffect(() => {
    function handleResize() {
      const screenWidth = window.innerWidth - 32; // account for modal padding
      const newScale = screenWidth < PAGE_WIDTH ? screenWidth / PAGE_WIDTH : 1;
      setScale(newScale < 0.6 ? 0.6 : newScale);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Handle Ctrl+A to select only modal content
    function handleCtrlA(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        if (modalContentRef.current) {
          e.preventDefault();
          const selection = window.getSelection();
          selection.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(modalContentRef.current);
          selection.addRange(range);
        }
      }
    }
    document.addEventListener("keydown", handleCtrlA);
    return () => document.removeEventListener("keydown", handleCtrlA);
  }, []);

  // Brute-force fix: force all oklch colors to safe values before PDF
  function forceSafeColors(element) {
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
  }

  const handleDownload = async () => {
    try {
      setError(null);
      const element = modalContentRef.current;
      if (!element) throw new Error("Content not found");
      forceSafeColors(element);
      await waitForImagesToLoad(element); // Wait for all images to load
      await html2pdf()
        .set({
          html2canvas: {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            letterRendering: true,
          },
          jsPDF: {
            unit: "pt",
            format: "a4",
            orientation: "portrait",
          },
          filename: "qualifying-exam.pdf",
        })
        .from(element)
        .save();
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Download error:", err);
      if (err.message.includes("Failed to generate PDF")) {
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
    }
  };

  // Helper to wait for all images in the modal to load
  function waitForImagesToLoad(container) {
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
  }

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    handleDownload();
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
                  onClick={handleRetry}
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

  if (
    !previewData ||
    (!previewData.questionsBySubject && !previewData.questions)
  )
    return null;

  // Helper to get questions in the correct order
  let questions = [];
  if (Array.isArray(previewData.questions)) {
    questions = previewData.questions;
  } else if (previewData.questionsBySubject) {
    // fallback for old structure: flatten and preserve order by subject
    questions = Object.values(previewData.questionsBySubject).flatMap(
      (subject) => subject.questions || [],
    );
  }

  return (
    <div className="lightbox-bg fixed inset-0 z-60 overflow-hidden bg-gray-100">
      {/* Fixed Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-1 right-2 z-70 flex h-10 w-10 cursor-pointer items-center justify-center text-white hover:text-gray-200 focus:outline-none md:top-2 md:right-8"
        aria-label="Close"
      >
        <span className="text-2xl">&#10005;</span>
      </button>
      {/* Fixed Download Button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={`fixed right-8 bottom-4 z-70 flex items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${
          loading
            ? "cursor-not-allowed bg-gray-500"
            : "cursor-pointer bg-orange-500 hover:bg-orange-700 hover:text-white"
        }`}
      >
        <i className="bx bx-arrow-in-down-square-half mr-2 text-xl"></i>
        {loading ? (
          <div className="flex items-center justify-center">
            <span className="loader-white"></span>
          </div>
        ) : (
          "Download PDF"
        )}
      </button>
      {/* Floating progress bar when downloading */}
      {loading && (
        <>
          <div className="fixed top-4 right-4 z-[100] flex flex-col items-end">
            <div className="flex min-w-[160px] items-center rounded border border-gray-300 bg-white px-4 py-2">
              <span className="mr-3 text-xs font-semibold text-gray-700">
                Downloading...
              </span>
              <div className="relative h-2 w-24 overflow-hidden rounded bg-gray-200">
                <div className="animate-progress-bar absolute top-0 left-0 h-2 w-1/3 rounded bg-orange-500" />
              </div>
            </div>
          </div>
          <style>{`
            @keyframes progress-bar {
              0% { left: -33%; }
              100% { left: 100%; }
            }
            .animate-progress-bar {
              animation: progress-bar 1.2s linear infinite;
            }
          `}</style>
        </>
      )}
      {/* Spinner CSS */}
      <style>{`
        .loader {
          display: inline-block;
          width: 1.1em;
          height: 1.1em;
          border: 2.5px solid #fff;
          border-radius: 50%;
          border-top: 2.5px solid #f97316;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="flex h-screen min-h-screen items-start justify-center overflow-y-auto p-10">
        <div
          ref={modalContentRef}
          className="modal-content-print mx-auto inline-block w-[210mm] transform overflow-hidden bg-white text-left align-bottom transition-all"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            minWidth: 700,
            fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
          }}
        >
          <div className="bg-white">
            {/* Style override for PDF export to avoid oklch() errors and page breaks inside elements */}
            <style>{`
              @page {
                margin: 2cm 1.5cm;
              }
              img, .image-container {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .answer-key-page-break {
                page-break-before: always;
                break-before: page;
                margin-top: 32px;
                background: white;
                min-height: 297mm;
                width: 210mm;
                margin-left: auto;
                margin-right: auto;
                padding: 2rem;
                border-radius: 8px;
              }
              @media print {
                .answer-key-page-break {
                  border-radius: 0;
                  margin: 0;
                  page-break-before: always;
                  break-before: page;
                }
                .modal-content-print {
                  transform: none !important;
                  width: 210mm !important;
                  min-width: 0 !important;
                  max-width: none !important;
                }
              }
            `}</style>
            <div className="pdf-preview w-full">
              {/* Header with logos */}
              <div className="flex items-center justify-between px-8 pt-6 pb-6">
                {/* Left Logo and code */}
                <div className="flex w-32 flex-col items-center">
                  {previewData.logos?.left && (
                    <img
                      src={univLogo}
                      alt="Left Logo"
                      className="mt-4 ml-5 size-[70px] md:ml-20 md:size-[80px]"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <span
                    className="mt-1 rounded py-0.5 pr-2 pl-7 text-[10.33px] tracking-widest text-nowrap text-black md:ml-15"
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
                  <div className="text-[13.33px] leading-tight font-normal">
                    Republic of the Philippines
                  </div>
                  <div className="text-[16px] leading-tight font-extrabold tracking-tight uppercase">
                    JOSE RIZAL MEMORIAL STATE UNIVERSITY
                  </div>
                  <div className="text-[13.33px] leading-tight font-light italic">
                    The Premiere University in Zamboanga del Norte
                  </div>
                  <div className="mt-2 text-[18.67px] leading-tight font-extrabold uppercase">
                    COLLEGE OF ENGINEERING
                  </div>

                  <div className="mt-2 text-[13.33px] leading-tight font-extrabold uppercase">
                    QUALIFYING EXAMINATION
                  </div>
                </div>
                {/* Right Logo */}
                <div className="flex w-32 flex-col items-center">
                  {previewData.logos?.right && (
                    <img
                      src={collegeLogo}
                      alt="Right Logo"
                      className="-mt-2 mr-5 size-[70px] md:mr-20 md:size-[80px]"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="-mt-15 space-y-2">
                {/* Render all questions in order, not grouped by subject */}
                {questions.map((question, index) => (
                  <div
                    key={index}
                    style={{
                      breakInside: "auto",
                      pageBreakInside: "auto",
                      backgroundColor: "white",
                      padding: "2rem 0",
                      marginTop: "0.5cm",
                      marginBottom: "0.5cm",
                    }}
                  >
                    <div className="rounded p-4">
                      <p
                        className="text-[13.33px] text-black"
                        style={{
                          fontFamily: "'Times New Roman', Times, serif",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: `${index + 1}. ${question.questionText} `,
                        }}
                      />
                      {question.questionImage && (
                        <div className="mt-2">
                          <img
                            src={question.questionImage}
                            alt={`Question ${index + 1} image`}
                            style={{
                              maxHeight: "150px",
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
                                      <p
                                        className="ml-5 text-[13.33px] text-black"
                                        style={{
                                          fontFamily:
                                            "'Times New Roman', Times, serif",
                                        }}
                                      >
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
                                            maxHeight: "120px",
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
                                          className="text-[13.33px] text-black"
                                          style={{
                                            fontFamily:
                                              "'Times New Roman', Times, serif",
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
                                        {String.fromCharCode(65 + choiceIndex)}.
                                      </span>
                                      <span
                                        className="text-[13.33px] text-black"
                                        style={{
                                          fontFamily:
                                            "'Times New Roman', Times, serif",
                                        }}
                                      >
                                        {choice.choiceText}
                                      </span>
                                    </div>
                                    {choice.choiceImage && (
                                      <img
                                        src={choice.choiceImage}
                                        alt={`Choice ${String.fromCharCode(65 + choiceIndex)} image`}
                                        style={{
                                          maxHeight: "120px",
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
                  </div>
                ))}
                {/* Answer Key */}
                <div className="answer-key-page-break">
                  <h2 className="mb-4 text-center text-2xl font-bold text-black">
                    Answer Key
                  </h2>
                  <div
                    className="ml-4"
                    style={{
                      fontFamily: "'Times New Roman', Times, serif",
                      fontSize: "15px",
                    }}
                  >
                    {questions.map((question, idx) => {
                      const correctIdx = question.choices?.findIndex(
                        (c) => c.isCorrect,
                      );
                      const correctLetter =
                        correctIdx !== -1
                          ? String.fromCharCode(65 + correctIdx)
                          : "-";
                      return (
                        <div key={idx} className="mb-1">
                          {idx + 1}. {correctLetter}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Answer Key Page - now INSIDE the main content div */}
              <div
                className="mx-auto inline-block w-[210mm] bg-white text-left align-bottom transition-all"
                style={{
                  minWidth: 700,

                  padding: "2rem",
                  marginTop: "0.5cm",
                  marginBottom: "0.5cm",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
