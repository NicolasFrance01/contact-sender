import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { auth } from "@/auth";

const EditTemplateClient = dynamic(() => import("./EditTemplateClient"), { ssr: false });

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !["MANAGER", "ADMIN"].includes(session.user.role)) {
        return <div>No autorizado</div>;
    }

    const template = await prisma.template.findUnique({
        where: { id: params.id },
        include: { fields: { orderBy: { order: "asc" } } },
    });

    if (!template) notFound();

    return <EditTemplateClient template={template} />;
}
