import React, { useState, useRef, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";

const ImageSelectionModal = ({
  isOpen,
  onClose,
  onImageSelected,
  title = "Add image",
}) => {
  const [activeTab, setActiveTab] = useState("upload"); // "upload", "search", "paste"
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setImageLoaded(false);
        setIsCropping(true);
        // Reset crop and zoom when new image is loaded
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize crop area when image loads
  useEffect(() => {
    if (imageSrc && !imageLoaded) {
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [imageSrc, imageLoaded]);

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter((type) =>
          type.startsWith("image/"),
        );
        if (imageTypes.length > 0) {
          const blob = await clipboardItem.getType(imageTypes[0]);
          const file = new File([blob], "pasted-image.png", {
            type: imageTypes[0],
          });
          handleFileSelect(file);
          return;
        }
      }
      alert("No image found in clipboard");
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      alert("Failed to paste from clipboard. Please try uploading an image.");
    }
  };

  const handlePasteLink = async () => {
    if (!pasteUrl.trim()) {
      alert("Please enter an image URL");
      return;
    }

    try {
      // Validate URL
      new URL(pasteUrl);
      
      // Fetch the image
      const response = await fetch(pasteUrl);
      if (!response.ok) throw new Error("Failed to fetch image");
      
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        alert("The URL does not point to an image");
        return;
      }

      const file = new File([blob], "pasted-image.png", { type: blob.type });
      handleFileSelect(file);
      setPasteUrl("");
    } catch (err) {
      console.error("Failed to load image from URL:", err);
      alert("Failed to load image from URL. Please check the URL and try again.");
    }
  };

  const handleSearch = () => {
    // Placeholder for search functionality
    // You can integrate with an image search API here
    alert("Image search functionality coming soon");
  };

  // Handle Ctrl+V keyboard shortcut
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const clipboardItem of clipboardItems) {
            const imageTypes = clipboardItem.types.filter((type) =>
              type.startsWith("image/"),
            );
            if (imageTypes.length > 0) {
              const blob = await clipboardItem.getType(imageTypes[0]);
              const file = new File([blob], "pasted-image.png", {
                type: imageTypes[0],
              });
              handleFileSelect(file);
              return;
            }
          }
          alert("No image found in clipboard");
        } catch (err) {
          console.error("Failed to read clipboard:", err);
          alert("Failed to paste from clipboard. Please try uploading an image.");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImageBlobUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Convert blob URL to File object
      const response = await fetch(croppedImageBlobUrl);
      const blob = await response.blob();
      
      // Determine file type from original or default to png
      const fileType = selectedFile?.type || blob.type || "image/png";
      const fileName = selectedFile?.name 
        ? selectedFile.name.replace(/\.[^/.]+$/, "") + "-cropped.png"
        : "cropped-image.png";
      
      const file = new File([blob], fileName, {
        type: fileType,
        lastModified: Date.now(),
      });

      // Clean up the blob URL
      URL.revokeObjectURL(croppedImageBlobUrl);

      onImageSelected(file);
      handleClose();
    } catch (err) {
      console.error("Failed to crop image:", err);
      alert("Failed to crop image. Please try again.");
    }
  };

  const handleClose = () => {
    setActiveTab("upload");
    setSelectedFile(null);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setPasteUrl("");
    setSearchQuery("");
    setIsDragging(false);
    dragCounter.current = 0;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="lightbox-bg fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70">
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-pink-100">
              <i className="bx bx-image-alt text-pink-600 text-lg"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">
              Use ctrl + V to paste image from your clipboard
            </p>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <i className="bx bx-x text-xl"></i>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "upload"
                ? "border-b-2 border-gray-800 bg-gray-50 text-gray-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="bx bx-upload text-lg"></i>
            Upload
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "search"
                ? "border-b-2 border-gray-800 bg-gray-50 text-gray-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="bx bx-search text-lg"></i>
            Search
          </button>
          <button
            onClick={() => setActiveTab("paste")}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "paste"
                ? "border-b-2 border-gray-800 bg-gray-50 text-gray-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="bx bx-link text-lg"></i>
            Paste Link
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isCropping ? (
            /* Crop View */
            <div className="space-y-4">
              <div className="relative h-[500px] w-full bg-gray-100 rounded-lg overflow-hidden" style={{ position: "relative" }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={undefined}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  restrictPosition={false}
                  minZoom={0.5}
                  maxZoom={5}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Drag the image to position it, use zoom to adjust size. The crop area can be adjusted by zooming in/out.
              </p>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Zoom:</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">{zoom.toFixed(1)}x</span>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCropping(false);
                    setImageSrc(null);
                    setSelectedFile(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropComplete}
                  className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          ) : activeTab === "upload" ? (
            /* Upload Tab */
            <div
              className={`relative rounded-lg border-2 border-dashed p-8 transition ${
                isDragging
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-300 bg-gray-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                  <i className="bx bx-image-alt text-3xl text-gray-400"></i>
                </div>
                <p className="mb-2 text-center text-sm font-medium text-gray-700">
                  Upload or drop an image here
                </p>
                <p className="mb-4 text-center text-xs text-gray-500">
                  PNG · jpeg · jpg · GIF
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-pink-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
                >
                  Upload from device
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>
          ) : activeTab === "search" ? (
            /* Search Tab */
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for images..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-pink-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
                >
                  Search
                </button>
              </div>
              <p className="text-center text-sm text-gray-500">
                Image search functionality coming soon
              </p>
            </div>
          ) : (
            /* Paste Link Tab */
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  placeholder="Paste image URL here..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-pink-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePasteLink();
                  }}
                />
                <button
                  onClick={handlePasteLink}
                  className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-600"
                >
                  Load
                </button>
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={handlePasteFromClipboard}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <i className="bx bx-clipboard mr-2"></i>
                  Paste from Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSelectionModal;
