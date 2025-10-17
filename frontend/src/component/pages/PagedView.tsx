import { useEffect, useRef, useState } from "react";

interface PagedViewProps {
  children: React.ReactNode;
}

export default function PagedView({ children }: PagedViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const pageHeight = 1123; // ≈ A4 height (px)
    const allChildren = Array.from(containerRef.current.children) as HTMLElement[];

    const chunks: string[] = [];
    let currentHtml = "";
    let currentHeight = 0;

    for (const el of allChildren) {
      const h = el.offsetHeight;
      if (currentHeight + h > pageHeight && currentHtml) {
        chunks.push(currentHtml);
        currentHtml = el.outerHTML;
        currentHeight = h;
      } else {
        currentHtml += el.outerHTML;
        currentHeight += h;
      }
    }
    if (currentHtml) chunks.push(currentHtml);

    setPages(chunks);
  }, [children]);

  return (
    <>
      <div ref={containerRef} className="hidden">
        {children}
      </div>

      {pages.map((html, i) => (
        <div key={i} className="a4-page" dangerouslySetInnerHTML={{ __html: html }} />
      ))}
    </>
  );
}
