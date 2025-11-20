'use client';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  itemName?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '32px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #2a2a2a',
          width: '100%',
          maxWidth: '400px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#ffffff',
          fontFamily: 'var(--stepn-font-body)',
          margin: 0,
          marginBottom: message ? '12px' : 0
        }}>
          {title}
        </h3>
        {message && (
          <p style={{
            fontSize: '14px',
            color: '#a0a0a0',
            fontFamily: 'var(--stepn-font-body)',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        )}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'var(--stepn-font-body)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3a3a3a';
              e.currentTarget.style.borderColor = '#3a3a3a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.borderColor = '#2a2a2a';
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'var(--stepn-font-body)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
              e.currentTarget.style.borderColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.borderColor = '#dc2626';
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

