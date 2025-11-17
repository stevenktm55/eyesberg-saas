'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

interface Order {
  orderNumber: number;
  ecommerceOrder: string;
  onlineStore: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  date: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    async function loadOrders() {
      try {
        // Récupérer le sous-domaine
        const host = window.location.host;
        const subdomainMatch = host.match(/^([^.]+)\./);
        const detectedSubdomain = subdomainMatch ? subdomainMatch[1] : null;
        
        if (!detectedSubdomain) {
          setError('Subdomain not detected');
          setLoading(false);
          return;
        }

        // Récupérer les infos de la boutique
        const shopResponse = await fetch(`/api/accounts/shop?subdomain=${detectedSubdomain}`);
        if (shopResponse.status === 404) {
          setError('No shop connected');
          setLoading(false);
          return;
        }
        
        if (!shopResponse.ok) {
          throw new Error('Failed to load shop data');
        }

        const shopData = await shopResponse.json();
        if (!shopData.shop) {
          setError('No shop connected');
          setLoading(false);
          return;
        }

        const domain = shopData.shop.shop_domain;
        setShopDomain(domain);
        console.log('✅ Shop domain loaded:', domain);

        // Récupérer les commandes
        const ordersResponse = await fetch(
          `/api/shopify/orders?shop=${encodeURIComponent(shopData.shop.shop_domain)}&page=${page}&limit=${rowsPerPage}`
        );

        if (!ordersResponse.ok) {
          throw new Error('Failed to load orders');
        }

        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
        // Si il y a une erreur dans la réponse mais qu'on a des données, on l'affiche mais on continue
        if (ordersData.error && ordersData.orders?.length === 0) {
          setError(ordersData.error);
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Error loading orders:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Même en cas d'erreur, on affiche un tableau vide
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [page, rowsPerPage]);

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#8eff36';
      case 'pending':
        return '#ffa500';
      case 'refunded':
        return '#4a90e2';
      default:
        return '#a0a0a0';
    }
  };

  const getFulfillmentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fulfilled':
        return '#8eff36';
      case 'pending':
        return '#ffa500';
      case 'canceled':
      case 'cancelled':
        return '#ff4444';
      default:
        return '#a0a0a0';
    }
  };

  if (loading) {
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
          padding: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#ffffff' }}>Loading orders...</p>
        </div>
      </div>
    );
  }

  // Ne plus retourner une erreur, afficher le tableau même si vide

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
        padding: '40px',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <h1 className="stepn-title-ultrabold" style={{ 
              color: '#8eff36', 
              fontSize: '48px',
              fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif',
              margin: 0
            }}>
              Orders
            </h1>
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: '#8eff36',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Export
            </button>
          </div>

          {/* Error message if any */}
          {error && (
            <div style={{
              padding: '16px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #ff4444',
              borderRadius: '4px',
              marginBottom: '24px',
              color: '#ff4444',
              fontFamily: 'var(--stepn-font-body)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              {error.includes('permission') || error.includes('reconnect') ? (
                <button
                  onClick={() => {
                    if (!shopDomain) {
                      alert('Shop domain not found. Please refresh the page.');
                      return;
                    }
                    
                    console.log('🔄 Reinstalling app for shop:', shopDomain);
                    const installUrl = `/api/shopify/install?shop=${encodeURIComponent(shopDomain)}`;
                    console.log('📍 Install URL:', installUrl);
                    
                    // Rediriger directement vers l'URL d'installation
                    window.location.href = installUrl;
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#8eff36',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'var(--stepn-font-body)',
                    marginLeft: '16px'
                  }}
                >
                  Reinstall App
                </button>
              ) : null}
            </div>
          )}

          {/* Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Q Order"
              style={{
                padding: '12px 16px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '16px',
                fontFamily: 'var(--stepn-font-body)',
                outline: 'none',
                minWidth: '200px'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#8eff36'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
            />
            <button style={{
              padding: '12px 16px',
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'var(--stepn-font-body)',
              cursor: 'pointer'
            }}>
              Created
            </button>
            <button style={{
              padding: '12px 16px',
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'var(--stepn-font-body)',
              cursor: 'pointer'
            }}>
              Status
            </button>
            <button style={{
              padding: '12px 16px',
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'var(--stepn-font-body)',
              cursor: 'pointer'
            }}>
              Payment
            </button>
            <button style={{
              padding: '12px 16px',
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'var(--stepn-font-body)',
              cursor: 'pointer'
            }}>
              Online stores
            </button>
          </div>

          {/* Table */}
          <div style={{
            backgroundColor: '#0a0a0a',
            borderRadius: '8px',
            border: '1px solid #1a1a1a',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    ORDER
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    ECOMMERCE ORDER
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    ONLINE STORE
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    PAYMENT
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    STATUS
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    TOTAL
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    textAlign: 'left',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    DATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#a0a0a0' }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{
                        padding: '16px 24px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '16px'
                      }}>
                        {order.orderNumber}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '16px'
                      }}>
                        {order.ecommerceOrder}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '16px'
                      }}>
                        {order.onlineStore}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          backgroundColor: getPaymentStatusColor(order.paymentStatus),
                          color: '#000000',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontFamily: 'var(--stepn-font-body)',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          backgroundColor: getFulfillmentStatusColor(order.fulfillmentStatus),
                          color: '#000000',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontFamily: 'var(--stepn-font-body)',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {order.fulfillmentStatus || 'Pending'}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '16px'
                      }}>
                        €{order.total.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '16px'
                      }}>
                        {order.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#a0a0a0', fontFamily: 'var(--stepn-font-body)' }}>
                Rows per page:
              </span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--stepn-font-body)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#a0a0a0', fontFamily: 'var(--stepn-font-body)' }}>
                {((page - 1) * rowsPerPage) + 1}-{Math.min(page * rowsPerPage, orders.length)} of {orders.length}
              </span>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 12px',
                  backgroundColor: page === 1 ? '#1a1a1a' : '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '4px',
                  color: page === 1 ? '#666' : '#ffffff',
                  fontSize: '16px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)'
                }}
              >
                ←
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={orders.length < rowsPerPage}
                style={{
                  padding: '8px 12px',
                  backgroundColor: orders.length < rowsPerPage ? '#1a1a1a' : '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '4px',
                  color: orders.length < rowsPerPage ? '#666' : '#ffffff',
                  fontSize: '16px',
                  cursor: orders.length < rowsPerPage ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)'
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
