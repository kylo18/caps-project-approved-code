import React, { useState } from "react";
import ConfirmModal from "./confirmModal";
import WarnOnExit from "../hooks/WarnOnExit";
import LoadingOverlay from "./loadingOverlay";

const ExamChoicesForm = ({ questionID, onComplete, onCancel }) => {
  const [focusedChoice, setFocusedChoice] = useState(null);
  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [choices, setChoices] = useState([
    { choiceText: "", isCorrect: false, image: null },
    { choiceText: "", isCorrect: false, image: null },
    { choiceText: "", isCorrect: false, image: null },
    { choiceText: "", isCorrect: false, image: null },
    { choiceText: "", isCorrect: false, image: null },
    { choiceText: "", isCorrect: false, image: null },
  ]);

  const [isAdding, setIsAdding] = useState(false);

  WarnOnExit(choices);

  const openImageModal = (imageSrc) => {
    setchoiceModalImage(imageSrc);
    setIsChoiceModalOpen(true);
  };
  const removeChoiceImage = (index) => {
    const newChoices = [...choices];
    newChoices[index] = { choiceText: "", isCorrect: false, image: null }; // Reset to default
    setChoices(newChoices);
  };

  const handleChoiceChange = (index, field, value) => {
    const updatedChoices = [...choices];

    if (field === "isCorrect" && value) {
      updatedChoices.forEach((choice, i) => {
        if (i !== index) {
          choice.isCorrect = false;
        }
      });
    }
    updatedChoices[index][field] = value;
    setChoices(updatedChoices);
  };

  const handleChoiceImageUpload = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const updatedChoices = [...choices];
      updatedChoices[index].image = file;
      updatedChoices[index].choiceText = "";
      setChoices(updatedChoices);
    }
  };

  const handleSubmitChoices = async () => {
    setError(null);

    if (!questionID) {
      setError("No question submitted yet.");
      return;
    }

    if (
      !choices.every(
        (choice) => choice.choiceText.trim() !== "" || choice.image,
      )
    ) {
      setError("Each choice must have either text or an image.");
      return;
    }

    if (!choices.some((choice) => choice.isCorrect)) {
      setError("You must select one correct answer.");
      return;
    }

    const token = localStorage.getItem("token");
    setIsAdding(true);

    // Use FormData for file uploads
    const formData = new FormData();
    formData.append("questionID", questionID);

    choices.forEach((choice, index) => {
      formData.append(
        `choices[${index}][choiceText]`,
        choice.choiceText.trim(),
      );
      formData.append(
        `choices[${index}][isCorrect]`,
        choice.isCorrect ? "1" : "0",
      );

      if (choice.image instanceof File) {
        formData.append(`choices[${index}][image]`, choice.image);
      }
    });

    try {
      const response = await fetch(`${apiUrl}/questions/choices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Authorization is needed
        },
        body: formData, // Do not set Content-Type manually
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Choices added successfully:", data);
        onComplete();
      } else {
        setError(data.message || "Failed to submit choices.");
      }
    } catch (error) {
      setError("Request failed. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubmitClick = () => {
    setError(null);

    if (!questionID) {
      setError("No question submitted yet.");
      return;
    }

    if (
      !choices.every(
        (choice) => choice.choiceText.trim() !== "" || choice.image,
      )
    ) {
      setError("Each choice must have either text or an image.");
      return;
    }

    if (!choices.some((choice) => choice.isCorrect)) {
      setError("You must select one correct answer.");
      return;
    }
    setShowConfirmModal(true);
  };

  return (
    <div className="relative flex">
      <div className="flex-1">
        <div className="border-color relative mx-auto w-full max-w-3xl rounded-b border border-t-0 bg-white p-4 shadow-lg sm:px-4">
          <div className="space-y-3 px-3 py-2">
            {choices.map((choice, index) => (
              <div key={index} className="relative flex items-center space-x-2">
                {/* Radio Button */}
                <input
                  type="radio"
                  name="correctChoice"
                  checked={choice.isCorrect}
                  onChange={() => handleChoiceChange(index, "isCorrect", true)}
                  className="size-5 cursor-pointer accent-orange-500"
                />

                {/* Input Choice */}
                {!choice.image && (
                  <input
                    type="text"
                    value={choice.choiceText}
                    placeholder={`Choice ${index + 1}`}
                    onChange={(e) =>
                      handleChoiceChange(index, "choiceText", e.target.value)
                    }
                    className="w-[90%] rounded-none border-0 border-gray-300 p-2 text-[14px] transition-all duration-100 hover:border-b hover:border-b-gray-500 focus:border-b-2 focus:border-b-orange-500 focus:outline-none"
                    onFocus={() => setFocusedChoice(index)}
                    onBlur={(e) => {
                      if (
                        !e.relatedTarget ||
                        !e.relatedTarget.classList.contains("image-upload-btn")
                      ) {
                        setFocusedChoice(null);
                      }
                    }}
                    required
                  />
                )}

                {/* Image Upload Button (Only visible when input is focused) */}
                {!choice.image && focusedChoice === index && (
                  <>
                    <button
                      onClick={() =>
                        document.getElementById(`fileInput-${index}`).click()
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

                {/* Show Image If Added */}
                {choice.image && (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(choice.image)}
                      alt={`Choice ${index + 1}`}
                      className="max-h-[150px] max-w-[150px] rounded-md object-contain hover:cursor-pointer hover:opacity-80"
                      onClick={() => {
                        setchoiceModalImage(URL.createObjectURL(choice.image));
                        setIsChoiceModalOpen(true);
                      }}
                    />

                    {/* Remove Image Button */}
                    <button
                      onClick={() => {
                        removeChoiceImage(index);
                        setFocusedChoice(null);
                      }}
                      className="absolute top-4 right-4 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-black px-[2px] pt-[2px] text-xs text-white opacity-70 hover:cursor-pointer"
                    >
                      <i className="bx bx-x text-[20px]"></i>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Image Modal (Full Size) */}
            {isChoiceModalOpen && (
              <div
                className="lightbox-bg fixed inset-0 z-100 flex h-screen items-center justify-center"
                onClick={() => setIsChoiceModalOpen(false)}
              >
                <div className="relative max-h-full max-w-full">
                  <img
                    src={choiceModalImage}
                    alt="Full View"
                    className="max-h-[90vh] max-w-[90vw] rounded-md object-contain"
                  />
                </div>
              </div>
            )}
            {/* Submit Button aligned right */}
            <div className="mt-7 ml-3 flex flex-1 justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="border-color flex cursor-pointer items-center rounded-lg border px-[12px] py-[6px] text-gray-700 hover:bg-gray-200"
              >
                <span className="text-[14px]">Cancel</span>
              </button>
              <button
                onClick={handleSubmitClick}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-orange-500 px-[12px] py-[6px] text-white hover:bg-orange-600"
              >
                <span className="text-[14px]">Submit</span>
                <i className="bx bx-right-arrow-alt hidden text-[16px] sm:inline-block"></i>
              </button>
            </div>
          </div>
          {error && <p className="flex justify-center text-red-500">{error}</p>}
        </div>

        {isAdding && <LoadingOverlay show={isAdding} />}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => {
            setShowConfirmModal(false);
            handleSubmitChoices();
          }}
          message="Are you sure you want to add this question?"
        />
      </div>
    </div>
  );
};

export default ExamChoicesForm;
