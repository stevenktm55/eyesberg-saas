import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Temporaire pour migration Supabase
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporaire pour migration Supabase
  },
  // Options compatibles Next 15
  serverExternalPackages: ['sharp'],
  // Configuration pour les images externes (Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dwgxdxyuamjzygvpuhyq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Configuration pour autoriser les iframes Shopify
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.myshopify.com https://*.shopify.com *"
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ],
      },
    ];
  },
  // (experiments nettoyés)
  // Désactiver le prérendu pour toutes les routes (forcer le rendu dynamique)
  output: 'standalone',
  // Désactiver le prérendu statique
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // (API et maxDuration supprimés; non supportés dans next.config.ts)
  // Build standalone pour Vercel
  output: 'standalone',
};

export default nextConfig;
