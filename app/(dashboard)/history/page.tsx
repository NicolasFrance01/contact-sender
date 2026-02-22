import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function HistoryPage() {
    const session = await auth();
    const isAdmin = session!.user.role === "ADMIN";

    const sends = await prisma.contractSend.findMany({
        orderBy: { sentAt: "desc" },
        take: 100,
        include: {
            contract: { include: { template: { select: { name: true } } } },
            sentBy: { select: { name: true, email: true } },
        },
        ...(isAdmin ? {} : { where: { sentById: session!.user.id } }),
    });

    const statusColor: Record<string, string> = {
        SENT: "var(--color-success)",
        PENDING: "var(--color-warning)",
        ERROR: "var(--color-error)",
    };
    const statusLabel: Record<string, string> = {
        SENT: "Enviado",
        PENDING: "Pendiente",
        ERROR: "Error",
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-light mb-1" style={{ fontFamily: "var(--font-cormorant)" }}>
                    Historial
                </h1>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {sends.length} registro{sends.length !== 1 ? "s" : ""} encontrado{sends.length !== 1 ? "s" : ""}
                </p>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                {sends.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                        No hay contratos enviados aún.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    {["Contrato", "Destinatario", "Canal", "Usuario", "Fecha", "Estado"].map((h) => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest"
                                            style={{ color: "var(--color-text-muted)" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                                {sends.map((send) => (
                                    <tr key={send.id} className="transition-colors" style={{ background: "transparent" }}>
                                        <td className="px-5 py-4 font-medium">{send.contract.template.name}</td>
                                        <td className="px-5 py-4" style={{ color: "var(--color-text-muted)" }}>{send.recipient}</td>
                                        <td className="px-5 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    background: send.channel === "EMAIL" ? "rgba(94,143,224,0.1)" : "rgba(37,211,102,0.1)",
                                                    color: send.channel === "EMAIL" ? "#5E8FE0" : "#25D366",
                                                    border: `1px solid ${send.channel === "EMAIL" ? "rgba(94,143,224,0.2)" : "rgba(37,211,102,0.2)"}`,
                                                }}>
                                                {send.channel === "EMAIL" ? "📧 Email" : "📱 WhatsApp"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4" style={{ color: "var(--color-text-muted)" }}>{send.sentBy.name}</td>
                                        <td className="px-5 py-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                                            {new Date(send.sentAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                                style={{ background: `${statusColor[send.status]}15`, color: statusColor[send.status], border: `1px solid ${statusColor[send.status]}30` }}>
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[send.status] }} />
                                                {statusLabel[send.status]}
                                            </span>
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
