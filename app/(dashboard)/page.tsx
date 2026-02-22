import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, History, Settings, TrendingUp, Clock, Send } from "lucide-react";

async function getStats(userId: string, role: string) {
    const whereClauseForContracts = role === "ADMIN" ? {} : { generatedById: userId };
    const whereClauseForSends = role === "ADMIN" ? { status: "SENT" } : { sentById: userId, status: "SENT" };

    const [templates, contracts, sends] = await Promise.all([
        prisma.template.count(),
        prisma.contract.count({ where: whereClauseForContracts }),
        prisma.contractSend.count({ where: whereClauseForSends }),
    ]);

    const recentContracts = await prisma.contract.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { template: true, generatedBy: { select: { name: true } } },
        where: role === "ADMIN" ? {} : { generatedById: userId },
    });
    return { templates, contracts, sends, recentContracts };
}

export default async function DashboardPage() {
    const session = await auth();
    const stats = await getStats(session!.user.id, session!.user.role);

    const statCards = [
        { label: "Plantillas activas", value: stats.templates, icon: FileText, color: "var(--color-gold)" },
        { label: "Contratos generados", value: stats.contracts, icon: TrendingUp, color: "#5EA87A" },
        { label: "Envíos exitosos", value: stats.sends, icon: Send, color: "#5E8FE0" },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-light mb-1" style={{ fontFamily: "var(--font-cormorant)" }}>
                    Bienvenido, <span className="text-gradient-gold">{session!.user.name}</span>
                </h1>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-2xl p-6 transition-all duration-200"
                            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: `${card.color}20`, border: `1px solid ${card.color}30` }}>
                                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                                </div>
                            </div>
                            <div className="text-3xl font-semibold mb-1">{card.value}</div>
                            <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>{card.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Link href="/templates" className="group rounded-2xl p-6 flex items-center gap-4 transition-all duration-200"
                    style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
                    onMouseEnter={undefined}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-gold-muted)", border: "1px solid rgba(198,167,94,0.2)" }}>
                        <FileText className="w-6 h-6" style={{ color: "var(--color-gold)" }} />
                    </div>
                    <div>
                        <div className="font-medium mb-0.5">Ver Contratos</div>
                        <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Administrar plantillas y generar documentos</div>
                    </div>
                </Link>
                <Link href="/history" className="group rounded-2xl p-6 flex items-center gap-4 transition-all duration-200"
                    style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(94,143,224,0.1)", border: "1px solid rgba(94,143,224,0.2)" }}>
                        <History className="w-6 h-6" style={{ color: "#5E8FE0" }} />
                    </div>
                    <div>
                        <div className="font-medium mb-0.5">Historial</div>
                        <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>Registro de contratos generados y enviados</div>
                    </div>
                </Link>
            </div>

            {/* Recent contracts */}
            <div className="rounded-2xl" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: "var(--color-gold)" }} />
                        <h2 className="text-base font-medium">Contratos recientes</h2>
                    </div>
                    <Link href="/history" className="text-sm" style={{ color: "var(--color-gold)" }}>
                        Ver todos →
                    </Link>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                    {stats.recentContracts.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                            No hay contratos generados aún.{" "}
                            <Link href="/templates" style={{ color: "var(--color-gold)" }}>Crear el primero →</Link>
                        </div>
                    ) : (
                        stats.recentContracts.map((contract) => (
                            <div key={contract.id} className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <div className="text-sm font-medium">{contract.template.name}</div>
                                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                                        Por {contract.generatedBy.name}
                                    </div>
                                </div>
                                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                    {new Date(contract.createdAt).toLocaleDateString("es-AR")}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
