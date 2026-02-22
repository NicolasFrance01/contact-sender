import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { name, email, password, role, active } = await req.json();

        const data: any = { name, email, role, active };

        if (password) {
            data.password = await bcrypt.hash(password, 12);
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("User update error:", error);
        return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Prevent deleting self
    if (params.id === session.user.id) {
        return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 400 });
    }

    try {
        await prisma.user.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("User delete error:", error);
        return NextResponse.json({ error: "Error al eliminar el usuario" }, { status: 500 });
    }
}
