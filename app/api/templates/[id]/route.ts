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

        // Manual cleanup as fallback for Cascade issues
        await prisma.contract.deleteMany({ where: { templateId: params.id } });
        await prisma.templateField.deleteMany({ where: { templateId: params.id } });

        await prisma.template.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Error al eliminar la plantilla" }, { status: 500 });
    }
}
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, pdfData, fields } = body;

        // Update template basic info
        await prisma.template.update({
            where: { id: params.id },
            data: {
                name,
                description,
                ...(pdfData && { pdfData }),
                updatedAt: new Date(),
            },
        });

        // Update fields: delete old and create new ones (simplest way to sync)
        if (fields) {
            await prisma.templateField.deleteMany({
                where: { templateId: params.id },
            });

            await prisma.templateField.createMany({
                data: fields.map((f: any) => ({
                    templateId: params.id,
                    name: f.name,
                    label: f.label,
                    type: f.type,
                    required: f.required,
                    maxLength: f.maxLength,
                    page: f.page || 0,
                    x: f.x,
                    y: f.y,
                    width: f.width,
                    height: f.height,
                    order: f.order || 0,
                })),
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Error al actualizar la plantilla" }, { status: 500 });
    }
}
