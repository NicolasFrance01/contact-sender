import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ContractFillClient } from "./ContractFillClient";

export default async function TemplateFillPage({ params }: { params: { id: string } }) {
    const [template, settings] = await Promise.all([
        prisma.template.findUnique({
            where: { id: params.id },
            include: { fields: { orderBy: { order: "asc" } } },
        }),
        prisma.settings.findFirst(),
    ]);

    if (!template) notFound();

    return (
        <ContractFillClient
            template={template}
            settings={settings ?? {
                whatsappMessage: "Le adjuntamos el documento solicitado.",
                emailSignature: "",
                smtpFrom: "",
                companyName: "Mi Escribanía",
                companyPhone: "",
            }}
        />
    );
}
