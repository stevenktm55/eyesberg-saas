import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viewer 3D",
  description: "Outil de prévisualisation 3D pour le modeling – modèle 3D, design 2D et réglages d’environnement.",
  robots: "noindex",
};

export default function Viewer3DLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden">
      {children}
    </div>
  );
}
