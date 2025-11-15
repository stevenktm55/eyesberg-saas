import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Récupérer les templates de mesures pour un type de modèle
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelType = searchParams.get('model_type');

    if (!modelType) {
      return new Response(JSON.stringify({ error: 'model_type requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase
      .from('measurement_templates')
      .select('*')
      .eq('model_type', modelType)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erreur chargement templates:', error);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

