"use client";

import { usePathname } from "next/navigation";
import "./globals.css";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname() ?? "";
  // stepn-theme = identité STEPN. Ne jamais le charger quand ConfiguratorViewer est affiché :
  // /configure (configurateur client) et …/admin/products/new (éditeur produit avec viewer).
  const hasConfiguratorViewer =
    pathname.startsWith("/configure") || pathname.includes("products/new");
  const loadStepnTheme = !hasConfiguratorViewer;
  return (
    <html lang="fr">
      <head>
        {loadStepnTheme && (
          <link rel="stylesheet" href="/styles/stepn-theme.css" />
        )}
        <link rel="stylesheet" href="/styles/configurator-panel-theme.css?v=20260127-no-italic" />
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
