import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import nodemailer from "nodemailer";
import path from "path";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { contractId, channel, recipient, subject, body } = await req.json();

        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { template: true },
        });

        if (!contract) {
            return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
        }

        const settings = await prisma.settings.findFirst();

        try {
            if (channel === "EMAIL") {
                if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
                    return NextResponse.json({ error: "SMTP no configurado" }, { status: 400 });
                }

                const transporter = nodemailer.createTransport({
                    host: settings.smtpHost,
                    port: settings.smtpPort,
                    secure: settings.smtpPort === 465,
                    auth: {
                        user: settings.smtpUser,
                        pass: settings.smtpPass,
                    },
                    // Hardening for Gmail and other providers
                    tls: {
                        rejectUnauthorized: false, // Helps with some serverless envs
                        ciphers: 'SSLv3', // Compatibility
                    },
                    requireTLS: settings.smtpPort === 587,
                    connectionTimeout: 10000,
                    greetingTimeout: 5000,
                });

                const base64Data = contract.pdfData.split(",")[1] || contract.pdfData;
                const pdfBuffer = Buffer.from(base64Data, "base64");

                await transporter.sendMail({
                    from: settings.smtpFrom || settings.smtpUser,
                    to: recipient,
                    subject: subject || `Contrato: ${contract.template.name}`,
                    text: body || "Se adjunta el documento solicitado.",
                    attachments: [
                        {
                            filename: `${contract.template.name}.pdf`,
                            content: pdfBuffer,
                        },
                    ],
                });
            }

            // Save send Record (SUCCESS)
            const sendRecord = await prisma.contractSend.create({
                data: {
                    contractId,
                    sentById: session.user.id,
                    recipient,
                    channel,
                    status: "SENT",
                },
            });

            // Audit log
            await prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: "SEND_CONTRACT",
                    details: JSON.stringify({
                        contractId,
                        channel,
                        recipient,
                        templateName: contract.template.name,
                    }),
                },
            });

            return NextResponse.json({ success: true, sendId: sendRecord.id });
        } catch (mailError: any) {
            console.error("Mail/Record error:", mailError);

            // Log as failure in DB
            await prisma.contractSend.create({
                data: {
                    contractId,
                    sentById: session.user.id,
                    recipient,
                    channel,
                    status: "ERROR",
                    errorMsg: mailError.message || "Error desconocido",
                },
            });

            return NextResponse.json({
                error: "Error al enviar el contrato",
                details: mailError.message
            }, { status: 500 });
        }
    } catch (error) {
        console.error("General send error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
