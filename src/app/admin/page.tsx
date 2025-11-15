"use client";
import { useState } from "react";
import Link from "next/link";
import ModelsAdminPage from "./models/page";
import DesignsAdminPage from "./designs/page";
import ColorsAdminPage from "./colors/page";
import FontsAdminPage from "./fonts/page";

export default function AdminUnifiedPage() {
  const [section, setSection] = useState<"models" | "designs" | "colors" | "fonts">("models");
  return (
    <div className="grid grid-cols-[220px_1fr] h-[calc(100vh-64px)]">
      <aside className="border-r p-4 space-y-2 bg-gray-50">
        <div className="text-sm font-semibold mb-2 text-gray-800">Admin</div>
        <button
          className={`w-full text-left px-3 py-2 rounded border text-gray-800 ${section === "models" ? "bg-gray-200" : "bg-white"}`}
          onClick={() => setSection("models")}
        >Modèles</button>
        <button
          className={`w-full text-left px-3 py-2 rounded border text-gray-800 ${section === "designs" ? "bg-gray-200" : "bg-white"}`}
          onClick={() => setSection("designs")}
        >Designs</button>
        <button
          className={`w-full text-left px-3 py-2 rounded border text-gray-800 ${section === "colors" ? "bg-gray-200" : "bg-white"}`}
          onClick={() => setSection("colors")}
        >Couleurs</button>
        <button
          className={`w-full text-left px-3 py-2 rounded border text-gray-800 ${section === "fonts" ? "bg-gray-200" : "bg-white"}`}
          onClick={() => setSection("fonts")}
        >Typographies</button>
        <Link 
          href="/admin/orders"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors font-bold"
        >
          📦 Commandes
        </Link>
        <Link 
          href="/admin/text-zones"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          🎯 Zones de texte
        </Link>
        <Link 
          href="/admin/snap-lines"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          🧲 Lignes magnétiques
        </Link>
        <Link 
          href="/admin/fonts"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          🔤 Typographies
        </Link>
        <Link 
          href="/admin/logos"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          🖼️ Logos
        </Link>
        <Link 
          href="/admin/material-maps"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          🗺️ Texture Maps
        </Link>
        <Link 
          href="/admin/sizes"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          📏 Tailles
        </Link>
        <Link 
          href="/admin/products"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          🛍️ Produits Shopify
        </Link>
        <Link 
          href="/admin/product-links"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          🔗 Liaisons Produits
        </Link>
        <Link 
          href="/admin/material-maps"
          className="block w-full text-left px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition-colors"
        >
          🗺️ Material Maps
        </Link>
      </aside>
      <main className="p-4 overflow-auto">
        {section === "models" && <ModelsAdminPage />}
        {section === "designs" && <DesignsAdminPage />}
        {section === "colors" && <ColorsAdminPage />}
        {section === "fonts" && <FontsAdminPage />}
      </main>
    </div>
  );
}


