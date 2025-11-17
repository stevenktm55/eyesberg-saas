'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  model3d: File | null;
  model3dUrl: string | null;
  designs: File[];
  designUrls: string[];
}

export default function ProductBuilderPage() {
  const router = useRouter();
  const [shop, setShop] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    model3d: null,
    model3dUrl: null,
    designs: [],
    designUrls: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le sous-domaine depuis le host
    const host = window.location.host;
    const subdomainMatch = host.match(/^([^.]+)\./);
    const detectedSubdomain = subdomainMatch ? subdomainMatch[1] : null;
    setSubdomain(detectedSubdomain);
    
    // Récupérer le paramètre shop depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    setShop(urlParams.get('shop'));
  }, []);

  const handleModel3dChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que c'est un fichier .glb ou .gltf
      if (!file.name.match(/\.(glb|gltf)$/i)) {
        setError('Please upload a .glb or .gltf file for the 3D model');
        return;
      }
      setFormData(prev => ({ ...prev, model3d: file }));
      setError(null);
    }
  };

  const handleDesignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Vérifier que ce sont des images
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      if (validFiles.length !== files.length) {
        setError('Please upload only image files for designs');
        return;
      }
      setFormData(prev => ({ ...prev, designs: [...prev.designs, ...validFiles] }));
      setError(null);
    }
  };

  const removeDesign = (index: number) => {
    setFormData(prev => ({
      ...prev,
      designs: prev.designs.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // TODO: Implémenter la création du produit
      // 1. Upload du modèle 3D
      // 2. Upload des designs
      // 3. Créer le produit dans Shopify
      // 4. Sauvegarder dans Supabase
      
      alert('Product creation will be implemented soon!');
      router.push('/admin');
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000',
      display: 'flex',
      fontFamily: 'var(--stepn-font-body), sans-serif'
    }}>
      <AdminSidebar />

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '240px',
        padding: '40px',
        overflow: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={() => router.push('/admin')}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#8eff36',
                border: '1px solid #8eff36',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--stepn-font-body)',
                marginBottom: '24px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8eff36';
                e.currentTarget.style.color = '#000000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8eff36';
              }}
            >
              ← Back to Products
            </button>
            
            <h1 className="stepn-title-ultrabold" style={{ 
              color: '#8eff36', 
              fontSize: '48px',
              fontFamily: 'PP Neue Machina Inktrap Ultrabold Italic, sans-serif',
              marginBottom: '8px'
            }}>
              Create Product
            </h1>
            <p style={{ 
              color: '#a0a0a0', 
              fontFamily: 'var(--stepn-font-body)',
              fontSize: '16px'
            }}>
              Build a customizable product with 3D model and designs
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '16px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #ff4444',
              borderRadius: '4px',
              marginBottom: '24px',
              color: '#ff4444',
              fontFamily: 'var(--stepn-font-body)'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            backgroundColor: '#0a0a0a',
            padding: '32px',
            borderRadius: '8px',
            border: '1px solid #1a1a1a'
          }}>
            {/* Basic Information */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                color: '#8eff36',
                fontSize: '24px',
                fontFamily: 'var(--stepn-font-body)',
                marginBottom: '16px'
              }}>
                Basic Information
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  color: '#ffffff',
                  fontFamily: 'var(--stepn-font-body)',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#000000',
                    border: '1px solid #1a1a1a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8eff36'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  color: '#ffffff',
                  fontFamily: 'var(--stepn-font-body)',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#000000',
                    border: '1px solid #1a1a1a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8eff36'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: '#ffffff',
                  fontFamily: 'var(--stepn-font-body)',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Price (€) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#000000',
                    border: '1px solid #1a1a1a',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'var(--stepn-font-body)',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8eff36'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#1a1a1a'}
                />
              </div>
            </div>

            {/* 3D Model */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                color: '#8eff36',
                fontSize: '24px',
                fontFamily: 'var(--stepn-font-body)',
                marginBottom: '16px'
              }}>
                3D Model *
              </h2>
              
              <div style={{
                border: '2px dashed #1a1a1a',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                transition: 'border-color 0.2s'
              }}>
                {formData.model3d ? (
                  <div>
                    <p style={{ color: '#8eff36', fontFamily: 'var(--stepn-font-body)', marginBottom: '8px' }}>
                      ✓ {formData.model3d.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, model3d: null }))}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: '#ff4444',
                        border: '1px solid #ff4444',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontFamily: 'var(--stepn-font-body)'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'block',
                    cursor: 'pointer',
                    color: '#a0a0a0',
                    fontFamily: 'var(--stepn-font-body)'
                  }}>
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      onChange={handleModel3dChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📦</div>
                    <div>Click to upload 3D model (.glb or .gltf)</div>
                    <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                      Maximum file size: 50MB
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Designs */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                color: '#8eff36',
                fontSize: '24px',
                fontFamily: 'var(--stepn-font-body)',
                marginBottom: '16px'
              }}>
                Designs
              </h2>
              
              <div style={{
                border: '2px dashed #1a1a1a',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <label style={{
                  display: 'block',
                  cursor: 'pointer',
                  color: '#a0a0a0',
                  fontFamily: 'var(--stepn-font-body)'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDesignChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎨</div>
                  <div>Click to upload design images</div>
                  <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                    PNG, JPG, SVG (multiple files allowed)
                  </div>
                </label>
              </div>

              {/* Design Preview */}
              {formData.designs.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px'
                }}>
                  {formData.designs.map((design, index) => (
                    <div key={index} style={{
                      position: 'relative',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '8px',
                      padding: '8px',
                      border: '1px solid #1a1a1a'
                    }}>
                      <img
                        src={URL.createObjectURL(design)}
                        alt={`Design ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeDesign(index)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '24px',
                          height: '24px',
                          backgroundColor: '#ff4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                      <p style={{
                        color: '#ffffff',
                        fontFamily: 'var(--stepn-font-body)',
                        fontSize: '12px',
                        marginTop: '8px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {design.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'flex-end',
              paddingTop: '24px',
              borderTop: '1px solid #1a1a1a'
            }}>
              <button
                type="button"
                onClick={() => router.push('/admin')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid #1a1a1a',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8eff36';
                  e.currentTarget.style.color = '#8eff36';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1a1a1a';
                  e.currentTarget.style.color = '#ffffff';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.price || !formData.model3d}
                style={{
                  padding: '12px 24px',
                  backgroundColor: loading || !formData.title || !formData.price || !formData.model3d ? '#333' : '#8eff36',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading || !formData.title || !formData.price || !formData.model3d ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--stepn-font-body)',
                  transition: 'opacity 0.2s',
                  opacity: loading || !formData.title || !formData.price || !formData.model3d ? 0.5 : 1
                }}
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

