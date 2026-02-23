import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { FileText, Eye, Calendar, User, Clock, Download } from "lucide-react";
import Link from "next/link";
import { FilterHeader } from "./FilterHeader";

interface PageProps {
    searchParams: {
        from?: string;
        to?: string;
        templateId?: string;
        userId?: string;
    };
}

export default async function ContractsPage({ searchParams }: PageProps) {
    const session = await auth();
    const isAdmin = ["ADMIN", "MANAGER"].includes(session!.user.role as string);

    // Build filters
    const where: any = {};

    if (!isAdmin) {
        where.generatedById = session!.user.id;
    } else if (searchParams.userId) {
        where.generatedById = searchParams.userId;
    }

    if (searchParams.templateId) {
        where.templateId = searchParams.templateId;
    }

    if (searchParams.from || searchParams.to) {
        where.createdAt = {};
        if (searchParams.from) {
            where.createdAt.gte = new Date(searchParams.from);
        }
        if (searchParams.to) {
            // Set to end of day
            const toDate = new Date(searchParams.to);
            toDate.setHours(23, 59, 59, 999);
            where.createdAt.lte = toDate;
        }
    }

    const [contracts, allTemplates, allUsers] = await Promise.all([
        prisma.contract.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                template: { select: { name: true } },
                generatedBy: { select: { name: true } },
            },
        }),
        prisma.template.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        }),
        isAdmin ? prisma.user.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        }) : Promise.resolve([])
    ]);

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-light mb-1" style={{ fontFamily: "var(--font-cormorant)" }}>
                    Contratos Generados
                </h1>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {contracts.length} documento{contracts.length !== 1 ? "s" : ""} encontrado{contracts.length !== 1 ? "s" : ""}
                </p>
            </div>

            <FilterHeader
                templates={allTemplates}
                users={allUsers}
                isAdmin={isAdmin}
            />

            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                {contracts.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                        No se encontraron contratos con los filtros aplicados.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    {["Contrato", "Generado por", "Fecha", "Acciones"].map((h) => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest"
                                            style={{ color: "var(--color-text-muted)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                                {contracts.map((contract) => (
                                    <tr key={contract.id} className="transition-colors hover:bg-surface-3/30">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ background: "var(--color-gold-muted)", border: "1px solid rgba(198,167,94,0.2)" }}>
                                                    <FileText className="w-4 h-4 text-gold" style={{ color: "var(--color-gold)" }} />
                                                </div>
                                                <span className="font-medium">{contract.template.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                                                <User className="w-3.5 h-3.5" />
                                                {contract.generatedBy.name}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(contract.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`/api/contracts/${contract.id}/view`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                    style={{ background: "var(--color-gold-muted)", color: "var(--color-gold)", border: "1px solid rgba(198,167,94,0.3)" }}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Visualizar
                                                </a>
                                                <a
                                                    href={`/api/contracts/${contract.id}/view`}
                                                    download={`contrato_${contract.id}.pdf`}
                                                    className="p-1.5 rounded-lg transition-colors border border-border"
                                                    style={{ background: "var(--color-surface-3)", color: "var(--color-text-muted)" }}
                                                    title="Descargar"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
