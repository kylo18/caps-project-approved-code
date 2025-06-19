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

    if (!previewData.questionsBySubject) {
      setError("Invalid preview data structure");
      return;
    }

    // Validate that we have questions
    const hasQuestions = Object.values(previewData.questionsBySubject).some(
      (subject) => subject.questions && subject.questions.length > 0,
    );

    if (!hasQuestions) {
      setError("No questions available in the preview");
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

  const convertImageToBase64 = async (url) => {
    try {
      console.log("Starting image conversion for:", url);

      // Convert HTTP to HTTPS if needed
      const secureUrl = url.replace("http://", "https://");

      // First try: Direct XHR request with credentials
      try {
        const result = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function () {
            if (xhr.status === 200) {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(xhr.response);
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("XHR request failed"));
          xhr.open("GET", secureUrl);
          xhr.responseType = "blob";
          xhr.withCredentials = true;
          xhr.send();
        });
        console.log("Successfully converted via XHR");
        return result;
      } catch (xhrError) {
        console.log("XHR attempt failed:", xhrError);
      }

      // Second try: Fetch with specific headers
      try {
        const response = await fetch(secureUrl, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "image/*, */*",
            Origin: window.location.origin,
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const result = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        console.log("Successfully converted via fetch");
        return result;
      } catch (fetchError) {
        console.log("Fetch attempt failed:", fetchError);
      }

      // Third try: Proxy through your backend
      try {
        // Assuming you have a proxy endpoint at your backend
        const proxyUrl = `${window.location.origin}/api/proxy-image?url=${encodeURIComponent(secureUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (proxyError) {
        console.log("Proxy attempt failed:", proxyError);
        throw new Error(`Failed to load image after all attempts: ${url}`);
      }
    } catch (error) {
      console.error("Fatal error in convertImageToBase64:", {
        error: error,
        errorMessage: error.message,
        errorStack: error.stack,
        url: url,
      });
      return null;
    }
  };

  const handleDownload = async () => {
    try {
      setError(null);
      const element = modalContentRef.current;
      if (!element) throw new Error("Content not found");

      console.log("Starting PDF generation process...");

      // Create a clone of the content to avoid modifying the displayed content
      const clone = element.cloneNode(true);

      // Pre-process all images in the clone
      const images = clone.getElementsByTagName("img");
      console.log("Found images:", images.length);

      // Convert all images to base64
      const imagePromises = Array.from(images).map(async (img, index) => {
        try {
          console.log(
            `Processing image ${index + 1}/${images.length}:`,
            img.src,
          );
          const base64Url = await convertImageToBase64(img.src);

          if (base64Url) {
            img.src = base64Url; // Update image source in clone
            console.log(`Successfully processed image ${index + 1}`);
          } else {
            console.error(`Failed to convert image ${index + 1}`);
            // Optionally remove failed images or replace with placeholder
            img.style.display = "none";
          }
        } catch (err) {
          console.error(`Error processing image ${index + 1}:`, err);
          img.style.display = "none";
        }
      });

      // Wait for all images to be processed
      await Promise.all(imagePromises);
      console.log("All images processed");

      // Generate PDF from the clone
      await html2pdf()
        .set({
          html2canvas: {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            letterRendering: true,
            imageTimeout: 5000,
            logging: true,
          },
          jsPDF: {
            unit: "pt",
            format: "a4",
            orientation: "portrait",
          },
          filename: "qualifying-exam.pdf",
        })
        .from(clone)
        .save();

      setRetryCount(0);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError(`PDF generation failed: ${err.message}`);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    handleDownload();
  };

  if (error) {
    return (
      <div className="lightbox-bg fixed inset-0 z-60 overflow-hidden bg-gray-100">
        <div className="flex h-screen items-center justify-center">
          <div className="rounded-lg bg-white p-8 shadow-xl">
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
                onClick={onClose}
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

  if (!previewData || !previewData.questionsBySubject) return null;

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
        className={`fixed right-8 bottom-4 z-70 flex items-center justify-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-lg transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${
          loading
            ? "cursor-not-allowed bg-gray-500"
            : "cursor-pointer bg-orange-500 hover:bg-orange-700 hover:text-white"
        }`}
      >
        <i className="bx bx-arrow-in-down-square-half mr-2 text-xl"></i>
        {loading ? "Downloading PDF..." : "Download PDF"}
      </button>
      {/* Floating progress bar when downloading */}
      {loading && (
        <>
          <div className="fixed top-4 right-4 z-[100] flex flex-col items-end">
            <div className="flex min-w-[160px] items-center rounded border border-gray-300 bg-white px-4 py-2 shadow-lg">
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
      <div className="flex h-screen min-h-screen items-start justify-center overflow-y-auto p-10">
        <div
          ref={modalContentRef}
          className="mx-auto inline-block w-[210mm] transform overflow-hidden bg-white text-left align-bottom shadow-xl transition-all"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            minWidth: 700,
            fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
          }}
        >
          <div className="bg-white">
            <div className="w-full">
              {/* Header with logos */}
              <div className="flex items-center justify-between px-8 pt-7">
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

                  <div className="mt-6 text-[13.33px] leading-tight font-extrabold uppercase">
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

              <div className="space-y-3">
                {Object.entries(previewData.questionsBySubject).map(
                  ([subjectName, subjectData], subjectIndex) => (
                    <div
                      key={subjectName}
                      style={{
                        minHeight: "297mm", // A4 height
                        pageBreakAfter: "always",
                        position: "relative",
                        backgroundColor: "white",
                        padding: "2rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <h4 className="ml-2 text-[14px] font-medium text-black">
                        {subjectName}
                      </h4>

                      <div className="-space-y-3">
                        {subjectData.questions.map((question, index) => (
                          <div key={index} className="rounded p-4">
                            <p
                              className="text-sm text-black"
                              dangerouslySetInnerHTML={{
                                __html: `${index + 1}. ${question.questionText} (${question.score} pts)`,
                              }}
                            />

                            {question.questionImage && (
                              <div className="mt-2">
                                <img
                                  src={question.questionImage}
                                  alt={`Question ${index + 1} image`}
                                  className="h-40 max-w-full rounded-lg"
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
                                  // Build rows for column-major order
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
                                            <p className="text-sm text-black">
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
                                        className="grid grid-cols-3 gap-x-4 gap-y-1"
                                      >
                                        {rowChoices}
                                      </div>,
                                    );
                                  }
                                  return <div className="mt-3">{gridRows}</div>;
                                } else {
                                  return (
                                    <div className="mt-3 space-y-2">
                                      {question.choices.map(
                                        (choice, choiceIndex) => (
                                          <div key={choiceIndex}>
                                            <p className="text-sm text-black">
                                              {String.fromCharCode(
                                                65 + choiceIndex,
                                              )}
                                              . {choice.choiceText}
                                            </p>
                                            {choice.choiceImage && (
                                              <div className="mt-1 ml-4">
                                                <img
                                                  src={choice.choiceImage}
                                                  alt={`Choice ${String.fromCharCode(65 + choiceIndex)} image`}
                                                  className="h-30 max-w-full rounded-lg"
                                                  onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display =
                                                      "none";
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  );
                                }
                              })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
