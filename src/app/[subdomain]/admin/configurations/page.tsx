"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import ModelsConfigPage from "./3d-models/page";
import DesignsConfigPage from "./2d-designs/page";
import PatternsConfigPage from "./2d-patterns/page";

type Tab = "3d-models" | "2d-designs" | "2d-patterns";

export default function ConfigurationsAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("3d-models");

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000',
      display: 'flex',
      fontFamily: 'var(--stepn-font-body), sans-serif'
    }}>
      <AdminSidebar />
      
      <div style={{ 
        flex: 1,
        marginLeft: '240px',
        padding: '32px',
        color: '#ffffff'
      }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold',
          marginBottom: '8px',
          fontFamily: 'var(--stepn-font-body)'
        }}>
          My Configurations 2D/3D
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: '#a0a0a0',
          fontFamily: 'var(--stepn-font-body)'
        }}>
          Gérez vos modèles 3D, designs 2D et patrons multi-tailles
        </p>
      </div>
      
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        borderBottom: '1px solid #1a1a1a',
        marginBottom: '32px'
      }}>
        <button
          onClick={() => setActiveTab("3d-models")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "3d-models" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "3d-models" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "3d-models") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "3d-models") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          🎨 3D Models
        </button>
        <button
          onClick={() => setActiveTab("2d-designs")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "2d-designs" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "2d-designs" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "2d-designs") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "2d-designs") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          🎨 2D Designs
        </button>
        <button
          onClick={() => setActiveTab("2d-patterns")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "2d-patterns" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "2d-patterns" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "2d-patterns") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "2d-patterns") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          📐 2D Patterns
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "3d-models" && <ModelsConfigPage />}
        {activeTab === "2d-designs" && <DesignsConfigPage />}
        {activeTab === "2d-patterns" && <PatternsConfigPage />}
      </div>
      </div>
    </div>
  );
}

