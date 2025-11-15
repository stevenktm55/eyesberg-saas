// =====================================================
// SUPABASE CLIENT
// =====================================================
// Client Supabase pour l'application StretchMX
// Utilisé côté client et côté serveur
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Vérifier que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies dans .env.local'
  );
}

// Client Supabase (public - côté client et serveur)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Pas de session pour l'instant (pas d'auth utilisateur)
  },
});

// Client Supabase avec service role (pour les opérations d'administration - ignore RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Vérifier si on a la service role key
export const hasServiceRoleKey = !!supabaseServiceKey;

// =====================================================
// HELPER FUNCTIONS - STORAGE
// =====================================================

/**
 * Upload un fichier vers un bucket Supabase Storage
 * @param bucket - Nom du bucket
 * @param path - Chemin du fichier dans le bucket
 * @param file - Fichier à uploader
 * @returns URL publique du fichier uploadé
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Remplacer si le fichier existe déjà
    });

  if (error) {
    console.error('Erreur upload Supabase:', error);
    throw new Error(`Erreur lors de l'upload: ${error.message}`);
  }

  // Retourner l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Supprimer un fichier d'un bucket Supabase Storage
 * @param bucket - Nom du bucket
 * @param path - Chemin du fichier dans le bucket
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('Erreur suppression Supabase:', error);
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
}

/**
 * Obtenir l'URL publique d'un fichier
 * @param bucket - Nom du bucket
 * @param path - Chemin du fichier dans le bucket
 * @returns URL publique du fichier
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// =====================================================
// HELPER FUNCTIONS - DATABASE
// =====================================================

/**
 * Récupérer tous les enregistrements d'une table
 * @param table - Nom de la table
 * @returns Liste des enregistrements
 */
export async function getAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*');

  if (error) {
    console.error(`Erreur lecture ${table}:`, error);
    throw new Error(`Erreur lors de la lecture: ${error.message}`);
  }

  return data as T[];
}

/**
 * Récupérer un enregistrement par ID
 * @param table - Nom de la table
 * @param id - ID de l'enregistrement
 * @returns Enregistrement trouvé ou null
 */
export async function getById<T>(table: string, id: string): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Pas trouvé
    console.error(`Erreur lecture ${table}:`, error);
    throw new Error(`Erreur lors de la lecture: ${error.message}`);
  }

  return data as T;
}

/**
 * Créer un nouvel enregistrement
 * @param table - Nom de la table
 * @param data - Données à insérer
 * @returns Enregistrement créé
 */
export async function create<T>(table: string, data: Partial<T>): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error(`Erreur création ${table}:`, error);
    throw new Error(`Erreur lors de la création: ${error.message}`);
  }

  return result as T;
}

/**
 * Mettre à jour un enregistrement
 * @param table - Nom de la table
 * @param id - ID de l'enregistrement
 * @param data - Données à mettre à jour
 * @returns Enregistrement mis à jour
 */
export async function update<T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Erreur mise à jour ${table}:`, error);
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }

  return result as T;
}

/**
 * Supprimer un enregistrement
 * @param table - Nom de la table
 * @param id - ID de l'enregistrement
 */
export async function deleteRecord(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) {
    console.error(`Erreur suppression ${table}:`, error);
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
}

// =====================================================
// TYPES SUPABASE (pour TypeScript)
// =====================================================

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  shopify_product_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Model3D = {
  id: string;
  product_id: string;
  name: string;
  glb_url: string;
  uv_map_url?: string;
  thumbnail_url?: string;
  metadata?: any;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type TextZone = {
  id: string;
  model_id: string;
  name: string;
  categories: string[];
  zone_category: string;
  position: [number, number, number];
  default_text_width?: number;
  default_text_height?: number;
  default_logo_width?: number;
  default_logo_height?: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
};

export type Design = {
  id: string;
  name: string;
  svg_url: string;
  thumbnail_url?: string;
  tags?: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ColorPalette = {
  id: string;
  name: string;
  colors: Array<{ hex: string; name: string }>;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Logo = {
  id: string;
  name: string;
  tags?: string[];
  variants: Array<{ id: string; name: string; file: string }>;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Font = {
  id: string;
  name: string;
  display_name: string;
  font_url: string;
  format: string;
  category?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Configuration = {
  id: string;
  product_id?: string;
  model_id?: string;
  customer_email?: string;
  customer_name?: string;
  config_data: any;
  preview_image_url?: string;
  shopify_cart_token?: string;
  shopify_order_id?: string;
  status: 'draft' | 'saved' | 'ordered';
  share_token: string;
  created_at: string;
  updated_at: string;
};


