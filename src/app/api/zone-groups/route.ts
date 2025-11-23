import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// GET - Récupérer tous les groupes de zones
export async function GET(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { data: groups, error } = await supabaseAdmin
      .from('zone_groups')
      .select(`
        *,
        zones:zones(*)
      `)
      .eq('subdomain', subdomain)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformer les données pour correspondre au format attendu
    const transformedGroups = groups.map((group: any) => ({
      id: group.id,
      name: group.name,
      zones: group.zones || [],
      design2dIds: group.design2d_ids || [],
      created_at: group.created_at,
      updated_at: group.updated_at
    }));

    return NextResponse.json(transformedGroups);
  } catch (error: any) {
    console.error('Error fetching zone groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch zone groups' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau groupe de zones
export async function POST(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, zones, design2dIds, model3d_id } = body;

    if (!name || !zones || !Array.isArray(zones) || zones.length === 0) {
      return NextResponse.json(
        { error: 'Name and zones are required' },
        { status: 400 }
      );
    }

    // Créer le groupe de zones
    const { data: group, error: groupError } = await supabaseAdmin
      .from('zone_groups')
      .insert({
        subdomain,
        name,
        model3d_id: model3d_id || null,
        design2d_ids: design2dIds || []
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Créer les zones associées
    const zonesToInsert = zones.map((zone: any) => ({
      zone_group_id: group.id,
      name: zone.name,
      model3d_id: zone.model3d_id || model3d_id,
      position: zone.position,
      rotation: zone.rotation,
      width: zone.width,
      height: zone.height,
      thumbnail_url: zone.thumbnailUrl || null,
      is_logo: zone.isLogo || false,
      view: zone.view || 'Face'
    }));

    const { data: insertedZones, error: zonesError } = await supabaseAdmin
      .from('zones')
      .insert(zonesToInsert)
      .select();

    if (zonesError) throw zonesError;

    // Retourner le groupe avec ses zones
    const result = {
      id: group.id,
      name: group.name,
      zones: insertedZones.map((z: any) => ({
        id: z.id,
        name: z.name,
        model3d_id: z.model3d_id,
        position: z.position,
        rotation: z.rotation,
        width: z.width,
        height: z.height,
        thumbnailUrl: z.thumbnail_url,
        isLogo: z.is_logo,
        view: z.view,
        createdAt: z.created_at
      })),
      design2dIds: group.design2d_ids || [],
      created_at: group.created_at,
      updated_at: group.updated_at
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating zone group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create zone group' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un groupe de zones
export async function PATCH(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, zones, design2dIds, model3d_id } = body;

    // Vérifier que le groupe appartient au sous-domaine
    const { data: existingGroup, error: fetchError } = await supabaseAdmin
      .from('zone_groups')
      .select('id')
      .eq('id', id)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json(
        { error: 'Zone group not found or access denied' },
        { status: 404 }
      );
    }

    // Mettre à jour le groupe
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (model3d_id !== undefined) updateData.model3d_id = model3d_id;
    if (design2dIds !== undefined) updateData.design2d_ids = design2dIds;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('zone_groups')
        .update(updateData)
        .eq('id', id)
        .eq('subdomain', subdomain);

      if (updateError) throw updateError;
    }

    // Mettre à jour les zones si fournies
    if (zones && Array.isArray(zones)) {
      // Supprimer les zones existantes
      await supabaseAdmin
        .from('zones')
        .delete()
        .eq('zone_group_id', id);

      // Insérer les nouvelles zones
      if (zones.length > 0) {
        const zonesToInsert = zones.map((zone: any) => ({
          zone_group_id: id,
          name: zone.name,
          model3d_id: zone.model3d_id || model3d_id,
          position: zone.position,
          rotation: zone.rotation,
          width: zone.width,
          height: zone.height,
          thumbnail_url: zone.thumbnailUrl || null,
          is_logo: zone.isLogo || false,
          view: zone.view || 'Face'
        }));

        const { error: zonesError } = await supabaseAdmin
          .from('zones')
          .insert(zonesToInsert);

        if (zonesError) throw zonesError;
      }
    }

    // Récupérer le groupe mis à jour avec ses zones
    const { data: updatedGroup, error: fetchUpdatedError } = await supabaseAdmin
      .from('zone_groups')
      .select(`
        *,
        zones:zones(*)
      `)
      .eq('id', id)
      .single();

    if (fetchUpdatedError) throw fetchUpdatedError;

    const result = {
      id: updatedGroup.id,
      name: updatedGroup.name,
      zones: (updatedGroup.zones || []).map((z: any) => ({
        id: z.id,
        name: z.name,
        model3d_id: z.model3d_id,
        position: z.position,
        rotation: z.rotation,
        width: z.width,
        height: z.height,
        thumbnailUrl: z.thumbnail_url,
        isLogo: z.is_logo,
        view: z.view,
        createdAt: z.created_at
      })),
      design2dIds: updatedGroup.design2d_ids || [],
      created_at: updatedGroup.created_at,
      updated_at: updatedGroup.updated_at
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating zone group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update zone group' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un groupe de zones
export async function DELETE(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Vérifier que le groupe appartient au sous-domaine
    const { data: existingGroup, error: fetchError } = await supabaseAdmin
      .from('zone_groups')
      .select('id')
      .eq('id', id)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json(
        { error: 'Zone group not found or access denied' },
        { status: 404 }
      );
    }

    // Supprimer les zones associées (cascade devrait le faire automatiquement, mais on le fait explicitement)
    await supabaseAdmin
      .from('zones')
      .delete()
      .eq('zone_group_id', id);

    // Supprimer le groupe
    const { error } = await supabaseAdmin
      .from('zone_groups')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting zone group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete zone group' },
      { status: 500 }
    );
  }
}

