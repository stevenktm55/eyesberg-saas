"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/stepn-theme.css";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

function NavigationHeader() {
  const pathname = usePathname();
  
  return (
    <Suspense fallback={<div className="h-16 border-b"></div>}>
      <NavigationHeaderContent pathname={pathname} />
    </Suspense>
  );
}

function NavigationHeaderContent({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  
  // Masquer la navigation si on est sur /configure et qu'il y a des paramètres Shopify ou une config
  const isShopifyConfigurator = pathname === '/configure' && 
    (searchParams.get('shop') || searchParams.get('productId') || searchParams.get('variantId') || searchParams.get('config'));
  
  if (isShopifyConfigurator) {
    return null; // Pas de navigation pour les clients Shopify ou les configurations du panier
  }
  
  return (
    <header className="h-16 flex items-center px-6 border-b">
      <div className="flex-1 font-semibold">StretchMX Configurator</div>
      <nav className="flex gap-4 text-sm">
        <a href="/" className="hover:underline">Accueil</a>
        <a href="/configure" className="hover:underline">Configurer</a>
        <a href="/admin" className="hover:underline">Admin</a>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Configurateur de vêtements StretchMX - Personnalisez vos designs" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavigationHeader />
        {children}
      </body>
    </html>
  );
}
