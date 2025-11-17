"use client";

import { useEffect } from "react";

/**
 * Layout pour les pages admin des sous-domaines
 * L'authentification est gérée par le middleware, donc pas besoin de vérifier ici
 */
export default function SubdomainAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Pas de vérification d'authentification ici - le middleware s'en charge
  return <>{children}</>;
}

