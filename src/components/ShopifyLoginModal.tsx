'use client';

import { useState, useEffect } from 'react';

interface ShopifyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopDomain: string;
  onLoginSuccess: (email: string) => void;
}

export function ShopifyLoginModal({ isOpen, onClose, shopDomain, onLoginSuccess }: ShopifyLoginModalProps) {
  const [returnUrl, setReturnUrl] = useState('');

  useEffect(() => {
    // Capturer l'URL actuelle pour le retour après connexion
    if (typeof window !== 'undefined') {
      setReturnUrl(window.location.href);
    }
  }, []);

  if (!isOpen) return null;

  const handleLogin = () => {
    // Récupérer l'ID de la config temporaire depuis localStorage (ID Supabase)
    const pendingConfigId = localStorage.getItem('pending_config_id');
    
    console.log('🔍 DEBUG ShopifyLoginModal - handleLogin:', {
      pendingConfigId,
      shopDomain,
      currentUrl: window.location.href,
      localStorageKeys: Object.keys(localStorage)
    });
    
    // Rediriger vers Mon compte avec l'ID de la config temporaire dans l'URL
    const accountParams = new URLSearchParams({
      redirect_to_configurator: 'true'
    });
    
    // Ajouter l'ID de la configuration temporaire dans l'URL (important!)
    if (pendingConfigId) {
      accountParams.set('temp_config_id', pendingConfigId);
      console.log('✅ ID config temporaire ajouté à l\'URL:', pendingConfigId);
    }
    
    const accountUrl = `https://${shopDomain}/account?${accountParams.toString()}`;
    const loginUrl = `https://${shopDomain}/account/login?return_url=${encodeURIComponent(accountUrl)}`;
    console.log('🔍 DEBUG - Redirection vers login avec retour à Mon compte:', loginUrl);
    
    window.location.href = loginUrl;
  };

  const handleRegister = () => {
    // Récupérer l'ID de la config temporaire depuis localStorage (ID Supabase)
    const pendingConfigId = localStorage.getItem('pending_config_id');
    
    console.log('🔍 DEBUG ShopifyLoginModal - handleRegister:', {
      pendingConfigId,
      shopDomain,
      currentUrl: window.location.href
    });
    
    // Rediriger vers Mon compte avec l'ID de la config temporaire dans l'URL
    const accountParams = new URLSearchParams({
      redirect_to_configurator: 'true'
    });
    
    // Ajouter l'ID de la configuration temporaire dans l'URL (important!)
    if (pendingConfigId) {
      accountParams.set('temp_config_id', pendingConfigId);
      console.log('✅ ID config temporaire ajouté à l\'URL:', pendingConfigId);
    }
    
    const accountUrl = `https://${shopDomain}/account?${accountParams.toString()}`;
    const registerUrl = `https://${shopDomain}/account/register?return_url=${encodeURIComponent(accountUrl)}`;
    console.log('🔍 DEBUG - Redirection vers register avec retour à Mon compte:', registerUrl);
    
    window.location.href = registerUrl;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: '28px',
            fontWeight: '600',
            color: '#333',
            fontFamily: 'inherit',
          }}
        >
          Connexion requise
        </h2>
        
        <p
          style={{
            margin: '0 0 30px',
            color: '#666',
            fontSize: '16px',
            fontFamily: 'inherit',
            lineHeight: '1.5',
          }}
        >
          Pour sauvegarder votre configuration et la retrouver dans votre espace "Mon compte", 
          vous devez être connecté à votre compte.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleLogin}
            style={{
              padding: '14px 24px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#333')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#000')}
          >
            Se connecter
          </button>

          <button
            onClick={handleRegister}
            style={{
              padding: '14px 24px',
              background: 'white',
              color: '#000',
              border: '2px solid #000',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            Créer un compte
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '14px 24px',
              background: 'transparent',
              color: '#666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#000')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#666')}
          >
            Annuler
          </button>
        </div>

        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666',
            fontFamily: 'inherit',
            lineHeight: '1.5',
          }}
        >
          <strong style={{ color: '#333' }}>💡 Avantages :</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
            <li>Sauvegardez jusqu'à 10 configurations</li>
            <li>Retrouvez vos créations dans "Mon compte"</li>
            <li>Modifiez vos designs à tout moment</li>
            <li>Commandez rapidement vos créations sauvegardées</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

