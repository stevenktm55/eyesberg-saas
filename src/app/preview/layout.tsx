import "../globals.css"; // <--- C'est LA ligne qui manque pour avoir les couleurs et le layout
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aperçu 3D",
  robots: "noindex", // On ne veut pas que Google indexe les previews
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* On force une structure propre isolée de l'admin */}
      <div id="preview-root" className="w-full h-full relative">
        {children}
      </div>
    </>
  );
}
