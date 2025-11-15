'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Preview3DGenerator } from '@/components/Preview3DGenerator';

interface Configuration {
  id: string;
  order_number?: number;
  customer_name?: string;
  customer_email?: string;
  shopify_order_id?: string;
  shopify_order_name?: string;
  product_name?: string;
  size?: string;
  cart_token?: string;
  cart_created_at?: string;
  preview_image_url?: string;
  preview_images?: string[]; // 4 vues: front, back, left, right
  config_data: any;
  status: 'draft' | 'saved' | 'ordered';
  created_at: string;
  updated_at: string;
}

interface ShopifyOrder {
  shopify_order_id: string;
  shopify_order_name: string;
  total_amount?: number;
  date: string;
  customer_email?: string;
  configurations: Configuration[];
}

export default function OrdersPage() {
  const [shopifyOrders, setShopifyOrders] = useState<ShopifyOrder[]>([]);
  const [standaloneConfigs, setStandaloneConfigs] = useState<Configuration[]>([]);
  const [filter, setFilter] = useState<'all' | 'ordered' | 'saved'>('ordered');
  const [sortOrder, setSortOrder] = useState<'date' | 'order'>('date'); // Tri par date ou par numéro
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | null>(null);
  const [configsData, setConfigsData] = useState<Map<string, any>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const configsPerPage = 50;

  // Charger les commandes
  useEffect(() => {
    setCurrentPage(1); // Reset à la page 1 quand le filtre change
  }, [filter, sortOrder]);

  // Recharger quand le filtre, le tri ou la page change
  useEffect(() => {
    loadOrders();
  }, [filter, sortOrder, currentPage]);

  // Charger config_data pour les configurations du modal
  useEffect(() => {
    if (selectedOrder) {
      loadConfigsData(selectedOrder.configurations);
    }
  }, [selectedOrder]);

  async function loadConfigsData(configs: Configuration[]) {
    try {
      const configIds = configs.map(c => c.id);
      const { data, error } = await supabase
        .from('configurations')
        .select('id, config_data')
        .in('id', configIds);

      if (!error && data) {
        console.log('📦 Configurations chargées:', data.length);
        const newConfigsData = new Map<string, any>();
        data.forEach((config: any) => {
          newConfigsData.set(config.id, config.config_data);
          console.log(`📦 Config ${config.id} - colors:`, config.config_data?.colors);
        });
        setConfigsData(newConfigsData);
      } else {
        console.error('❌ Erreur chargement config_data:', error);
      }
    } catch (error) {
      console.error('❌ Erreur chargement config_data:', error);
    }
  }

  async function loadOrders() {
    setIsLoading(true);
    try {
      // Construire la requête de base pour compter le total
      let countQuery = supabase
          .from('configurations')
        .select('id', { count: 'exact', head: true })
        .not('order_number', 'is', null); // Seulement les configs du configurateur

      // Appliquer les mêmes filtres pour le count
      if (filter === 'ordered') {
        countQuery = countQuery.not('shopify_order_id', 'is', null);
      } else if (filter === 'saved') {
        countQuery = countQuery.eq('status', 'saved').is('shopify_order_id', null);
      }

      // Compter le total
      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Erreur comptage:', countError);
          } else {
        setTotalCount(count || 0);
        console.log(`📊 Total de configurations: ${count || 0}`);
          }
          
      // Construire la requête pour récupérer les données paginées
      let query = supabase
            .from('configurations')
            .select('id, customer_email, shopify_order_id, shopify_order_name, cart_created_at, customer_name, preview_image_url, created_at, updated_at, order_number, status')
        .not('order_number', 'is', null); // Seulement les configs du configurateur

      // Filtrer directement en base selon le filtre sélectionné
      if (filter === 'ordered') {
        // Commandes Shopify : celles avec shopify_order_id (priorité) OU status='ordered'
        // On filtre d'abord par shopify_order_id car c'est le plus fiable
        query = query.not('shopify_order_id', 'is', null);
        console.log('🔍 Filtre: Commandes Shopify (shopify_order_id IS NOT NULL)');
      } else if (filter === 'saved') {
        // Configurations sauvegardées : celles avec status='saved' ET pas de shopify_order_id
        query = query.eq('status', 'saved').is('shopify_order_id', null);
        console.log('🔍 Filtre: Configurations sauvegardées (status=saved, shopify_order_id=NULL)');
      }
      // Si filter === 'all', on ne filtre pas par status/shopify_order_id

      // Trier par date de création décroissante (plus récentes en premier)
      query = query.order('created_at', { ascending: false });
      
      // Pagination : récupérer seulement les configs de la page actuelle
      const from = (currentPage - 1) * configsPerPage;
      const to = from + configsPerPage - 1;
      query = query.range(from, to);
      console.log(`📄 Page ${currentPage}: récupération des configs ${from} à ${to}`);

      const { data, error } = await query;

      if (error) {
        console.error('Erreur chargement commandes:', error);
        console.error('Détails erreur:', JSON.stringify(error, null, 2));
        alert(`Erreur lors du chargement des commandes : ${error.message}`);
        return;
      }

      let configs = data || [];
      console.log(`📦 ${configs.length} configuration(s) récupérée(s) depuis la base`);
      
      // Filtrer côté client pour le cas 'ordered' (fallback sur status='ordered' si pas de shopify_order_id)
      if (filter === 'ordered') {
        // Garder celles avec shopify_order_id OU status='ordered' (au cas où certaines n'ont pas shopify_order_id)
        const beforeFilter = configs.length;
        configs = configs.filter(config => 
          config.shopify_order_id || config.status === 'ordered'
        );
        console.log(`📦 Après filtrage côté client: ${configs.length} config(s) (${beforeFilter - configs.length} exclue(s))`);
      }
      // Pour 'saved' et 'all', le filtrage en base est suffisant
      
      // Grouper par shopify_order_id
      const orderGroups = new Map<string, Configuration[]>();
      const standalone: Configuration[] = [];
      
      configs.forEach(config => {
        // Grouper si on a un shopify_order_id (car on a déjà filtré par order_number)
        if (config.shopify_order_id) {
          if (!orderGroups.has(config.shopify_order_id)) {
            orderGroups.set(config.shopify_order_id, []);
          }
          orderGroups.get(config.shopify_order_id)!.push(config);
        } else {
          standalone.push(config);
        }
      });
      
      console.log(`📦 Groupement terminé: ${orderGroups.size} commande(s) Shopify, ${standalone.length} config(s) standalone`);
      
      // Convertir en ShopifyOrder[]
      const shopifyOrdersList: ShopifyOrder[] = Array.from(orderGroups.entries()).map(([orderId, configs]) => {
        const firstConfig = configs[0];
        console.log(`📦 Commande ${orderId} : ${configs.length} produit(s)`);
        const totalAmount = configs.reduce((sum, config) => {
          // Calculer le prix depuis les propriétés de la config ou un prix par défaut
          const price = 89.99; // Prix par défaut
          return sum + price;
        }, 0);
        
        // Si shopify_order_name n'existe pas, utiliser shopify_order_id comme référence
        const displayName = firstConfig.shopify_order_name || `Commande ${orderId}`;
        
        return {
          shopify_order_id: orderId,
          shopify_order_name: displayName,
          total_amount: totalAmount,
          date: firstConfig.cart_created_at || firstConfig.created_at,
          customer_email: firstConfig.customer_email,
          configurations: configs.sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
        };
      });
      
      // Trier selon le mode de tri sélectionné
      shopifyOrdersList.sort((a, b) => {
        if (sortOrder === 'order') {
          // Trier par numéro de commande (extrait depuis shopify_order_id)
          const numA = parseInt(a.shopify_order_id) || 0;
          const numB = parseInt(b.shopify_order_id) || 0;
          return numB - numA; // Décroissant (plus récent en premier)
        } else {
          // Trier par date
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
      standalone.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log(`✅ Chargement terminé: ${shopifyOrdersList.length} commande(s) Shopify, ${standalone.length} config(s) standalone`);
      
      setShopifyOrders(shopifyOrdersList);
      setStandaloneConfigs(standalone);
      
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Exporter en SVG pour production
  async function exportToSVG(order: Configuration) {
    console.log('📥 Tentative export SVG pour configId:', order.id);
    try {
      console.log('📤 Envoi requête vers /api/export/svg avec body:', JSON.stringify({ configId: order.id }));
      const response = await fetch('/api/export/svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId: order.id })
      });

      console.log('📥 Réponse reçue:', response.status, response.statusText);

      if (response.ok) {
        const blob = await response.blob();
        console.log('✅ Blob créé, taille:', blob.size);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `production-${order.shopify_order_id || order.id}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('✅ Fichier téléchargé');
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur réponse:', response.status, errorText);
        alert(`Erreur lors de l'export SVG: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erreur export SVG:', error);
      alert('Erreur lors de l\'export');
    }
  }


  // Exporter en PNG haute résolution
  async function exportToPNG(order: Configuration) {
    try {
      const response = await fetch('/api/export/png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId: order.id })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `production-${order.shopify_order_id || order.id}.png`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        alert('Erreur lors de l\'export PNG');
      }
    } catch (error) {
      console.error('Erreur export PNG:', error);
      alert('Erreur lors de l\'export');
    }
  }

  // Exporter en PDF CMYK
  async function exportToPDF(order: Configuration) {
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId: order.id })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `production-${order.shopify_order_id || order.id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        console.log('✅ PDF téléchargé');
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur PDF:', errorText);
        alert(`Erreur lors de l'export PDF: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  }

  // Marquer comme traité
  async function markAsProcessed(orderId: string) {
    try {
      const { error } = await supabase
        .from('configurations')
        .update({ status: 'ordered' })
        .eq('id', orderId);

      if (error) {
        alert('Erreur lors de la mise à jour');
        return;
      }

      alert('Commande marquée comme traitée !');
      loadOrders();
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Commandes Clients</h1>
          <p className="text-gray-500 mt-1">Gérer les configurations et commandes</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Retour Admin
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('ordered')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'ordered'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            📦 Commandes Shopify ({shopifyOrders.length})
          </button>
          <button
            onClick={() => setFilter('saved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'saved'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            💾 Configs sauvegardées ({standaloneConfigs.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            📋 Toutes ({shopifyOrders.length + standaloneConfigs.length})
          </button>
        </div>
        
        {/* Bouton de tri */}
        {(filter === 'ordered' || filter === 'all') && (
          <button
            onClick={() => setSortOrder(sortOrder === 'date' ? 'order' : 'date')}
            className="px-4 py-2 rounded-lg border border-gray-300 text-black hover:bg-gray-100 transition-colors flex items-center gap-2"
            title={sortOrder === 'date' ? 'Trier par numéro de commande' : 'Trier par date'}
          >
            {sortOrder === 'date' ? '🔢 Par numéro' : '📅 Par date'}
          </button>
        )}
      </div>

      {/* Liste des commandes */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      ) : (shopifyOrders.length === 0 && standaloneConfigs.length === 0) ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">Aucune commande pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Commandes Shopify */}
          {filter === 'ordered' || filter === 'all' ? shopifyOrders.map((order) => (
            <div
              key={order.shopify_order_id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="p-6 flex items-center justify-between">
                {/* Infos principales */}
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-black">
                      {order.shopify_order_name}
                    </h3>
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                      ✓ Commandé
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
                    <span>📅 {new Date(order.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                    <span>📦 {order.configurations.length} produit(s)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    👁️ Voir détails
                  </button>
                </div>
              </div>
            </div>
          )) : null}

          {/* Configurations standalone (sans commande Shopify) */}
          {filter === 'saved' || filter === 'all' ? standaloneConfigs.map((config) => (
            <div
              key={config.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedOrder({
                shopify_order_id: config.id,
                shopify_order_name: `Config #${String(config.order_number || 'N/A').padStart(5, '0')}`,
                date: config.created_at,
                customer_email: config.customer_email,
                configurations: [config]
              })}
            >
              <div className="p-6 flex items-center justify-between">
                {/* Infos principales */}
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-black">
                      Config #{String(config.order_number || 'N/A').padStart(5, '0')}
                    </h3>
                    <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                      💾 Sauvegardé
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
                    <span>📅 {new Date(config.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                    <span className="text-orange-600">⚠️ Pas de commande Shopify</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/configure?config=${String(config.order_number || config.id).padStart(5, '0')}`}
                    target="_blank"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 Voir
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder({
                        shopify_order_id: config.id,
                        shopify_order_name: `Config #${String(config.order_number || 'N/A').padStart(5, '0')}`,
                        date: config.created_at,
                        customer_email: config.customer_email,
                        configurations: [config]
                      });
                    }}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    👁️ Voir détails
                  </button>
                </div>
              </div>
            </div>
          )) : null}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalCount > configsPerPage && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            ← Précédent
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.ceil(totalCount / configsPerPage) }, (_, i) => i + 1)
              .filter(page => {
                // Afficher la première page, la dernière, la page actuelle, et 2 pages de chaque côté
                const totalPages = Math.ceil(totalCount / configsPerPage);
                if (totalPages <= 7) return true; // Afficher toutes les pages si <= 7
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                );
              })
              .map((page, index, array) => {
                // Ajouter des ellipses si nécessaire
                const showEllipsis = index > 0 && page - array[index - 1] > 1;
                return (
                  <div key={page} className="flex items-center gap-1">
                    {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-black hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / configsPerPage), prev + 1))}
            disabled={currentPage >= Math.ceil(totalCount / configsPerPage)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage >= Math.ceil(totalCount / configsPerPage)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Suivant →
          </button>
          
          <span className="text-sm text-gray-600 ml-4">
            Page {currentPage} sur {Math.ceil(totalCount / configsPerPage)} ({totalCount} au total)
          </span>
        </div>
      )}

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">
                {selectedOrder.shopify_order_name}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedOrder.configurations.length} produit(s)
              </p>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations de la commande */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-black mb-3">Informations de la commande :</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Commande :</span> {selectedOrder.shopify_order_name}
                  </div>
                  <div>
                    <span className="font-medium">Date :</span> {new Date(selectedOrder.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Liste des configurations */}
              <div>
                <h3 className="font-bold text-black mb-3">Configurations ({selectedOrder.configurations.length}) :</h3>
                <div className="space-y-4">
                  {selectedOrder.configurations.map((config, index) => (
                    <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">
                            Config #{String(config.order_number || 'N/A').padStart(5, '0')}
                          </h4>
                          {config.product_name && (
                            <p className="text-sm text-gray-600 mt-1">
                              📦 {config.product_name}
                            </p>
                          )}
                          {config.size && (
                            <p className="text-sm text-gray-600 mt-1">
                              📏 Taille : <span className="font-semibold">{config.size}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/configure?config=${String(config.order_number || config.id).padStart(5, '0')}`}
                            target="_blank"
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                          >
                            🔗 Voir
                          </Link>
                          <button
                            onClick={() => exportToSVG(config)}
                            className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors text-sm"
                          >
                            🎨 SVG
                          </button>
                          <button
                            onClick={() => exportToPDF(config)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                          >
                            📄 PDF CMYK
                          </button>
                        </div>
                      </div>
                      
                      {/* Preview de la config */}
                      {config.preview_image_url && (
                        <div className="mb-4">
                          <img
                            src={config.preview_image_url}
                            alt="Preview"
                            className="w-32 h-32 object-contain border border-gray-300 rounded-lg"
                          />
                        </div>
                      )}
                      
                      {/* Noms des couleurs avec codes HEX */}
                      {configsData.get(config.id)?.colors && (
                        <div className="mb-4">
                          {(() => {
                            const colors = configsData.get(config.id)?.colors;
                            console.log(`🎨 Couleurs pour config ${config.id}:`, colors);
                            
                            // Afficher les couleurs : format tableau ou format objet
                            if (Array.isArray(colors)) {
                              // Format tableau : afficher toutes les couleurs avec hex
                              const validColors = colors.filter((c: any) => c && c.hex);
                              if (validColors.length > 0) {
                                return (
                                  <div className="text-black text-sm font-medium flex flex-wrap gap-3 items-center">
                                    🎨 
                                    {validColors.map((c: any, index: number) => {
                                      const name = c.name || `Couleur ${index + 1}`;
                                      return (
                                        <span key={index} className="flex items-center gap-1">
                                          <span className="inline-block w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: c.hex }}></span>
                                          <span>{name} ({c.hex})</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                );
                              }
                            } else if (typeof colors === 'object' && colors !== null) {
                              // Format objet : afficher toutes les couleurs (primary, secondary, etc.)
                              const colorEntries: Array<{name: string, hex: string}> = [];
                              if (colors.primary) colorEntries.push({ name: colors.primaryName || 'Primaire', hex: colors.primary });
                              if (colors.secondary) colorEntries.push({ name: colors.secondaryName || 'Secondaire', hex: colors.secondary });
                              if (colors.tertiary) colorEntries.push({ name: colors.tertiaryName || 'Tertiaire', hex: colors.tertiary });
                              if (colors.quaternary) colorEntries.push({ name: colors.quaternaryName || 'Quaternaire', hex: colors.quaternary });
                              if (colors.quinary) colorEntries.push({ name: colors.quinaryName || 'Quinaire', hex: colors.quinary });
                              
                              if (colorEntries.length > 0) {
                                return (
                                  <div className="text-black text-sm font-medium flex flex-wrap gap-3 items-center">
                                    🎨 
                                    {colorEntries.map((entry, index) => (
                                      <span key={index} className="flex items-center gap-1">
                                        <span className="inline-block w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: entry.hex }}></span>
                                        <span>{entry.name} ({entry.hex})</span>
                                      </span>
                                    ))}
                                  </div>
                                );
                              }
                            }
                            
                            // Si aucun format reconnu ou aucune couleur valide
                            return (
                              <div className="text-red-500 text-xs">⚠️ Format de couleur non supporté ou aucune couleur valide: {JSON.stringify(colors).substring(0, 100)}</div>
                            );
                          })()}
                        </div>
                      )}
                      
                      {/* Résumé de la config */}
                      <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                        {configsData.get(config.id)?.texts && configsData.get(config.id).texts.length > 0 && (
                          <p className="text-black">📝 {configsData.get(config.id).texts.length} texte(s)</p>
                        )}
                        {configsData.get(config.id)?.logos && configsData.get(config.id).logos.length > 0 && (
                          <p className="text-black">🖼️ {configsData.get(config.id).logos.length} logo(s)</p>
                        )}
                        {configsData.get(config.id)?.colors && (
                          <p className="text-black">🎨 {Array.isArray(configsData.get(config.id).colors) ? configsData.get(config.id).colors.filter((c: any) => c && c.hex).length : 'N/A'} couleur(s)</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>


            </div>
          </div>
        </div>
      )}
    </div>
  );
}

