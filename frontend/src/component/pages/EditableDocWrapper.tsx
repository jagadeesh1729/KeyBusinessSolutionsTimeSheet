import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import RichTextEditor from "./RichTextEditor";
import PagedView from "./PagedView";

interface EditableDocWrapperProps {
  children: React.ReactNode;
}

export default function EditableDocWrapper({ children }: EditableDocWrapperProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [html, setHtml] = useState<string>("");
  const editorRef = useRef<HTMLDivElement>(null);

  // 🧩 On first mount, capture the original HTML
  useEffect(() => {
    if (editorRef.current && !html) {
      setHtml(editorRef.current.innerHTML);
    }
  }, [children]);

  const handleExportPDF = async () => {
    const pages = document.querySelectorAll(".a4-page");
    const pdf = new jsPDF("p", "mm", "a4");

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save("OfferLetter.pdf");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setMode(mode === "view" ? "edit" : "view")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {mode === "view" ? "Edit Document" : "Preview"}
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {/* Hidden source used only to extract initial HTML */}
      <div ref={editorRef} className="hidden">
        {children}
      </div>

      {mode === "edit" ? (
        <RichTextEditor initialHtml={html} onChange={setHtml} />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
