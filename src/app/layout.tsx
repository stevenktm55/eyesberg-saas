"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// stepn-theme.css et configurator-panel-theme.css sont maintenant importés via @import dans globals.css
// pour s'assurer qu'ils sont bundlés par Next.js (les imports dans "use client" ne sont pas bundlés correctement)

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Les métadonnées ne peuvent pas être exportées dans un composant client
// Elles seront définies dans chaque page individuellement

// Navigation header supprimé - toutes les pages sont sans header

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Charger stepn-theme.css et configurator-panel-theme.css directement via link car @import dans globals.css ne fonctionne pas */}
        <link rel="stylesheet" href="/styles/stepn-theme.css" />
        <link rel="stylesheet" href="/styles/configurator-panel-theme.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Précharger Inter depuis le serveur local */}
        <link
          rel="preload"
          href="/fonts/inter-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        {/* Fallback vers Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=block" rel="stylesheet" />
        {/* Précharger les fonts PP Neue Machina depuis le serveur local */}
        <link
          rel="preload"
          href="/fonts/pp-neue-machina-ultrabold-italic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/pp-neue-machina-regular-italic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/pp-neue-machina-light-italic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="StretchMX configurator - customize your designs" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
