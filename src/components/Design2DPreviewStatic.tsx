"use client";

import { useEffect, useRef } from "react";

type Design2DPreviewStaticProps = {
  url?: string;
  style?: React.CSSProperties;
};

export function Design2DPreviewStatic({ url, style }: Design2DPreviewStaticProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    // Créer un élément img pour afficher le SVG
    const img = document.createElement("img");
    img.src = url;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";
    img.onerror = () => {
      // Si l'image ne charge pas, afficher un placeholder
      container.innerHTML = `
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a0a0a0;
          font-size: 12px;
          font-family: var(--stepn-font-body);
        ">
          Aucun design
        </div>
      `;
    };

    container.appendChild(img);
  }, [url]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        ...style,
      }}
    />
  );
}

