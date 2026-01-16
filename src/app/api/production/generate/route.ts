// =====================================================
// API PRODUCTION FILE GENERATION
// =====================================================
// POST /api/production/generate
// Génère un fichier SVG de production en injectant
// un design utilisateur dans un template de patron
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateProductionFile, ProductionFileParams } from '@/lib/production-file';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { size, userDesignSvg, colorConfig } = body;

    // Validation des paramètres
    if (!size || !userDesignSvg || !colorConfig) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Paramètres manquants: size, userDesignSvg et colorConfig sont requis' 
        },
        { status: 400 }
      );
    }

    if (!colorConfig.primary || !colorConfig.secondary) {
      return NextResponse.json(
        { 
          success: false,
          error: 'colorConfig doit contenir au moins primary et secondary' 
        },
        { status: 400 }
      );
    }

    // Générer le fichier de production
    const result = await generateProductionFile({
      size,
      userDesignSvg,
      colorConfig
    } as ProductionFileParams);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Erreur lors de la génération' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      svg: result.svg
    });

  } catch (error) {
    console.error('❌ Erreur API production/generate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
