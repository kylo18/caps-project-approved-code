import React, { useState, useRef, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";

const ImageSelectionModal = ({
  isOpen,
  onClose,
  onImageSelected,
  title = "Add image",
}) => {
  const [activeTab, setActiveTab] = useState("upload"); // "upload", "search"
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropSize, setCropSize] = useState({ width: 400, height: 400 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({
    width: 0,
    height: 0,
  });
  const cropContainerRef = useRef(null);

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

  // Once the image is loaded and the container is measured, normalize crop size
  // so it scales with the viewport (desktop vs mobile) instead of a fixed px size.
  useEffect(() => {
    if (!imageLoaded || !cropContainerRef.current) return;

    const rect = cropContainerRef.current.getBoundingClientRect();
    const base = Math.min(rect.width, rect.height) * 0.8; // 80% of the smaller side

    setCropSize({
      width: Math.max(100, base),
      height: Math.max(100, base),
    });
  }, [imageLoaded]);

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

  const handleSearch = () => {
    // Placeholder for search functionality
    // You can integrate with an image search API here
    alert("Image search functionality coming soon");
  };

  const handleCropComplete = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImageBlobUrl = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
      );

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
    setSearchQuery("");
    setIsDragging(false);
    dragCounter.current = 0;
    setIsResizing(false);
    setResizeHandle(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  // Handle resize start (mouse + touch)
  const handleResizeStart = (e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);

    if (!cropContainerRef.current) return;

    const containerRect = cropContainerRef.current.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    const point =
      e.touches && e.touches[0]
        ? e.touches[0]
        : e.changedTouches && e.changedTouches[0]
          ? e.changedTouches[0]
          : e;

    // Calculate initial pointer position relative to center
    const initialX = point.clientX - containerCenterX;
    const initialY = point.clientY - containerCenterY;

    setResizeStartPos({ x: initialX, y: initialY });
    setResizeStartSize({ ...cropSize });
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const updateSizeFromEvent = (evt) => {
      if (!cropContainerRef.current) return;

      const containerRect = cropContainerRef.current.getBoundingClientRect();
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height / 2;

      const point =
        evt.touches && evt.touches[0]
          ? evt.touches[0]
          : evt.changedTouches && evt.changedTouches[0]
            ? evt.changedTouches[0]
            : evt;

      // Calculate current pointer position relative to container center
      const currentX = point.clientX - containerCenterX;
      const currentY = point.clientY - containerCenterY;

      // Calculate distance from center
      const distanceX = Math.abs(currentX);
      const distanceY = Math.abs(currentY);

      let newWidth = resizeStartSize.width;
      let newHeight = resizeStartSize.height;

      // Calculate new size based on handle
      // Since react-easy-crop centers the crop box, we resize symmetrically from center
      switch (resizeHandle) {
        case "se": // Southeast (bottom-right)
        case "sw": // Southwest (bottom-left)
        case "ne": // Northeast (top-right)
        case "nw": // Northwest (top-left)
          // For corners, resize both dimensions
          newWidth = Math.max(100, distanceX * 2);
          newHeight = Math.max(100, distanceY * 2);
          break;
        case "e": // East (right)
        case "w": // West (left)
          newWidth = Math.max(100, distanceX * 2);
          break;
        case "s": // South (bottom)
        case "n": // North (top)
          newHeight = Math.max(100, distanceY * 2);
          break;
      }

      // Limit to container size
      newWidth = Math.min(newWidth, containerRect.width - 20);
      newHeight = Math.min(newHeight, containerRect.height - 20);

      setCropSize({ width: newWidth, height: newHeight });
    };

    const handleMouseMove = (e) => {
      e.preventDefault();
      updateSizeFromEvent(e);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      updateSizeFromEvent(e);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStartPos, resizeStartSize]);

  if (!isOpen) return null;

  return (
    <div className="lightbox-bg bg-opacity-70 fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div
        className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded bg-orange-100">
              <i className="bx bx-image-alt text-[22px] text-orange-600"></i>
            </div>
            <h2 className="outfit-500 text-[16px] font-semibold text-gray-800">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <i className="bx bx-x text-[24px]"></i>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("upload")}
            className={`outfit-400 flex flex-1 cursor-pointer items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "upload"
                ? "border-b-2 border-gray-800 bg-gray-50 text-gray-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-upload-icon lucide-upload"
            >
              <path d="M12 3v12" />
              <path d="m17 8-5-5-5 5" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            </svg>
            Upload
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`outfit-400 flex flex-1 cursor-pointer items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === "search"
                ? "border-b-2 border-gray-800 bg-gray-50 text-gray-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="bx bx-search text-[18px]"></i>
            Search
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isCropping && activeTab === "upload" ? (
            /* Crop View */
            <div className="space-y-4">
              <div
                ref={cropContainerRef}
                className="relative h-[300px] w-full overflow-hidden rounded-lg bg-gray-100"
                style={{ position: "relative" }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: `${cropSize.width}px`,
                    height: `${cropSize.height}px`,
                    border: "2px solid #ec4899",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                >
                  {/* Resize handles */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "nw")}
                    onTouchStart={(e) => handleResizeStart(e, "nw")}
                    style={{
                      position: "absolute",
                      top: "-6px",
                      left: "-6px",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ec4899",
                      border: "2px solid white",
                      borderRadius: "50%",
                      cursor: "nw-resize",
                      pointerEvents: "all",
                      zIndex: 11,
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "ne")}
                    onTouchStart={(e) => handleResizeStart(e, "ne")}
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ec4899",
                      border: "2px solid white",
                      borderRadius: "50%",
                      cursor: "ne-resize",
                      pointerEvents: "all",
                      zIndex: 11,
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "sw")}
                    onTouchStart={(e) => handleResizeStart(e, "sw")}
                    style={{
                      position: "absolute",
                      bottom: "-6px",
                      left: "-6px",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ec4899",
                      border: "2px solid white",
                      borderRadius: "50%",
                      cursor: "sw-resize",
                      pointerEvents: "all",
                      zIndex: 11,
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "se")}
                    onTouchStart={(e) => handleResizeStart(e, "se")}
                    style={{
                      position: "absolute",
                      bottom: "-6px",
                      right: "-6px",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ec4899",
                      border: "2px solid white",
                      borderRadius: "50%",
                      cursor: "se-resize",
                      pointerEvents: "all",
                      zIndex: 11,
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "n")}
                    onTouchStart={(e) => handleResizeStart(e, "n")}
                    style={{
                      position: "absolute",
                      top: "-6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ec4899",
                      border: "2px solid white",
                      borderRadius: "50%",
                      cursor: "n-resize",
                      pointerEvents: "all",
                      zIndex: 11,
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "s")}
                    onTouchStart={(e) => handleResizeStart(e, "s")}
                    style={{
                      position: "absolute",
                      bottom: "-6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ec4899",
                      border: "2px solid white",
                      borderRadius: "50%",
                      cursor: "s-resize",
                      pointerEvents: "all",
                      zIndex: 11,
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "e")}
                    onTouchStart={(e) => handleResizeStart(e, "e")}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "-6px",
                      transform: "translateY(-50%)",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ec4899",
                      border: "2px solid white",
                      borderRadius: "50%",
                      cursor: "e-resize",
                      pointerEvents: "all",
                      zIndex: 11,
                    }}
                  />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "w")}
                    onTouchStart={(e) => handleResizeStart(e, "w")}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "-6px",
                      transform: "translateY(-50%)",
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#ec4899",
                      border: "2px solid white",
                      borderRadius: "50%",
                      cursor: "w-resize",
                      pointerEvents: "all",
                      zIndex: 11,
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={undefined}
                    cropSize={cropSize}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    restrictPosition={true}
                    minZoom={0.5}
                    maxZoom={5}
                  />
                </div>
              </div>
              <p className="outfit-400 mt-2 text-center text-[14px] text-gray-500">
                Drag the crop handles to resize image. Use zoom to adjust the
                image size.
              </p>
              <div className="flex items-center gap-4">
                <label className="outfit-400 text-[14px] font-medium text-gray-700">
                  Zoom:
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="outfit-400 text-[14px] text-gray-600">
                  {zoom.toFixed(1)}x
                </span>
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
                  className="outfit-400 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropComplete}
                  className="outfit-400 cursor-pointer rounded-xl bg-orange-500 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-orange-600"
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
                  ? "border-orange-500 bg-orange-50"
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
                <p className="outfit-400 mb-2 text-center text-[14px] font-medium text-gray-700">
                  Upload or drop an image here
                </p>
                <p className="outfit-400 mb-4 text-center text-[14px] text-gray-500">
                  PNG · jpeg · jpg · GIF
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="outfit-400 cursor-pointer rounded-xl bg-orange-500 px-6 py-2 text-[14px] font-medium text-white transition hover:bg-orange-600"
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
            <div className="mt-5 mb-5 space-y-4">
              <p className="outfit-400 text-center text-[14px] text-gray-500">
                Image search functionality coming soon
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ImageSelectionModal;
