import React, { useEffect, useState } from "react";

export default function ExamPreviewModal({
  previewData,
  onClose,
  onDownload,
  loading,
}) {
  if (!previewData) return null;

  const [scale, setScale] = useState(1);
  const PAGE_WIDTH = 793.7; // 210mm in px at 96dpi

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

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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
        onClick={onDownload}
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
              <div className="flex items-center justify-between px-8 pt-3">
                {/* Left Logo and code */}
                <div className="flex w-32 flex-col items-center">
                  {previewData.logos?.left && (
                    <img
                      src={previewData.logos.left}
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
                </div>
                {/* Right Logo */}
                <div className="flex w-32 flex-col items-center">
                  {previewData.logos?.right && (
                    <img
                      src={previewData.logos.right}
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
              {/* Horizontal line */}

              {/* Exam Title and Instructions */}
              {previewData.examTitle && (
                <div className="px-8 text-center">
                  <div className="mb-1 text-[18px] font-bold text-black">
                    {previewData.examTitle}
                  </div>
                </div>
              )}
              {/* Name and Date row */}
              <div className="mt-3 flex items-center justify-between px-8 pb-1">
                <span className="text-[14px] font-bold text-black">Name:</span>
                <span className="pr-20 text-[14px] font-bold text-black">
                  Date:
                </span>
              </div>
              {previewData.examInstructions && (
                <div className="px-8 text-start">
                  <div className="text-[14px] font-bold text-black">
                    Istructions: {previewData.examInstructions}
                  </div>
                </div>
              )}
              {/* Date row */}

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
                      <h4 className="text-[14px] font-medium text-black">
                        {subjectName}
                      </h4>

                      <div className="space-y-2">
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
                                  className="h-80 max-w-full rounded-lg"
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
                                                  className="h-60 max-w-full rounded-lg"
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
