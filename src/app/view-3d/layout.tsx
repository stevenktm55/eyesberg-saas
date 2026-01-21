// IMPORTANT : Vérifie que le chemin vers globals.css est correct !
// Si ton globals.css est dans src/app/, alors c'est bien "../globals.css"
import "../globals.css"; 
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aperçu 3D",
  robots: "noindex", // On ne veut pas que Google indexe les previews
};

export default function View3DLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased w-screen h-screen overflow-hidden bg-white">
        {children}
      </body>
    </html>
  );
}
