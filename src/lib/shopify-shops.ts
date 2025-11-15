import { supabaseAdmin } from './supabase';

/**
 * Interface pour une boutique Shopify
 */
export interface ShopifyShop {
  shopDomain: string;
  shopGid?: string;
  accessToken: string;
  scopes: string;
  installedAt: Date;
  shopName?: string;
  shopEmail?: string;
  accountId?: string;
}

/**
 * Sauvegarde ou met à jour une boutique Shopify en base
 */
export async function saveShop(shop: ShopifyShop) {
  try {
    // Vérifier si la boutique existe déjà
    const { data: existingShop } = await supabaseAdmin
      .from('shops')
      .select('id, shop_domain')
      .eq('shop_domain', shop.shopDomain)
      .single();

    if (existingShop) {
      // Mise à jour de la boutique existante (noms de colonnes Supabase : snake_case)
      const { data, error } = await supabaseAdmin
        .from('shops')
        .update({
          access_token: shop.accessToken,
          scopes: shop.scopes,
          installed_at: shop.installedAt.toISOString(),
          shop_name: shop.shopName,
          shop_email: shop.shopEmail,
          shop_gid: shop.shopGid,
          account_id: shop.accountId,
          updated_at: new Date().toISOString(),
        })
        .eq('shop_domain', shop.shopDomain)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la boutique:', error);
        throw error;
      }

      console.log('✅ Boutique mise à jour:', data.id);
      return data;
    } else {
      // Création d'une nouvelle boutique (noms de colonnes Supabase : snake_case)
      const { data, error } = await supabaseAdmin
        .from('shops')
        .insert({
          shop_domain: shop.shopDomain,
          shop_gid: shop.shopGid,
          access_token: shop.accessToken,
          scopes: shop.scopes,
          installed_at: shop.installedAt.toISOString(),
          shop_name: shop.shopName,
          shop_email: shop.shopEmail,
          account_id: shop.accountId,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la boutique:', error);
        throw error;
      }

      console.log('✅ Boutique créée:', data.id);
      return data;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la boutique:', error);
    throw error;
  }
}

/**
 * Récupère une boutique par son domaine
 */
export async function getShopByDomain(shopDomain: string) {
  const { data, error } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('shop_domain', shopDomain)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ Erreur lors de la récupération de la boutique:', error);
    throw error;
  }

  return data;
}

