"use client";

import { useState, useEffect } from "react";

type Product = {
  id: string;
  productGid: string;
  handle: string;
  productionTemplates?: Record<string, string> | null;
};

type Size = "S" | "M" | "L" | "XL" | "XXL";

const SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

export default function ProductionFilesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Erreur chargement produits:", error);
      alert("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(size: Size, productId: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setUploading((prev) => ({ ...prev, [`${productId}-${size}`]: true }));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("productId", productId);
        formData.append("size", size);

        const res = await fetch("/api/admin/upload-template", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await res.json();
        console.log("✅ Template uploadé:", result);

        // Recharger les produits pour mettre à jour l'affichage
        await loadProducts();
      } catch (error: any) {
        console.error("❌ Erreur upload:", error);
        alert("Erreur lors de l'upload: " + error.message);
      } finally {
        setUploading((prev) => ({ ...prev, [`${productId}-${size}`]: false }));
      }
    };
    input.click();
  }

  function hasTemplate(product: Product, size: Size): boolean {
    return !!(product.productionTemplates && product.productionTemplates[size]);
  }

  function getTemplateUrl(product: Product, size: Size): string | null {
    return product.productionTemplates?.[size] || null;
  }

  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null;

  return (
    <div style={{ minHeight: '100vh', padding: '32px', color: '#ffffff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            📄 Production Files - Templates de Production
          </h2>
          <p style={{ fontSize: '14px', color: '#a0a0a0' }}>
            Gérez les fichiers templates SVG par taille pour chaque produit
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#a0a0a0' }}>
            <p>Chargement des produits...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Sélection du produit */}
            <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '8px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Sélectionner un produit
              </label>
              <select
                value={selectedProductId || ""}
                onChange={(e) => setSelectedProductId(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#000000',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Choisir un produit --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.handle} ({product.productGid})
                  </option>
                ))}
              </select>
            </div>

            {/* Gestion des templates par taille */}
            {selectedProduct && (
              <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                  Templates pour: {selectedProduct.handle}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {SIZES.map((size) => {
                    const hasFile = hasTemplate(selectedProduct, size);
                    const fileUrl = getTemplateUrl(selectedProduct, size);
                    const isUploading = uploading[`${selectedProduct.id}-${size}`];

                    return (
                      <div
                        key={size}
                        style={{
                          border: '1px solid #333',
                          borderRadius: '8px',
                          padding: '16px',
                          backgroundColor: '#000000'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px', fontWeight: '600' }}>
                              Taille {size}
                            </span>
                            {hasFile ? (
                              <span style={{ color: '#8eff36', fontSize: '14px' }}>✅</span>
                            ) : (
                              <span style={{ color: '#ff4444', fontSize: '14px' }}>❌</span>
                            )}
                          </div>
                        </div>

                        {hasFile && fileUrl && (
                          <div style={{ marginBottom: '12px' }}>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '12px', color: '#8eff36', textDecoration: 'underline', wordBreak: 'break-all' }}
                            >
                              Voir le fichier
                            </a>
                          </div>
                        )}

                        <button
                          onClick={() => handleUpload(size, selectedProduct.id)}
                          disabled={isUploading}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: 'none',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            backgroundColor: isUploading
                              ? '#333'
                              : hasFile
                              ? '#8eff36'
                              : '#444',
                            color: isUploading ? '#666' : '#000',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isUploading
                            ? "⏳ Upload..."
                            : hasFile
                            ? "🔄 Remplacer"
                            : "📤 Uploader Gabarit SVG"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!selectedProduct && products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#a0a0a0' }}>
                <p>Aucun produit disponible</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
