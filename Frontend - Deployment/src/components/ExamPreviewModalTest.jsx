// components/PdfWithImage.js
import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import collegeLogo from "/src/assets/college-logo.png";

const PdfWithImage = () => {
  const contentRef = useRef();

  const generatePDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: 0.5,
      filename: "document-with-image.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="p-4">
      <div ref={contentRef} className="max-w-md rounded bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Product Sheet</h1>
        <img
          src={collegeLogo}
          alt="Product"
          className="mb-4 h-auto w-full rounded"
        />
        <p>
          This is a product description. The image above will be included in the
          PDF.
        </p>
      </div>
      <button
        onClick={generatePDF}
        className="mt-4 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
      >
        Download PDF with Image
      </button>
    </div>
  );
};

export default PdfWithImage;
