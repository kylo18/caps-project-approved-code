import React, { useState } from "react";
import ConfirmModal from "./confirmModal"; 

const ExamChoicesForm = ({ questionID, onComplete }) => {
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
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      const updatedChoices = [...choices];
      updatedChoices[index].image = file; // Store as File object
      setChoices(updatedChoices);
    }
  };
  
  const handleSubmitChoices = async () => {
    setError(null);
  
    if (!questionID) {
      setError("No question submitted yet.");
      return;
    }
  
    if (!choices.every((choice) => choice.choiceText.trim() !== "" || choice.image)) {
      setError("Each choice must have either text or an image.");
      return;
    }
  
    if (!choices.some((choice) => choice.isCorrect)) {
      setError("You must select one correct answer.");
      return;
    }
  
    const token = localStorage.getItem("token");
  
    // Use FormData for file uploads
    const formData = new FormData();
    formData.append("questionID", questionID);
  
    choices.forEach((choice, index) => {
      formData.append(`choices[${index}][choiceText]`, choice.choiceText.trim());
      formData.append(`choices[${index}][isCorrect]`, choice.isCorrect ? "1" : "0"); 
  
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
    }
  };

  return (
    <div className="relative flex">
      <div className="flex-1">
        <div className="font-inter text-[14px] max-w-3xl mx-auto bg-white py-2 pl-4 shadow-lg rounded-t-md border border-[rgb(168,168,168)] relative text-gray-600 font-medium">
          <span>Add Choices</span>
        </div>

        <div className="rounded-b w-full max-w-3xl sm:px-4 mx-auto p-4 bg-white shadow-lg border-[rgb(168,168,168)] border-t-0 border relative">
          <div className="space-y-3 px-3 py-2">

            {choices.map((choice, index) => (
              <div key={index} className="flex items-center space-x-2 relative">
                {/* Radio Button */}
                <input
                  type="radio"
                  name="correctChoice"
                  checked={choice.isCorrect}
                  onChange={() => handleChoiceChange(index, "isCorrect", true)}
                  className="cursor-pointer size-5 accent-orange-500"
                />

                {/* Input Choice */}
                {!choice.image && (
                  <input
                    type="text"
                    value={choice.choiceText}
                    placeholder={`Choice ${index + 1}`}
                    onChange={(e) => handleChoiceChange(index, "choiceText", e.target.value)}
                    className="text-[14px] border-0 hover:border-b border-gray-300 p-2 w-[90%] rounded-none focus:outline-none focus:border-b-2 focus:border-b-orange-500 hover:border-b-gray-500 transition-all duration-100"
                    onFocus={() => setFocusedChoice(index)}
                    onBlur={(e) => {
                      if (!e.relatedTarget || !e.relatedTarget.classList.contains("image-upload-btn")) {
                        setFocusedChoice(null);
                      }
                    }}required
                  />
                )}

                {/* Image Upload Button (Only visible when input is focused) */}
                {!choice.image && focusedChoice === index && (
                  <>
                    <button
                      onClick={() => document.getElementById(`fileInput-${index}`).click()}
                      className="text-[24px] text-[rgb(120,120,120)] cursor-pointer px-2 py-1 rounded-md hover:text-gray-900 image-upload-btn"
                    >
                      <i className="bx bx-image-alt"></i>

                    </button>
                    <input
                      id={`fileInput-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleChoiceImageUpload(index, event)}
                      
                    />
                  </>
                )}
                
                {/* Show Image If Added */}
                {choice.image && (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(choice.image)}
                      alt={`Choice ${index + 1}`}
                      className="hover:opacity-80 max-w-[150px] max-h-[150px] object-contain rounded-md hover:cursor-pointer"
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
                      className="hover:cursor-pointer text-white absolute top-4 right-4 bg-black opacity-70 px-[2px] pt-[2px] rounded-full text-xs transform translate-x-1/2 -translate-y-1/2"
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
                className="fixed inset-0 h-screen lightbox-bg flex items-center justify-center z-100"
                onClick={() => setIsChoiceModalOpen(false)}
              >
                <div className="relative max-w-full max-h-full">
                  <img
                    src={choiceModalImage}
                    alt="Full View"
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-md"
                  />
                </div>
              </div>
            )}
            {/* Submit Button aligned right */}
            <div className="ml-3 flex flex-1 justify-end mt-7">
              <button
                onClick={handleSubmitChoices}
                className="cursor-pointer flex items-center gap-1 px-4 py-2 mt-4 sm:mt-0 bg-orange-500 text-white rounded-lg hover:bg-orange-600 ml-auto"
              >
                <i className="bx bx-save text-[18px] hidden sm:inline-block"></i> 
                <span className="text-[14px]">Submit</span>
              </button>
            </div>
          </div>
          {error && <p className="flex justify-center text-red-500">{error}</p>}
        </div>
        {/* Confirmation Modal */}
        <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleSubmitChoices}
            message="Are you sure you want to add this question?"
          />
      </div>
    </div>
  );
};

export default ExamChoicesForm;
