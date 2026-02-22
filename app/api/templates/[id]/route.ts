import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const template = await prisma.template.findUnique({
            where: { id: params.id },
            include: { fields: { orderBy: { order: "asc" } } },
        });

        if (!template) {
            return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener la plantilla" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const template = await prisma.template.findUnique({
            where: { id: params.id },
        });

        if (!template) {
            return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
        }

        // PDF is stored in DB, no local file to delete

        await prisma.template.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Error al eliminar la plantilla" }, { status: 500 });
    }
}
