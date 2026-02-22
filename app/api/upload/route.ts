import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("pdf") as File;

        if (!file) {
            return NextResponse.json({ error: "No se encontró el archivo" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const dataUrl = `data:application/pdf;base64,${base64}`;

        return NextResponse.json({
            pdfData: dataUrl,
            name: file.name
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
    }
}
