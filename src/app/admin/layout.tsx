"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Détecter si on est sur un sous-domaine (ex: stretchmx.eyesberg.app)
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const hostWithoutPort = host.split(':')[0];
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eyesberg.app';
    
    // Si on est sur un sous-domaine, ne pas vérifier l'authentification (le middleware le fait)
    const isSubdomain = hostWithoutPort.includes('.') && 
                       hostWithoutPort !== rootDomain && 
                       hostWithoutPort !== `www.${rootDomain}` &&
                       !hostWithoutPort.startsWith('localhost') &&
                       !hostWithoutPort.startsWith('127.0.0.1');
    
    if (isSubdomain) {
      // Sur un sous-domaine, le middleware gère l'authentification
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Ne pas vérifier l'authentification sur la page de login
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/check-auth");
      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      router.push("/admin/login");
    } finally {
      setIsLoading(false);
    }
  };

  // Forcer l'activation du scroll sur les pages admin (le global CSS fixe html/body)
  useEffect(() => {
    const htmlEl = document.documentElement as HTMLElement;
    const bodyEl = document.body as HTMLElement;
    const prevHtml = {
      overflow: htmlEl.style.overflow,
      position: htmlEl.style.position,
      height: htmlEl.style.height,
      width: htmlEl.style.width,
    };
    const prevBody = {
      overflow: bodyEl.style.overflow,
      position: bodyEl.style.position,
      height: bodyEl.style.height,
      width: bodyEl.style.width,
      overscrollBehaviorY: (bodyEl.style as any).overscrollBehaviorY,
      WebkitOverflowScrolling: (bodyEl.style as any).webkitOverflowScrolling,
    } as any;

    // Autoriser le scroll uniquement dans l'admin
    htmlEl.style.overflow = 'auto';
    htmlEl.style.position = 'static';
    htmlEl.style.height = 'auto';
    htmlEl.style.width = '100%';

    bodyEl.style.overflow = 'auto';
    bodyEl.style.position = 'static';
    bodyEl.style.height = 'auto';
    bodyEl.style.width = '100%';
    (bodyEl.style as any).overscrollBehaviorY = 'auto';
    (bodyEl.style as any).webkitOverflowScrolling = 'touch';

    return () => {
      htmlEl.style.overflow = prevHtml.overflow;
      htmlEl.style.position = prevHtml.position;
      htmlEl.style.height = prevHtml.height;
      htmlEl.style.width = prevHtml.width;

      bodyEl.style.overflow = prevBody.overflow;
      bodyEl.style.position = prevBody.position;
      bodyEl.style.height = prevBody.height;
      bodyEl.style.width = prevBody.width;
      (bodyEl.style as any).overscrollBehaviorY = prevBody.overscrollBehaviorY;
      (bodyEl.style as any).webkitOverflowScrolling = prevBody.WebkitOverflowScrolling;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Page de login - pas de protection
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  // Non authentifié
  if (!isAuthenticated) {
    return null;
  }

  // Authentifié - afficher le contenu avec un bouton de déconnexion
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header admin avec déconnexion */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">👤 Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

