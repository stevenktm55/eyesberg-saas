import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucune image fournie" },
        { status: 400 }
      );
    }

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Générer un nom de fichier unique
    const fileName = `preview-${Date.now()}-${crypto.randomUUID()}.png`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "previews");
    const filePath = path.join(uploadDir, fileName);

    // Créer le dossier s'il n'existe pas
    const fs = await import("fs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sauvegarder le fichier
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/previews/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}





