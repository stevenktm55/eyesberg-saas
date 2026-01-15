"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import ModelsConfigPage from "./3d-models/page";
import MaterialMapsConfigPage from "./material-maps/page";
import SizesConfigPage from "./sizes/page";
import DesignsConfigPage from "./2d-designs/page";
import ColorsConfigPage from "./colors/page";
import FontsConfigPage from "./fonts/page";
import LogosConfigPage from "./logos/page";
import ZonesConfigPage from "./zones/page";
import SnapLinesConfigPage from "./snap-lines/page";
import SvgColorMapperPage from "../svg-color-mapper/page";

type Tab = "3d-models" | "material-maps" | "sizes" | "2d-designs" | "colors" | "fonts" | "logos" | "zones" | "snap-lines" | "svg-color-mapper";

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
          Gérez votre bibliothèque de ressources : modèles 3D, textures, tailles et designs. Ces éléments seront réutilisables lors de la création de produits.
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
            backgroundColor: activeTab === "3d-models" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
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
          Modèles 3D
        </button>
        <button
          onClick={() => setActiveTab("material-maps")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "material-maps" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "material-maps" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: activeTab === "material-maps" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "material-maps") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "material-maps") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          Material Maps
        </button>
        <button
          onClick={() => setActiveTab("sizes")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "sizes" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "sizes" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: activeTab === "sizes" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "sizes") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "sizes") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          Tailles
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
            backgroundColor: activeTab === "2d-designs" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
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
          Designs 2D
        </button>
        <button
          onClick={() => setActiveTab("colors")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "colors" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "colors" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: activeTab === "colors" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "colors") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "colors") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          Couleurs
        </button>
        <button
          onClick={() => setActiveTab("fonts")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "fonts" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "fonts" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: activeTab === "fonts" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "fonts") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "fonts") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          Fonts
        </button>
        <button
          onClick={() => setActiveTab("logos")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "logos" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "logos" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: activeTab === "logos" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "logos") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "logos") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          Logos
        </button>
        <button
          onClick={() => setActiveTab("zones")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "zones" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "zones" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: activeTab === "zones" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "zones") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "zones") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          Zones
        </button>
        <button
          onClick={() => setActiveTab("snap-lines")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "snap-lines" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "snap-lines" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: activeTab === "snap-lines" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "snap-lines") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "snap-lines") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          Snap Lines
        </button>
        <button
          onClick={() => setActiveTab("svg-color-mapper")}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--stepn-font-body)',
            color: activeTab === "svg-color-mapper" ? '#8eff36' : '#a0a0a0',
            borderBottom: activeTab === "svg-color-mapper" ? '2px solid #8eff36' : '2px solid transparent',
            backgroundColor: activeTab === "svg-color-mapper" ? 'rgba(142, 255, 54, 0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "svg-color-mapper") {
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "svg-color-mapper") {
              e.currentTarget.style.color = '#a0a0a0';
            }
          }}
        >
          SVG Color Mapper
        </button>
      </div>

        {/* Content */}
        <div>
          {activeTab === "3d-models" && <ModelsConfigPage />}
          {activeTab === "material-maps" && <MaterialMapsConfigPage />}
          {activeTab === "sizes" && <SizesConfigPage />}
          {activeTab === "2d-designs" && <DesignsConfigPage />}
          {activeTab === "colors" && <ColorsConfigPage />}
          {activeTab === "fonts" && <FontsConfigPage />}
          {activeTab === "logos" && <LogosConfigPage />}
          {activeTab === "zones" && <ZonesConfigPage />}
          {activeTab === "snap-lines" && <SnapLinesConfigPage />}
          {activeTab === "svg-color-mapper" && <SvgColorMapperPage />}
        </div>
      </div>
    </div>
  );
}

