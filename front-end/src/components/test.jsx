import { useState, useRef, useEffect } from "react";
import Toolbar from "./toolbar";
import Button from "./button";

export default function QuestionCard({ topRadius = true, subjectID, }) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedOption, setSelectedOption] = useState("Lemons");
  const [image, setImage] = useState(null); // Stores uploaded image
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false); // Controls image of choice modal
  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState(
    Array(6).fill({ text: "", image: null })
  );
  const editorRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for the file input
  const [focusedChoice, setFocusedChoice] = useState(null);
  const handleChoiceChange = (index, value) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };
  const [score, setscore] = useState(1);
  const [difficulty, setDifficulty] = useState("Easy");

  const [choiceModalImage, setchoiceModalImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coverage, setCoverage] = useState("Midterms");

  const apiUrl = "http://172.20.10.3:8000/api";


  const openImageModal = (imageSrc) => {
    setchoiceModalImage(imageSrc);
    setIsChoiceModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (selectedOption === null) {
      console.error("Please select a correct answer.");
      return;
    }
  
    setLoading(true);
  
    const formData = new FormData();
    formData.append("subjectID", subjectID);
    formData.append("status", "pending");
    formData.append("questionText", questionText);
    formData.append("score", score);
    formData.append("difficulty", difficulty.toLowerCase());
    formData.append("coverage", coverage.toLowerCase()); // Laravel expects lowercase
  
    // Attach image file
    if (image) {
      // image currently stores Base64 string, we need FILE
      const imgFile = fileInputRef.current.files[0];
      if (imgFile) {
        formData.append("image", imgFile);
      }
    }
  
    // Prepare choices properly
    const formattedChoices = choices.map((choice, index) => ({
      type: choice.image ? "image" : "text",
      value: choice.image || choice.text, // Base64 or text
      isCorrect: index === selectedOption,
    }));
  
    formData.append("choices", JSON.stringify(formattedChoices));
  
    try {
      const response = await fetch(`${apiUrl}/question/add`, {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        console.log("✅ Question added successfully!");
        // Reset the form
        setQuestionText("");
        setChoices(Array(6).fill({ text: "", image: null }));
        setImage(null);
        setSelectedOption(null);
        setscore(1);
        setDifficulty("Easy");
        setCoverage("Midterms");
      } else {
        const errorData = await response.json();
        console.error("❌ Failed:", errorData);
      }
    } catch (error) {
      console.error("❌ Error adding question:", error);
    } finally {
      setLoading(false);
    }
  };
  
  
  // Helper function: Converts image file to Base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result); // Base64 result
      reader.onerror = (error) => reject(error);
    });
  };

  // Apply formatting without losing focus
  const handleFormat = (command, setState) => {
    document.execCommand(command, false, null);
    setState(document.queryCommandState(command));
    editorRef.current.focus(); // Keep focus after applying format
  };

  // Update formatting state when selection changes
  const checkFormatting = () => {
    setTimeout(() => {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
    }, 10); // Small delay to prevent selection loss issues
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.addEventListener("focus", () => setIsFocused(true));
      editorRef.current.addEventListener("blur", () => setIsFocused(false));
      editorRef.current.addEventListener("mouseup", checkFormatting);
      editorRef.current.addEventListener("keyup", checkFormatting);
    }
  }, []);

  // Handle image selection
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result); // Set the image preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChoiceImageUpload = (event, index) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const newChoices = [...choices];
        newChoices[index] = { text: "", image: reader.result }; // Set image and clear text
        setChoices(newChoices);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeChoiceImage = (index) => {
    const newChoices = [...choices];
    newChoices[index] = { text: "", image: null }; // Reset to default
    setChoices(newChoices);
  };
  
  const validatescore = (value, setscore) => {
    if (value === '') {
      setscore('');
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setscore(Math.max(1, num));
      }
    }
  };

return (
  <div className="relative flex">
    <div className="flex-1">
      {/* Header */}
      <div className="font-inter text-[14px] max-w-3xl mx-auto bg-white py-2 pl-4 shadow-lg rounded-t-md border border-[rgb(168,168,168)] relative text-gray-600 font-medium">
        <span>Questions: 1</span>
      </div>

      {/* Question Card */}
      <div
        className={`w-full max-w-3xl sm:px-4 mx-auto p-4 bg-white shadow-lg border-[rgb(168,168,168)] border-t-0 border relative ${
          topRadius ? "rounded-md" : "rounded-b-md"
        }`}>

        {/* Answer Options */}
        <div className="mt-3 space-y-3 p-3">
          {choices.map((choice, index) => (
            <div key={index} className="flex items-center space-x-2 relative">
              {/* Radio Button */}
              <input
                type="radio"
                name="correctAnswer"
                checked={selectedOption === index}
                onChange={() => setSelectedOption(index)}
                className="cursor-pointer size-5 accent-orange-500"
              />

              {/* Text Input (Hidden when image is present) */}
              {!choice.image && (
                <input
                type="text"
                value={choice.text}
                onChange={(e) => handleChoiceChange(index, e.target.value)}
                placeholder={`Choice ${index + 1}`}
                className="text-[14px] border-0 hover:border-b border-gray-300 p-2 w-[90%] rounded-none focus:outline-none focus:border-b-2 focus:border-b-orange-500 hover:border-b-gray-500 transition-all duration-100"
                onFocus={() => setFocusedChoice(index)}
                onBlur={(e) => {
                  if (!e.relatedTarget || !e.relatedTarget.classList.contains("image-upload-btn")) {
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
                    onChange={(e) => handleChoiceImageUpload(e, index)}
                  />
                </>
              )}
              

              {/* Show Image If Added */}
              {choice.image && (
                <div className="relative">
                  <img
                    src={choice.image}
                    alt={`Choice ${index + 1}`}
                    className="size-20 object-cover rounded-md hover:cursor-pointer"
                    onClick={() => {
                      setchoiceModalImage(choice.image); 
                      setIsChoiceModalOpen(true); 
                    }}
                />
                  {/* Remove Image Button */}
                  <button
                    onClick={() => {
                      removeChoiceImage(index);
                      setFocusedChoice(null); // Ensure focus is reset when removing the image
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
              className="fixed inset-0 bg-black lightbox-bg flex items-center justify-center z-50"
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
        </div>

        <div className="w-full h-[1px] bg-[rgb(168,168,168)] mt-5"></div>
        {/* Submit Button aligned right */}
        <div className="ml-3 flex flex-1 justify-end">
          <Button
            text="Submit"
            textres="Submit"
            icon="bx bx-save"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  </div>

);
}


