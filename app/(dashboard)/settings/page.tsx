"use client";

import { useState, useEffect } from "react";
import { Save, Building, Mail, MessageSquare, Shield, Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"empresa" | "email" | "mensajes">("empresa");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [settings, setSettings] = useState({
        companyName: "",
        companyPhone: "",
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        smtpFrom: "",
        whatsappMessage: "",
        emailSignature: "",
    });

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                setSettings(data);
                setLoading(false);
            });
    }, []);

    async function handleSave() {
        setSaving(true);
        setError("");
        setSuccess(false);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error("Error al guardar la configuración");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error inesperado");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light mb-1" style={{ fontFamily: "var(--font-cormorant)" }}>
                        Configuración
                    </h1>
                    <p className="text-sm text-muted-foreground" style={{ color: "var(--color-text-muted)" }}>
                        Administrá los datos de tu empresa y servicios externos
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                        background: success ? "var(--color-success)" : "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))",
                        color: success ? "#fff" : "#000",
                        boxShadow: success ? "none" : "0 4px 20px rgba(198,167,94,0.25)",
                    }}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? "Guardando..." : success ? "Guardado" : "Guardar Cambios"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1 space-y-1">
                    {[
                        { id: "empresa", icon: Building, label: "Empresa" },
                        { id: "email", icon: Mail, label: "Correo / SMTP" },
                        { id: "mensajes", icon: MessageSquare, label: "Mensajería" },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                                style={{
                                    background: isActive ? "var(--color-gold-muted)" : "transparent",
                                    color: isActive ? "var(--color-gold)" : "var(--color-text-muted)",
                                    border: isActive ? "1px solid rgba(198,167,94,0.2)" : "1px solid transparent",
                                }}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="rounded-2xl p-8" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)", color: "var(--color-error)" }}>
                                {error}
                            </div>
                        )}

                        {activeTab === "empresa" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Nombre de la Empresa</label>
                                        <input
                                            value={settings.companyName}
                                            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                            placeholder="Mi Escribanía"
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Teléfono de contacto</label>
                                        <input
                                            value={settings.companyPhone}
                                            onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                                            placeholder="5491112345678"
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "email" && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="p-4 rounded-xl flex gap-3 text-sm mb-4" style={{ background: "rgba(198,167,94,0.05)", border: "1px solid rgba(198,167,94,0.15)" }}>
                                    <Shield className="w-5 h-5 flex-shrink-0 text-gold" style={{ color: "var(--color-gold)" }} />
                                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                        Estos datos son necesarios para que el sistema envíe los correos desde tu propia cuenta. Si usás Gmail, recordá usar una **Contraseña de Aplicación**.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Servidor SMTP (Host)</label>
                                        <input
                                            value={settings.smtpHost}
                                            onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                            placeholder="smtp.gmail.com"
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Puerto SMTP</label>
                                        <input
                                            type="number"
                                            value={settings.smtpPort}
                                            onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                                            placeholder="587"
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Usuario / Email</label>
                                        <input
                                            value={settings.smtpUser}
                                            onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                                            placeholder="tu-email@gmail.com"
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Contraseña</label>
                                        <input
                                            type="password"
                                            value={settings.smtpPass}
                                            onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                                            placeholder="••••••••••••"
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Email Remitente (Alias)</label>
                                        <input
                                            value={settings.smtpFrom}
                                            onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                                            placeholder="Escribanía Rossi <info@rossi.com>"
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "mensajes" && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Mensaje predeterminado WhatsApp</label>
                                    <textarea
                                        value={settings.whatsappMessage}
                                        onChange={(e) => setSettings({ ...settings, whatsappMessage: e.target.value })}
                                        rows={4}
                                        placeholder="Estimado/a cliente..."
                                        className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Firma para correos electrónicos</label>
                                    <textarea
                                        value={settings.emailSignature}
                                        onChange={(e) => setSettings({ ...settings, emailSignature: e.target.value })}
                                        rows={6}
                                        placeholder="Saludos cordiales, Atte. Mi Empresa."
                                        className="w-full px-4 py-3 rounded-xl text-sm resize-none tracking-tight leading-relaxed"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
