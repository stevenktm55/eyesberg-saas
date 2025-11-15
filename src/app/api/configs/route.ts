import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const contentType = request.headers.get('content-type');
		
		// Si c'est du JSON (depuis Shopify Mon compte)
		if (contentType?.includes('application/json')) {
			const configData = await request.json();
			
			console.log('💾 Sauvegarde configuration depuis Shopify Mon compte:', configData);
			
			// Vérifier que l'email est présent
			if (!configData.customerEmail) {
				const response = NextResponse.json(
					{ error: 'Email client requis' },
					{ status: 400 }
				);
				
				// Ajouter headers CORS
				response.headers.set('Access-Control-Allow-Origin', '*');
				response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
				response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
				
				return response;
			}
			
			// Vérifier la limite de 10 configurations
			const { data: existingConfigs, count } = await supabase
				.from('configurations')
				.select('id', { count: 'exact' })
				.eq('customer_email', configData.customerEmail)
				.eq('status', 'saved');
			
			if (count && count >= 10) {
				const response = NextResponse.json(
					{ error: `Limite de 10 configurations atteinte (${count}/10)` },
					{ status: 400 }
				);
				
				// Ajouter headers CORS
				response.headers.set('Access-Control-Allow-Origin', '*');
				response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
				response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
				
				return response;
			}
			
			// Générer un token de partage unique
			const shareToken = crypto.randomUUID();
			
			// Sauvegarder dans Supabase
			const { data: config, error: insertError } = await supabase
				.from('configurations')
				.insert({
					config_data: configData,
					customer_email: configData.customerEmail,
					preview_image_url: configData.previewUrl || null,
					status: 'saved',
					share_token: shareToken
				})
				.select()
				.single();
			
			if (insertError) {
				console.error('❌ Erreur insertion:', insertError);
				const response = NextResponse.json(
					{ error: 'Erreur lors de la sauvegarde' },
					{ status: 500 }
				);
				
				// Ajouter headers CORS
				response.headers.set('Access-Control-Allow-Origin', '*');
				response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
				response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
				
				return response;
			}
			
			console.log('✅ Configuration sauvegardée:', config.id);
			
			const response = NextResponse.json({ 
				id: config.id,
				success: true
			}, { status: 201 });
			
			// Ajouter headers CORS
			response.headers.set('Access-Control-Allow-Origin', '*');
			response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
			response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
			
			return response;
		}
		
		// Sinon, c'est du FormData (ancien système)
		const form = await request.formData();
		const payloadJSON = (form.get("payloadJSON") as string) || "{}";
		const thumbnailDataUrl = (form.get("thumbnailDataUrl") as string) || "";
		const id = crypto.randomUUID();
		return NextResponse.json({ id, payloadJSON, thumbnailDataUrl }, { status: 201 });
		
	} catch (error) {
		console.error('❌ Erreur:', error);
		return NextResponse.json({ error: "save failed" }, { status: 500 });
	}
}

/**
 * OPTIONS - Gérer les requêtes preflight CORS
 */
export async function OPTIONS() {
	const response = new NextResponse(null, { status: 204 });
	
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	
	return response;
}



