import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSubdomain } from '@/lib/get-subdomain';

// GET - Récupérer tous les groupes de snap lines
export async function GET(request: NextRequest) {
  try {
    const subdomain = await getSubdomain(request);
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    // Récupérer les groupes de snap lines
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('snap_line_groups')
      .select('*')
      .eq('subdomain', subdomain)
      .order('created_at', { ascending: false });

    if (groupsError) throw groupsError;

    // Pour chaque groupe, récupérer ses snap lines
    const transformedGroups = await Promise.all(
      (groups || []).map(async (group: any) => {
        const { data: snapLines, error: snapLinesError } = await supabaseAdmin
          .from('snap_lines')
          .select('*')
          .eq('snap_line_group_id', group.id)
          .order('created_at', { ascending: true });

        if (snapLinesError) {
          console.error(`Error fetching snap lines for group ${group.id}:`, snapLinesError);
        }

        return {
          id: group.id,
          name: group.name,
          snapLines: (snapLines || []).map((sl: any) => ({
            id: sl.id,
            name: sl.name,
            model3d_id: sl.model3d_id,
            start: sl.start,
            end: sl.end,
            type: sl.type,
            view: sl.view || 'Face',
            createdAt: sl.created_at
          })),
          design2dIds: group.design2d_ids || [],
          created_at: group.created_at,
          updated_at: group.updated_at
        };
      })
    );

    return NextResponse.json(transformedGroups);
  } catch (error: any) {
    console.error('Error fetching snap line groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch snap line groups' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau groupe de snap lines
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
    const { name, snapLines, design2dIds, model3d_id } = body;

    if (!name || !snapLines || !Array.isArray(snapLines) || snapLines.length === 0) {
      return NextResponse.json(
        { error: 'Name and snapLines are required' },
        { status: 400 }
      );
    }

    // Créer le groupe de snap lines
    const { data: group, error: groupError } = await supabaseAdmin
      .from('snap_line_groups')
      .insert({
        subdomain,
        name,
        model3d_id: model3d_id || null,
        design2d_ids: design2dIds || []
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Créer les snap lines associées
    const snapLinesToInsert = snapLines.map((snapLine: any) => ({
      snap_line_group_id: group.id,
      name: snapLine.name,
      model3d_id: snapLine.model3d_id || model3d_id,
      start: snapLine.start,
      "end": snapLine.end, // "end" is a SQL reserved word, must be quoted
      type: snapLine.type || 'vertical',
      view: snapLine.view || 'Face'
    }));

    const { data: insertedSnapLines, error: snapLinesError } = await supabaseAdmin
      .from('snap_lines')
      .insert(snapLinesToInsert)
      .select();

    if (snapLinesError) throw snapLinesError;

    // Retourner le groupe avec ses snap lines
    const result = {
      id: group.id,
      name: group.name,
      snapLines: insertedSnapLines.map((sl: any) => ({
        id: sl.id,
        name: sl.name,
        model3d_id: sl.model3d_id,
        start: sl.start,
        end: sl.end,
        type: sl.type,
        view: sl.view || 'Face',
        createdAt: sl.created_at
      })),
      design2dIds: group.design2d_ids || [],
      created_at: group.created_at,
      updated_at: group.updated_at
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating snap line group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create snap line group' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un groupe de snap lines
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
    const { name, snapLines, design2dIds, model3d_id } = body;

    // Vérifier que le groupe appartient au sous-domaine
    const { data: existingGroup, error: fetchError } = await supabaseAdmin
      .from('snap_line_groups')
      .select('id')
      .eq('id', id)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json(
        { error: 'Snap line group not found or access denied' },
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
        .from('snap_line_groups')
        .update(updateData)
        .eq('id', id)
        .eq('subdomain', subdomain);

      if (updateError) throw updateError;
    }

    // Mettre à jour les snap lines si fournies
    if (snapLines && Array.isArray(snapLines)) {
      // Supprimer les snap lines existantes
      await supabaseAdmin
        .from('snap_lines')
        .delete()
        .eq('snap_line_group_id', id);

      // Insérer les nouvelles snap lines
      if (snapLines.length > 0) {
        const snapLinesToInsert = snapLines.map((snapLine: any) => ({
          snap_line_group_id: id,
          name: snapLine.name,
          model3d_id: snapLine.model3d_id || model3d_id,
          start: snapLine.start,
          "end": snapLine.end, // "end" is a SQL reserved word, must be quoted
          type: snapLine.type || 'vertical',
          view: snapLine.view || 'Face'
        }));

        const { error: snapLinesError } = await supabaseAdmin
          .from('snap_lines')
          .insert(snapLinesToInsert);

        if (snapLinesError) throw snapLinesError;
      }
    }

    // Récupérer le groupe mis à jour
    const { data: updatedGroup, error: fetchUpdatedError } = await supabaseAdmin
      .from('snap_line_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchUpdatedError) throw fetchUpdatedError;

    // Récupérer les snap lines du groupe
    const { data: fetchedSnapLines, error: snapLinesError } = await supabaseAdmin
      .from('snap_lines')
      .select('*')
      .eq('snap_line_group_id', id)
      .order('created_at', { ascending: true });

    if (snapLinesError) {
      console.error(`Error fetching snap lines for group ${id}:`, snapLinesError);
    }

    const result = {
      id: updatedGroup.id,
      name: updatedGroup.name,
      snapLines: (fetchedSnapLines || []).map((sl: any) => ({
        id: sl.id,
        name: sl.name,
        model3d_id: sl.model3d_id,
        start: sl.start,
        end: sl.end,
        type: sl.type,
        view: sl.view || 'Face',
        createdAt: sl.created_at
      })),
      design2dIds: updatedGroup.design2d_ids || [],
      created_at: updatedGroup.created_at,
      updated_at: updatedGroup.updated_at
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating snap line group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update snap line group' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un groupe de snap lines
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
      .from('snap_line_groups')
      .select('id')
      .eq('id', id)
      .eq('subdomain', subdomain)
      .single();

    if (fetchError || !existingGroup) {
      return NextResponse.json(
        { error: 'Snap line group not found or access denied' },
        { status: 404 }
      );
    }

    // Supprimer les snap lines associées
    await supabaseAdmin
      .from('snap_lines')
      .delete()
      .eq('snap_line_group_id', id);

    // Supprimer le groupe
    const { error } = await supabaseAdmin
      .from('snap_line_groups')
      .delete()
      .eq('id', id)
      .eq('subdomain', subdomain);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting snap line group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete snap line group' },
      { status: 500 }
    );
  }
}

