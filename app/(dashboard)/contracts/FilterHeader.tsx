"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, X, Calendar, User, FileText, Filter } from "lucide-react";

interface FilterHeaderProps {
    templates: { id: string; name: string }[];
    users: { id: string; name: string }[];
    isAdmin: boolean;
}

export function FilterHeader({ templates, users, isAdmin }: FilterHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [startDate, setStartDate] = useState(searchParams.get("from") || "");
    const [endDate, setEndDate] = useState(searchParams.get("to") || "");
    const [templateId, setTemplateId] = useState(searchParams.get("templateId") || "");
    const [userId, setUserId] = useState(searchParams.get("userId") || "");

    const updateFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (startDate) params.set("from", startDate);
        else params.delete("from");

        if (endDate) params.set("to", endDate);
        else params.delete("to");

        if (templateId) params.set("templateId", templateId);
        else params.delete("templateId");

        if (userId) params.set("userId", userId);
        else params.delete("userId");

        router.push(`/contracts?${params.toString()}`);
    }, [startDate, endDate, templateId, userId, searchParams, router]);

    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setTemplateId("");
        setUserId("");
        router.push("/contracts");
    };

    // Apply filters when values change (debounced or on blur? Let's do a button for dates/selects for simplicity or just onChange for selects)
    useEffect(() => {
        // We could auto-apply for selects
    }, [templateId, userId]);

    return (
        <div className="mb-6 p-4 rounded-2xl border border-border" style={{ background: "var(--color-surface-2)" }}>
            <div className="flex flex-wrap items-end gap-4">
                {/* Contract / Template Filter */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                        Plantilla
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
                        <select
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            className="w-full bg-surface-3 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50 appearance-none"
                            style={{ background: "var(--color-surface-3)" }}
                        >
                            <option value="">Todas las plantillas</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* User Filter (Admin only) */}
                {isAdmin && (
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                            Generado por
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full bg-surface-3 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50 appearance-none"
                                style={{ background: "var(--color-surface-3)" }}
                            >
                                <option value="">Todos los usuarios</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Date Filters */}
                <div className="flex gap-4">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                            Desde
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-surface-3 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
                                style={{ background: "var(--color-surface-3)" }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
                            Hasta
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-surface-3 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
                                style={{ background: "var(--color-surface-3)" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={updateFilters}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                        style={{ background: "var(--color-gold)", color: "#000" }}
                    >
                        <Filter className="w-4 h-4" />
                        Filtrar
                    </button>
                    {(templateId || userId || startDate || endDate) && (
                        <button
                            onClick={clearFilters}
                            className="p-2 rounded-lg border border-border hover:bg-surface-3 transition-colors"
                            style={{ background: "var(--color-surface-3)", color: "var(--color-text-muted)" }}
                            title="Limpiar filtros"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
