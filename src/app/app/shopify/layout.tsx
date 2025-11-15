'use client';

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { AppBridgeProvider } from '@/components/shopify/AppBridgeProvider';

export default function ShopifyAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppBridgeProvider>
      <AppProvider
        i18n={{
          Polaris: {
            Avatar: {
              label: 'Avatar',
              labelWithInitials: 'Avatar with initials {initials}',
            },
            ContextualSaveBar: {
              save: 'Save',
              discard: 'Discard',
            },
            TextField: {
              characterCount: '{count} characters',
            },
            TopBar: {
              toggleMenuLabel: 'Toggle menu',

              SearchField: {
                clearButtonLabel: 'Clear',
                search: 'Search',
              },
            },
            Modal: {
              i18n: {
                close: 'Close',
              },
            },
            Frame: {
              skipToContent: 'Skip to content',
              navigationLabel: 'Navigation',
              Navigation: {
                closeMobileNavigationLabel: 'Close navigation',
              },
            },
          },
        }}
      >
        {children}
      </AppProvider>
    </AppBridgeProvider>
  );
}

