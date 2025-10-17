import { useRef, useEffect } from "react";

interface RichTextEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ initialHtml, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml]);

  const handleCommand = (cmd: string) => {
    document.execCommand(cmd);
    onChange(editorRef.current?.innerHTML || "");
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-2 mb-2">
        <button onClick={() => handleCommand("bold")} className="px-3 py-1 bg-gray-200 rounded">B</button>
        <button onClick={() => handleCommand("italic")} className="px-3 py-1 bg-gray-200 rounded">I</button>
        <button onClick={() => handleCommand("underline")} className="px-3 py-1 bg-gray-200 rounded">U</button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        contentEditable
        className="min-h-[500px] bg-white p-4 border border-gray-300 rounded focus:outline-none"
      />
    </div>
  );
}
