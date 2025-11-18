"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DesignsConfigPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Rediriger vers la page designs existante
    router.push("/admin/designs");
  }, [router]);

  return (
    <div style={{ 
      color: '#ffffff', 
      fontFamily: 'var(--stepn-font-body)',
      textAlign: 'center',
      padding: '48px 0'
    }}>
      <p style={{ color: '#a0a0a0' }}>
        Redirection vers la page 2D Designs...
      </p>
    </div>
  );
}

