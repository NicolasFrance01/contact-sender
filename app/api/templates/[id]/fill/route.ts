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
        const originalPdfPath = path.join(process.cwd(), "public", template.pdfPath);
        const pdfBytes = await fs.readFile(originalPdfPath);
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
            const { width, height } = page.getSize();

            // Coordinate conversion: UI (top-left) to PDF (bottom-left)
            // Note: We assume fields.x and fields.y are in points relative to page top-left.
            // If the UI scale was different, this would need adjusting.
            const pdfX = field.x;
            const pdfY = height - field.y - (field.height / 2); // Approximate center-aligned vertically

            page.drawText(formattedValue, {
                x: pdfX,
                y: pdfY,
                size: 11,
                font: font,
                color: rgb(0, 0, 0),
            });
        }

        // Save generated PDF
        const generatedBytes = await pdfDoc.save();
        const filename = `contract-${Date.now()}-${params.id}.pdf`;
        const uploadsDir = path.join(process.cwd(), "public/uploads");
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, generatedBytes);

        const pdfPath = `/uploads/${filename}`;

        // Create contract record
        const contract = await prisma.contract.create({
            data: {
                templateId: params.id,
                generatedById: session.user.id,
                filledData: JSON.stringify(values),
                pdfPath: pdfPath,
            },
        });

        return NextResponse.json({ contractId: contract.id, pdfPath });
    } catch (error) {
        console.error("Fill error:", error);
        return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 });
    }
}
