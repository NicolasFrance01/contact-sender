import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description, pdfData, fields } = body;

        if (!name || !pdfData || !fields) {
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
        }

        const template = await prisma.template.create({
            data: {
                name,
                description,
                pdfData,
                createdById: (session.user as any).id,
                fields: {
                    create: fields.map((f: any) => ({
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
                },
            } as any,
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Template creation error:", error);
        return NextResponse.json({ error: "Error al crear la plantilla" }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const templates = await prisma.template.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                createdBy: { select: { name: true } },
                _count: { select: { fields: true, contracts: true } },
            },
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener las pplantillas" }, { status: 500 });
    }
}
