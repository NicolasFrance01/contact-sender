import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return new NextResponse("No autorizado", { status: 401 });
    }

    try {
        const contract = await prisma.contract.findUnique({
            where: { id: params.id },
        }) as any;

        if (!contract) {
            return new NextResponse("Contrato no encontrado", { status: 404 });
        }

        // Access check: only admins, managers, or the creator can view (simplified for now)
        // If needed, add more robust role checks here

        // pdfData is stored as "data:application/pdf;base64,..."
        const base64Data = contract.pdfData.split(",")[1] || contract.pdfData;
        const pdfBuffer = Buffer.from(base64Data, "base64");

        return new Response(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "inline; filename=\"contract.pdf\"",
                "Cache-Control": "public, max-age=3600", // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error("PDF View error:", error);
        return new NextResponse("Error al cargar el PDF", { status: 500 });
    }
}
