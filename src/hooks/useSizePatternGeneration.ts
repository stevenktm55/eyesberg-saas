/**
 * Hook React pour gérer la génération des UV maps multi-tailles
 */
import { useState, useCallback } from 'react';
import { generateUVMapUrls, type SizePatternTemplate } from '@/utils/sizePatternGenerator';

export interface UseSizePatternGenerationOptions {
  model3dId: string;
  onUVMapsGenerated?: (uv0Url: string | null, uv2Url: string | null) => void;
}

export interface SizePatternGenerationState {
  isGenerating: boolean;
  error: string | null;
  uv0Url: string | null;
  uv2Url: string | null;
}

export function useSizePatternGeneration(options: UseSizePatternGenerationOptions) {
  const { model3dId, onUVMapsGenerated } = options;
  
  const [state, setState] = useState<SizePatternGenerationState>({
    isGenerating: false,
    error: null,
    uv0Url: null,
    uv2Url: null,
  });
  
  /**
   * Génère les UV maps pour une taille spécifique
   */
  const generateUVMaps = useCallback(async (
    size: string,
    configData: {
      design?: {
        svgUrl?: string;
        colors?: Record<string, string>;
      };
      logos?: Array<{
        id: string;
        svgUrl: string;
        position: [number, number];
        scale: number;
        rotation: number;
        uvZone: string;
      }>;
    }
  ) => {
    if (!model3dId) {
      setState(prev => ({
        ...prev,
        error: 'Model 3D ID is required',
      }));
      return;
    }
    
    if (!size) {
      setState(prev => ({
        ...prev,
        error: 'Size is required',
      }));
      return;
    }
    
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));
    
    try {
      const { uv0Url, uv2Url } = await generateUVMapUrls(
        model3dId,
        size,
        configData
      );
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        uv0Url,
        uv2Url,
      }));
      
      // Callback optionnel
      if (onUVMapsGenerated) {
        onUVMapsGenerated(uv0Url, uv2Url);
      }
      
      return { uv0Url, uv2Url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate UV maps';
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, [model3dId, onUVMapsGenerated]);
  
  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      error: null,
      uv0Url: null,
      uv2Url: null,
    });
  }, []);
  
  return {
    ...state,
    generateUVMaps,
    reset,
  };
}

