"use client";

import { useState, useEffect } from "react";

interface ConnectPanelProps {
  productId: string;
  shop?: string;
}

interface ShopInfo {
  id: string;
  shop_domain: string;
  shop_name?: string;
  shop_email?: string;
  installed_at?: string;
}

interface ProductInfo {
  shopify_product_id: string;
  shopify_product_title: string;
  shopify_product_handle: string;
  shopify_product_image_url?: string;
}

export function ConnectPanel({ productId, shop }: ConnectPanelProps) {
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [productStartingPoint, setProductStartingPoint] = useState<string>("");
  const [designStartingPoint, setDesignStartingPoint] = useState<string>("");

  useEffect(() => {
    if (shop) {
      loadShopInfo();
      loadProductInfo();
    }
  }, [shop, productId]);

  const loadShopInfo = async () => {
    try {
      const response = await fetch(`/api/shopify/shop?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        setShopInfo(data);
      }
    } catch (error) {
      console.error("Error while loading shop info:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductInfo = async () => {
    try {
      const response = await fetch(`/api/shopify/products/${productId}?shop=${shop}`);
      if (response.ok) {
        const data = await response.json();
        setProductInfo(data.product);
        // Charger les starting points depuis la config si disponible
        if (data.config?.pricingConfig) {
          setProductStartingPoint(data.config.pricingConfig.productStartingPoint || "");
          setDesignStartingPoint(data.config.pricingConfig.designStartingPoint || "");
        }
      }
    } catch (error) {
      console.error("Error while loading product info:", error);
    }
  };

  const handleSaveStartingPoints = async () => {
    try {
      const response = await fetch(`/api/shopify/products/${productId}/config?shop=${shop}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricingConfig: {
            productStartingPoint: productStartingPoint,
            designStartingPoint: designStartingPoint,
          },
        }),
      });
      if (response.ok) {
        alert("Starting points saved successfully");
      }
    } catch (error) {
      console.error("Error while saving starting points:", error);
      alert("Error while saving");
    }
  };

  const handleConnectToShopify = () => {
    if (!shop) {
      alert("Please provide your Shopify domain first (e.g. store.myshopify.com).");
      return;
    }

    // Redirige vers le flow OAuth Shopify côté backend
    const url = `/api/shopify/install?shop=${encodeURIComponent(shop)}`;
    window.location.href = url;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            This feature requires a Shopify connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Shopify Connection Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Shopify Connection</h2>
          {shopInfo && (
            <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
              Connected
            </span>
          )}
        </div>

        {shopInfo ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Shop Domain</label>
              <p className="text-sm text-gray-900 mt-1">{shopInfo.shop_domain}</p>
            </div>
            {shopInfo.shop_name && (
              <div>
                <label className="text-sm font-medium text-gray-700">Shop Name</label>
                <p className="text-sm text-gray-900 mt-1">{shopInfo.shop_name}</p>
              </div>
            )}
            {shopInfo.shop_email && (
              <div>
                <label className="text-sm font-medium text-gray-700">Shop Email</label>
                <p className="text-sm text-gray-900 mt-1">{shopInfo.shop_email}</p>
              </div>
            )}
            {shopInfo.installed_at && (
              <div>
                <label className="text-sm font-medium text-gray-700">Installed At</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(shopInfo.installed_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">Shop not connected</p>
            <button
              onClick={handleConnectToShopify}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Connect to Shopify
            </button>
          </div>
        )}
      </div>

      {/* Product Starting Point Section */}
      {productInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Product Starting Point</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shopify Product
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {productInfo.shopify_product_image_url && (
                  <img
                    src={productInfo.shopify_product_image_url}
                    alt={productInfo.shopify_product_title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {productInfo.shopify_product_title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Handle: {productInfo.shopify_product_handle}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {productInfo.shopify_product_id}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Starting Point URL
              </label>
              <input
                type="text"
                value={productStartingPoint}
                onChange={(e) => setProductStartingPoint(e.target.value)}
                placeholder="https://your-shop.myshopify.com/products/your-product"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL of the product page where the configurator will be embedded
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Design Starting Point URL
              </label>
              <input
                type="text"
                value={designStartingPoint}
                onChange={(e) => setDesignStartingPoint(e.target.value)}
                placeholder="https://your-shop.myshopify.com/pages/design-starting-point"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL of the page where customers start a new design from scratch
              </p>
            </div>

            <button
              onClick={handleSaveStartingPoints}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Starting Points
            </button>
          </div>
        </div>
      )}

      {/* Integration Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-md font-semibold text-blue-900 mb-3">Integration Instructions</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>1. Product Starting Point:</strong> Add the embed code to your Shopify product
            template.
          </p>
          <p>
            <strong>2. Design Starting Point:</strong> Create a Shopify page and add the configurator
            embed code.
          </p>
          <p>
            <strong>3. Cart Integration:</strong> The configurator automatically pushes configured
            products to the cart with the selected options.
          </p>
        </div>
      </div>
    </div>
  );
}

