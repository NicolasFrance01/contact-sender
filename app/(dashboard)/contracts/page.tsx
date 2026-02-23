import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { FileText, Eye, Calendar, User, Clock, Download } from "lucide-react";
import Link from "next/link";

export default async function ContractsPage() {
    const session = await auth();
    const isAdmin = session!.user.role === "ADMIN";

    const contracts = await prisma.contract.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            template: { select: { name: true } },
            generatedBy: { select: { name: true } },
        },
        ...(isAdmin ? {} : { where: { generatedById: session!.user.id } }),
    });

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-light mb-1" style={{ fontFamily: "var(--font-cormorant)" }}>
                    Contratos Generados
                </h1>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {contracts.length} documento{contracts.length !== 1 ? "s" : ""} generado{contracts.length !== 1 ? "s" : ""}
                </p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                {contracts.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                        No se han generado contratos aún.
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
                                                    href={(contract as any).pdfData}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                    style={{ background: "var(--color-gold-muted)", color: "var(--color-gold)", border: "1px solid rgba(198,167,94,0.3)" }}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Visualizar
                                                </a>
                                                <a
                                                    href={(contract as any).pdfData}
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
