import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { modelId, cameraViews } = await request.json();

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
    }

    // Update camera views
    const { data, error } = await supabase
      .from('models_3d')
      .update({ camera_views: cameraViews })
      .eq('id', modelId)
      .select()
      .single();

    if (error) {
      console.error('Error updating camera views:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in camera views API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
