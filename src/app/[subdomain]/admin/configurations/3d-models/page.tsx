"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ModelsConfigPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Rediriger vers la page models existante
    router.push("/admin/models");
  }, [router]);

  return (
    <div style={{ 
      color: '#ffffff', 
      fontFamily: 'var(--stepn-font-body)',
      textAlign: 'center',
      padding: '48px 0'
    }}>
      <p style={{ color: '#a0a0a0' }}>
        Redirection vers la page 3D Models...
      </p>
    </div>
  );
}

