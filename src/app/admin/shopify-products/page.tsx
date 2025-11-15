'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Model {
  id: string;
  name: string;
  fileUrl: string;
}

interface Design {
  id: string;
  name: string;
  svgUrl: string;
}

interface ShopifyProduct {
  id: string;
  shopify_product_id: string;
  shopify_product_title: string;
  model_id: string | null;
  design_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  model?: Model;
  design?: Design;
}

export default function ShopifyProductsPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopifyProduct | null>(null);
  const [formData, setFormData] = useState({
    shopify_product_id: '',
    shopify_product_title: '',
    model_id: '',
    design_id: '',
    active: true
  });

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, modelsRes, designsRes] = await Promise.all([
        fetch('/api/shopify-products'),
        fetch('/api/models'),
        fetch('/api/designs')
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData.filter((m: any) => m.active));
      }

      if (designsRes.ok) {
        const designsData = await designsRes.json();
        setDesigns(designsData.filter((d: any) => d.active));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProduct ? '/api/shopify-products' : '/api/shopify-products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const body = editingProduct 
        ? { id: editingProduct.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadData();
        setShowAddModal(false);
        setEditingProduct(null);
        setFormData({
          shopify_product_id: '',
          shopify_product_title: '',
          model_id: '',
          design_id: '',
          active: true
        });
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (product: ShopifyProduct) => {
    setEditingProduct(product);
    setFormData({
      shopify_product_id: product.shopify_product_id,
      shopify_product_title: product.shopify_product_title,
      model_id: product.model_id || '',
      design_id: product.design_id || '',
      active: product.active
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette association ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/shopify-products?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({
      shopify_product_id: '',
      shopify_product_title: '',
      model_id: '',
      design_id: '',
      active: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/admin" 
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← Retour à l'admin
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                🛍️ Associations Produits Shopify
              </h1>
              <p className="text-gray-600 mt-2">
                Associez des modèles 3D et des designs à vos produits Shopify
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une association
            </button>
          </div>
        </div>

        {/* Liste des associations */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit Shopify
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modèle 3D
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Design
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const fallbackModel = !product.model && product.model_id ? models.find(m => m.id === product.model_id) : null;
                  const fallbackDesign = !product.design && product.design_id ? designs.find(d => d.id === product.design_id) : null;
                  return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">
                          {product.shopify_product_title}
                        </div>
                        <div className="text-sm text-black">
                          ID: {product.shopify_product_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(product.model || fallbackModel) ? (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs text-black">3D</span>
                          </div>
                          <div className="text-sm text-black">
                            {(product.model || fallbackModel)?.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-black">Aucun modèle</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(product.design || fallbackDesign) ? (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            {(product.design || fallbackDesign)?.svgUrl ? (
                              <Image
                                src={(product.design || fallbackDesign)!.svgUrl}
                                alt={(product.design || fallbackDesign)!.name}
                                width={48}
                                height={48}
                                className="object-contain"
                              />
                            ) : (
                              <span className="text-xs text-black">SVG</span>
                            )}
                          </div>
                          <div className="text-sm text-black">
                            {(product.design || fallbackDesign)?.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-black">Aucun design</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-black hover:text-gray-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-700 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune association</h3>
              <p className="text-gray-500 mb-4">
                Commencez par associer un produit Shopify à un modèle et un design.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter une association
              </button>
            </div>
          )}
        </div>

        {/* Modal d'ajout/modification */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {editingProduct ? 'Modifier l\'association' : 'Ajouter une association'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID du produit Shopify *
                    </label>
                    <input
                      type="text"
                      value={formData.shopify_product_id}
                      onChange={(e) => setFormData({...formData, shopify_product_id: e.target.value})}
                      placeholder="gid://shopify/Product/123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du produit Shopify *
                    </label>
                    <input
                      type="text"
                      value={formData.shopify_product_title}
                      onChange={(e) => setFormData({...formData, shopify_product_title: e.target.value})}
                      placeholder="T-shirt StretchMX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modèle 3D
                    </label>
                    <select
                      value={formData.model_id}
                      onChange={(e) => setFormData({...formData, model_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucun modèle</option>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Design
                    </label>
                    <select
                      value={formData.design_id}
                      onChange={(e) => setFormData({...formData, design_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucun design</option>
                      {designs.map((design) => (
                        <option key={design.id} value={design.id}>
                          {design.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                      Association active
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingProduct ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
