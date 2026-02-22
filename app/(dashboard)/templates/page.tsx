import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, Settings, Eye, Calendar, User } from "lucide-react";
import { DeleteTemplateButton } from "./DeleteTemplateButton";

async function getTemplates() {
    return prisma.template.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            createdBy: { select: { name: true } },
            _count: { select: { fields: true, contracts: true } },
        },
    });
}

export default async function TemplatesPage() {
    const session = await auth();
    const templates = await getTemplates();
    const canCreate = ["MANAGER", "ADMIN"].includes(session!.user.role);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-light mb-1" style={{ fontFamily: "var(--font-cormorant)" }}>
                        Contratos
                    </h1>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {templates.length} plantilla{templates.length !== 1 ? "s" : ""} disponible{templates.length !== 1 ? "s" : ""}
                    </p>
                </div>
                {canCreate && (
                    <Link
                        href="/templates/new"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                            background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))",
                            color: "#000",
                            boxShadow: "0 4px 20px rgba(198,167,94,0.25)",
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Plantilla
                    </Link>
                )}
            </div>

            {/* Templates grid */}
            {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 rounded-2xl"
                    style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: "var(--color-gold-muted)", border: "1px solid rgba(198,167,94,0.2)" }}>
                        <FileText className="w-8 h-8" style={{ color: "var(--color-gold)" }} />
                    </div>
                    <h2 className="text-xl font-medium mb-2" style={{ fontFamily: "var(--font-cormorant)" }}>
                        Sin plantillas
                    </h2>
                    <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                        Cargá tu primer PDF para comenzar
                    </p>
                    {canCreate && (
                        <Link href="/templates/new"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                            style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                            <Plus className="w-4 h-4" />
                            Crear primera plantilla
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {templates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            canEdit={canCreate}
                            userRole={session!.user.role}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TemplateCard({
    template,
    canEdit,
    userRole,
}: {
    template: {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        createdBy: { name: string };
        _count: { fields: number; contracts: number };
    };
    canEdit: boolean;
    userRole: string;
}) {
    const canFill = ["EDITOR", "MANAGER", "ADMIN"].includes(userRole);
    return (
        <div
            className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200"
            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
        >
            {/* Icon + name */}
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--color-gold-muted)", border: "1px solid rgba(198,167,94,0.2)" }}>
                    <FileText className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-tight truncate">{template.name}</h3>
                    {template.description && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                            {template.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span className="flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    {template._count.fields} campo{template._count.fields !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {template._count.contracts} generado{template._count.contracts !== 1 ? "s" : ""}
                </span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-dim)" }}>
                <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {template.createdBy.name}
                </span>
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(template.createdAt).toLocaleDateString("es-AR")}
                </span>
            </div>

            <div className="gold-divider" />

            {/* Actions */}
            <div className="flex items-center gap-2">
                {canFill && (
                    <Link
                        href={`/templates/${template.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Completar
                    </Link>
                )}
                {canEdit && (
                    <>
                        <Link
                            href={`/templates/${template.id}/edit`}
                            className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
                            style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                        >
                            <Settings className="w-4 h-4" />
                        </Link>
                        <DeleteTemplateButton templateId={template.id} />
                    </>
                )}
            </div>
        </div>
    );
}
