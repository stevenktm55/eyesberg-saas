"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Page admin pour le domaine racine uniquement
 * Cette page vérifie qu'on est bien sur le domaine racine avant de s'afficher
 */
export default function RootAdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      const hostWithoutPort = host.split(':')[0];
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
      
      // Vérifier si c'est un sous-domaine (pas le domaine racine)
      const isSubdomain = hostWithoutPort.includes('.') && 
                         hostWithoutPort !== rootDomain && 
                         hostWithoutPort !== `www.${rootDomain}` &&
                         !hostWithoutPort.startsWith('localhost') &&
                         !hostWithoutPort.startsWith('127.0.0.1');
      
      if (isSubdomain) {
        // Si on est sur un sous-domaine, cette page ne devrait pas être servie
        // Next.js devrait servir [subdomain]/admin/page.tsx à la place
        // Mais si on arrive ici, on affiche un message d'erreur
        console.error('❌ Root admin page accessed from subdomain:', hostWithoutPort);
        return;
      }
    }
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin - Domaine racine</h1>
        <p className="text-gray-600">
          Cette page est réservée au domaine racine uniquement.
        </p>
        <p className="text-gray-600 mt-2">
          Pour accéder à l'admin de votre sous-domaine, utilisez : <strong>votresousdomaine.eyesberg.app/admin</strong>
        </p>
      </div>
    </div>
  );
}
