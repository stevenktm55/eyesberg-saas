"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ProductLink = {
  id: string;
  primary_product_id: string;
  primary_design_id: string | null;
  linked_product_id: string;
  linked_design_id: string | null;
  linked_variant_id: string | null;
  auto_apply_colors: boolean;
  created_at: string;
  updated_at: string;
};

type ShopifyProduct = {
  id: string;
  shopify_product_id: string;
  shopify_product_title: string | null;
  model_id?: string | null;
  design_id?: string | null;
  model_type?: string | null;
  modelLabel?: string | null;
  designLabel?: string | null;
};

type Model = {
  id: string;
  name: string;
};

type Design = {
  id: string;
  name: string;
};

type FormState = {
  primary_product_id: string;
  primary_design_id: string;
  linked_product_id: string;
  linked_design_id: string;
  linked_variant_id: string;
  auto_apply_colors: boolean;
};

const INITIAL_FORM: FormState = {
  primary_product_id: "",
  primary_design_id: "",
  linked_product_id: "",
  linked_design_id: "",
  linked_variant_id: "",
  auto_apply_colors: true,
};

export default function ProductLinksAdminPage() {
  const [links, setLinks] = useState<ProductLink[]>([]);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setIsLoading(true);
    setError(null);
    try {
    const [
      linksRes,
      productsRes,
      designsRes,
      modelsRes,
      mappingsRes,
    ] = await Promise.all([
        fetch("/api/product-links"),
        fetch("/api/shopify-products"),
        fetch("/api/designs"),
      fetch("/api/models"),
      fetch("/api/product-mappings"),
      ]);

      if (!linksRes.ok) {
        throw new Error("Impossible de charger les liaisons produit");
      }

      const linksJson = await linksRes.json();
      setLinks(Array.isArray(linksJson) ? linksJson : []);

      const designsJson = designsRes.ok ? await designsRes.json() : [];
      const designsList: Design[] = (Array.isArray(designsJson) ? designsJson : []).map(
        (design: any) => ({
          id: design.id,
          name: design.name || design.id,
        })
      );
      setDesigns(designsList);

      const modelsJson = modelsRes.ok ? await modelsRes.json() : [];
      const modelItems = Array.isArray(modelsJson?.items)
        ? modelsJson.items
        : Array.isArray(modelsJson)
        ? modelsJson
        : [];
      const modelsList: Model[] = modelItems.map((model: any) => ({
        id: model.id,
        name: model.name || model.fileName || model.id,
      }));
      setModels(modelsList);

      const productMappingsJson = mappingsRes.ok ? await mappingsRes.json() : [];
      const mappingsByProduct = new Map<string, any>();
      if (Array.isArray(productMappingsJson)) {
        for (const mapping of productMappingsJson) {
          if (mapping?.shopify_product_id) {
            mappingsByProduct.set(mapping.shopify_product_id, mapping);
          }
        }
      }

      if (productsRes.ok) {
        const productsJson = await productsRes.json();
        const designMap = new Map(designsList.map((design) => [design.id, design.name]));
        const modelMap = new Map(modelsList.map((model) => [model.id, model.name]));

        const normalizedProducts = (Array.isArray(productsJson)
          ? productsJson
          : []
        ).map((item: any) => {
          const productId = item.shopify_product_id;
          const title =
            item.shopify_product_title ||
            item.title ||
            item.name ||
            productId;
          const mapping = mappingsByProduct.get(productId);
          const modelId = item.model_id ?? mapping?.model_id ?? null;
          const designId = item.design_id ?? mapping?.design_ids?.[0] ?? null;
          const modelType =
            item.model_type ?? mapping?.model_type ?? null;
          const designNames =
            mapping?.design_ids && Array.isArray(mapping.design_ids)
              ? mapping.design_ids
                  .map((id: string) => designMap.get(id) || id)
                  .slice(0, 3)
                  .join(", ")
              : null;

          return {
            id: item.id,
            shopify_product_id: productId,
            shopify_product_title: title,
            model_id: modelId,
            design_id: designId,
            model_type: modelType,
            modelLabel: modelId ? modelMap.get(modelId) || null : null,
            designLabel:
              designNames ||
              (designId ? designMap.get(designId) || null : null),
          };
        });

        setProducts(normalizedProducts);
      }
    } catch (err: any) {
      console.error("Erreur chargement product-links:", err);
      setError(err?.message || "Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  }

const productById = useMemo(() => {
  const map = new Map<string, ShopifyProduct>();
  products.forEach((product) => {
    map.set(product.shopify_product_id, product);
  });
  return map;
}, [products]);

const designLabel = useMemo(() => {
  const map = new Map<string, string>();
  designs.forEach((design) => {
    map.set(design.id, design.name);
  });
  return map;
}, [designs]);

function getProductDisplay(productId: string | null | undefined) {
  if (!productId) return '—';
  const product = productById.get(productId);
  if (!product) return productId;
  const baseLabel =
    product.shopify_product_title && product.shopify_product_title !== productId
      ? product.shopify_product_title
      : product.designLabel || product.model_type || productId;
  const pieces: string[] = [];
  pieces.push(baseLabel);
  if (product.modelLabel || product.model_type) {
    pieces.push(product.modelLabel || product.model_type || '');
  }
  if (product.designLabel) {
    pieces.push(product.designLabel);
  }
  return pieces.filter(Boolean).join(' · ');
}

function getProductDescription(productId: string | null | undefined) {
  if (!productId) return null;
  const product = productById.get(productId);
  if (!product) return null;
  const parts: string[] = [];
  if (product.modelLabel || product.model_type) {
    parts.push(
      `Modèle : ${product.modelLabel || product.model_type || '—'}`
    );
  }
  if (product.designLabel) parts.push(`Design : ${product.designLabel}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  }

  function startEdit(link: ProductLink) {
    setEditingId(link.id);
    setForm({
      primary_product_id: link.primary_product_id,
      primary_design_id: link.primary_design_id || "",
      linked_product_id: link.linked_product_id,
      linked_design_id: link.linked_design_id || "",
      linked_variant_id: link.linked_variant_id || "",
      auto_apply_colors: link.auto_apply_colors ?? true,
    });
    setSuccess(null);
    setError(null);
    document.getElementById("product-links-form")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.primary_product_id || !form.linked_product_id) {
      setError("Les identifiants produit sont obligatoires");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: ProductLink & Partial<FormState> = {
        id: editingId ?? "",
        primary_product_id: form.primary_product_id.trim(),
        primary_design_id: form.primary_design_id?.trim() || null,
        linked_product_id: form.linked_product_id.trim(),
        linked_design_id: form.linked_design_id?.trim() || null,
        linked_variant_id: form.linked_variant_id?.trim() || null,
        auto_apply_colors: form.auto_apply_colors,
        created_at: "",
        updated_at: "",
      };

      const response = await fetch("/api/product-links", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId
            ? { ...payload, id: editingId }
            : {
                primary_product_id: payload.primary_product_id,
                primary_design_id: payload.primary_design_id,
                linked_product_id: payload.linked_product_id,
                linked_design_id: payload.linked_design_id,
                linked_variant_id: payload.linked_variant_id,
                auto_apply_colors: payload.auto_apply_colors,
              }
        ),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || "Erreur lors de la sauvegarde");
      }

      setSuccess(
        editingId
          ? "Liaison mise à jour avec succès"
          : "Liaison créée avec succès"
      );
      resetForm();
      await loadAll();
    } catch (err: any) {
      console.error("Erreur sauvegarde product-link:", err);
      setError(err?.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette liaison ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/product-links?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || "Erreur lors de la suppression");
      }

      await loadAll();
    } catch (err: any) {
      console.error("Erreur suppression product-link:", err);
      alert(err?.message || "Erreur lors de la suppression");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Retour à l&apos;admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              🔗 Liaisons entre produits
            </h1>
            <p className="text-gray-600 mt-2">
              Configurez des produits complémentaires (ex: maillot → pantalon) qui se suivent dans le parcours de personnalisation.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              document.getElementById("product-links-form")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nouvelle liaison
          </button>
        </div>

        <section
          id="product-links-form"
          className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4"
        >
          <h2 className="text-xl font-semibold text-gray-900">
            {editingId ? "Modifier la liaison" : "Créer une nouvelle liaison"}
          </h2>

          {error && (
            <div className="p-3 text-sm rounded bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm rounded bg-green-50 border border-green-200 text-green-700">
              {success}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produit principal *
                </label>
                <select
                  value={form.primary_product_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      primary_product_id: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    — Sélectionner un produit configuré —
                  </option>
                  {products.map((product) => (
                    <option
                      key={product.shopify_product_id}
                      value={product.shopify_product_id}
                    >
                      {getProductDisplay(product.shopify_product_id)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Le produit doit être déclaré dans l’onglet “Produits Shopify”.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design principal (optionnel)
                </label>
                <select
                  value={form.primary_design_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      primary_design_id: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les déclinaisons</option>
                  {designs.map((design) => (
                    <option key={design.id} value={design.id}>
                      {design.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produit lié *
                </label>
                <select
                  value={form.linked_product_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      linked_product_id: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    — Sélectionner un produit configuré —
                  </option>
                  {products.map((product) => (
                    <option
                      key={product.shopify_product_id}
                      value={product.shopify_product_id}
                    >
                      {getProductDisplay(product.shopify_product_id)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Utilise un produit configuré dans l’onglet “Produits Shopify”.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design à pré-sélectionner (optionnel)
                </label>
                <select
                  value={form.linked_design_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      linked_design_id: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Utiliser le premier design disponible</option>
                  {designs.map((design) => (
                    <option key={design.id} value={design.id}>
                      {design.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variante Shopify par défaut (optionnel)
                </label>
                <input
                  type="text"
                  value={form.linked_variant_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      linked_variant_id: event.target.value,
                    }))
                  }
                  placeholder="gid://shopify/ProductVariant/123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center mt-6">
                <input
                  id="auto-apply-colors"
                  type="checkbox"
                  checked={form.auto_apply_colors}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      auto_apply_colors: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="auto-apply-colors"
                  className="ml-2 text-sm text-gray-700"
                >
                  Copier automatiquement les couleurs du produit principal
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {isSaving
                  ? "Enregistrement..."
                  : editingId
                  ? "Mettre à jour la liaison"
                  : "Créer la liaison"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Liaisons existantes ({links.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">
              Chargement des liaisons...
            </div>
          ) : links.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucune liaison configurée pour le moment.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {links.map((link) => (
                <li key={link.id} className="p-6 space-y-2">
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wide">
                        Produit principal
                      </div>
                      <div className="text-base font-medium text-gray-900">
                        {getProductDisplay(link.primary_product_id)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {link.primary_product_id}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getProductDescription(link.primary_product_id) ||
                          (link.primary_design_id
                            ? `Design sélectionné : ${
                                designLabel.get(link.primary_design_id) ||
                                link.primary_design_id
                              }`
                            : 'Toutes les déclinaisons')}
                      </div>
                    </div>

                    <div className="text-2xl text-gray-400">→</div>

                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wide">
                        Produit lié
                      </div>
                      <div className="text-base font-medium text-gray-900">
                        {getProductDisplay(link.linked_product_id)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {link.linked_product_id}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getProductDescription(link.linked_product_id) ||
                          (link.linked_design_id
                            ? `Design à pré-sélectionner : ${
                                designLabel.get(link.linked_design_id) ||
                                link.linked_design_id
                              }`
                            : 'Premier design autorisé')}
                      </div>
                      {link.linked_variant_id && (
                        <div className="text-xs text-gray-500">
                          Variante par défaut: {link.linked_variant_id}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        link.auto_apply_colors
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {link.auto_apply_colors
                        ? "Couleurs copiées automatiquement"
                        : "Couleurs non copiées"}
                    </span>

                    <div className="flex gap-4 text-sm">
                      <button
                        onClick={() => startEdit(link)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

