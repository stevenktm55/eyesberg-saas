/**
 * Script pour créer le bucket "fonts" dans Supabase Storage
 * Usage: npx tsx scripts/create-fonts-bucket.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Charger explicitement .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('');
  console.error('💡 Définissez-les dans votre fichier .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createFontsBucket() {
  try {
    console.log('🔍 Vérification du bucket "fonts"...');
    
    // Vérifier si le bucket existe déjà
    const { data: existingBucket, error: checkError } = await supabaseAdmin.storage.getBucket('fonts');
    
    if (existingBucket) {
      console.log('✅ Le bucket "fonts" existe déjà!');
      console.log('📋 Configuration actuelle:');
      console.log('   - Nom:', existingBucket.name);
      console.log('   - Public:', existingBucket.public);
      console.log('   - Taille max:', existingBucket.file_size_limit ? `${existingBucket.file_size_limit / 1024 / 1024}MB` : 'Illimitée');
      return;
    }

    // Si le bucket n'existe pas, on le crée
    if (checkError && (checkError.message?.includes('not found') || checkError.statusCode === '404' || checkError.code === 'PGRST301')) {
      console.log('🪣 Le bucket "fonts" n\'existe pas. Création en cours...');
      
      // Créer le bucket
      const { data, error } = await supabaseAdmin.storage.createBucket('fonts', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB (suffisant pour les fonts)
        allowedMimeTypes: [
          'font/ttf',
          'font/otf',
          'font/woff',
          'font/woff2',
          'application/x-font-ttf',
          'application/x-font-opentype',
          'application/font-woff',
          'application/font-woff2'
        ],
      });

      if (error) {
        console.error('❌ Erreur création bucket:', error);
        console.error('   Détails:', JSON.stringify(error, null, 2));
        console.error('');
        console.error('💡 Si l\'erreur persiste, créez le bucket manuellement dans Supabase:');
        console.error('   1. Allez dans Storage > Buckets');
        console.error('   2. Cliquez sur "+ New bucket"');
        console.error('   3. Nom: "fonts"');
        console.error('   4. Cochez "Public bucket"');
        console.error('   5. File size limit: 10 MB');
        return;
      }

      console.log('✅ Bucket "fonts" créé avec succès!');
      console.log('📋 Configuration:');
      console.log('   - Nom: fonts');
      console.log('   - Public: true');
      console.log('   - Taille max: 10MB');
      console.log('   - Types autorisés: .ttf, .otf, .woff, .woff2');
    } else {
      console.error('❌ Erreur lors de la vérification:', checkError);
      console.error('   Détails:', JSON.stringify(checkError, null, 2));
    }
    
  } catch (err: any) {
    console.error('❌ Erreur inattendue:', err);
    console.error('   Stack:', err.stack);
  }
}

createFontsBucket();

