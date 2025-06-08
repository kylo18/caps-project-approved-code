import React from "react";

export default function ExamPreviewModal({
  previewData,
  onClose,
  onDownload,
  loading,
}) {
  if (!previewData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Exam Preview
                </h3>
                <div className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Total Items: {previewData.totalItems} (Requested:{" "}
                        {previewData.requestedItems})
                      </p>
                    </div>
                    {Object.entries(previewData.questionsBySubject).map(
                      ([subjectName, data]) => (
                        <div key={subjectName} className="border-t pt-4">
                          <h4 className="font-medium text-gray-900">
                            {subjectName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Questions: {data.totalItems}
                          </p>
                          <div className="mt-2 space-y-2">
                            {data.questions.map((question, index) => (
                              <div
                                key={index}
                                className="rounded bg-gray-50 p-3"
                              >
                                <p className="text-sm text-gray-700">
                                  {index + 1}. {question.questionText}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Difficulty: {question.difficulty}
                                </p>
                                {question.choices &&
                                  question.choices.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {question.choices.map(
                                        (choice, choiceIndex) => (
                                          <p
                                            key={choiceIndex}
                                            className="text-xs text-gray-600"
                                          >
                                            {String.fromCharCode(
                                              65 + choiceIndex,
                                            )}
                                            . {choice.choiceText}
                                          </p>
                                        ),
                                      )}
                                    </div>
                                  )}
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
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onDownload}
              disabled={loading}
              className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                loading
                  ? "cursor-not-allowed bg-indigo-400"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Generating PDF..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
