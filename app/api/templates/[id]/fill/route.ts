import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { formatFieldValue } from "@/lib/utils";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { values } = await req.json();

        const template = await prisma.template.findUnique({
            where: { id: params.id },
            include: { fields: true },
        });

        if (!template) {
            return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
        }

        // Load original PDF
        const base64Data = (template as any).pdfData.split(",")[1] || (template as any).pdfData;
        const pdfBytes = Buffer.from(base64Data, "base64");
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();

        // Fill fields
        for (const field of template.fields) {
            const value = values[field.name];
            if (value === undefined || value === null || value === "") continue;

            const formattedValue = formatFieldValue(value, field.type);
            const pageIndex = field.page || 0;
            if (pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { height } = page.getSize();

            const pdfX = field.x;
            const pdfY = height - field.y - (field.height / 2);

            page.drawText(formattedValue, {
                x: pdfX,
                y: pdfY,
                size: 11,
                font: font,
                color: rgb(0, 0, 0),
            });
        }

        // Generate PDF Data URL
        const generatedBytes = await pdfDoc.save();
        const generatedBase64 = Buffer.from(generatedBytes).toString("base64");
        const pdfData = `data:application/pdf;base64,${generatedBase64}`;

        // Create contract record
        const contract = await prisma.contract.create({
            data: {
                templateId: params.id,
                generatedById: (session.user as any).id,
                filledData: JSON.stringify(values),
                pdfData: pdfData,
            } as any,
        });

        return NextResponse.json({ contractId: contract.id, pdfData });
    } catch (error) {
        console.error("Fill error:", error);
        return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 });
    }
}
