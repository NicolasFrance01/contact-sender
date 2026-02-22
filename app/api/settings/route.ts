import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const settings = await prisma.settings.findFirst() || await prisma.settings.create({ data: { id: "1" } });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // We only update the singleton with id "1"
        const settings = await prisma.settings.upsert({
            where: { id: "1" },
            update: body,
            create: { ...body, id: "1" },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Settings update error:", error);
        return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 });
    }
}
