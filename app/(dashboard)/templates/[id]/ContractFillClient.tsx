"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Mail, Phone, Eye, ChevronLeft, ChevronRight, Check, Download, FileText, Plus, Move, Settings } from "lucide-react";
import { formatFieldValue, getFieldTypeLabel } from "@/lib/utils";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Field {
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    maxLength: number | null;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
}

interface Template {
    id: string;
    name: string;
    description: string | null;
    pdfData: string;
    fields: Field[];
}

interface Settings {
    whatsappMessage: string;
    emailSignature: string;
    smtpFrom: string;
    companyName: string;
    companyPhone: string;
}

export function ContractFillClient({
    template,
    settings,
}: {
    template: Template;
    settings: Settings;
}) {
    const router = useRouter();
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [step, setStep] = useState<"form" | "preview" | "send">("form");
    const [sendMode, setSendMode] = useState<"email" | "whatsapp" | null>(null);
    const [contractId, setContractId] = useState<string | null>(null);
    const [generatedPdfData, setGeneratedPdfData] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [apiError, setApiError] = useState("");
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // Email form
    const [emailTo, setEmailTo] = useState("");
    const [emailSubject, setEmailSubject] = useState(`Documento: ${template.name}`);
    const [emailBody, setEmailBody] = useState(settings.emailSignature ? `\n\n---\n${settings.emailSignature}` : "");

    // WhatsApp form
    const [whatsappPhone, setWhatsappPhone] = useState(settings.companyPhone || "");
    const [whatsappMsg, setWhatsappMsg] = useState(settings.whatsappMessage);

    function validate() {
        const errs: Record<string, string> = {};
        for (const field of template.fields) {
            if (field.required && !values[field.name]?.trim()) {
                errs[field.name] = "Campo obligatorio";
            }
            if (field.maxLength && values[field.name]?.length > field.maxLength) {
                errs[field.name] = `Máximo ${field.maxLength} caracteres`;
            }
            if (field.type === "NUMBER" || field.type.startsWith("CURRENCY")) {
                if (values[field.name] && isNaN(Number(values[field.name]?.replace(/[,\.]/g, ".")))) {
                    errs[field.name] = "Debe ser un número válido";
                }
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleGenerate() {
        if (!validate()) return;
        setGenerating(true);
        setApiError("");
        try {
            const res = await fetch(`/api/templates/${template.id}/fill`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ values }),
            });
            if (!res.ok) throw new Error("Error al generar el PDF");
            const data = await res.json();
            setContractId(data.contractId);
            setGeneratedPdfData(data.pdfData);
            setStep("preview");
        } catch (err: unknown) {
            setApiError(err instanceof Error ? err.message : "Error inesperado");
        } finally {
            setGenerating(false);
        }
    }

    async function handleSendEmail() {
        if (!contractId) return;
        setSending(true);
        try {
            const res = await fetch("/api/contracts/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contractId, channel: "EMAIL", recipient: emailTo, subject: emailSubject, body: emailBody }),
            });
            if (!res.ok) throw new Error("Error al enviar el correo");
            setSubmitted(true);
        } catch (err: unknown) {
            setApiError(err instanceof Error ? err.message : "Error al enviar");
        } finally {
            setSending(false);
        }
    }

    function handleDownload() {
        if (!generatedPdfData) return;
        const link = document.createElement("a");
        link.href = generatedPdfData;
        link.download = `contrato-${template.name.replace(/\s+/g, "-")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function handleSendWhatsapp() {
        if (!contractId) return;
        const phone = whatsappPhone.replace(/\D/g, "");
        const msg = encodeURIComponent(whatsappMsg);
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
        // Log the send
        fetch("/api/contracts/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contractId, channel: "WHATSAPP", recipient: whatsappPhone }),
        });
        setSubmitted(true);
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "rgba(94,168,122,0.1)", border: "1px solid rgba(94,168,122,0.3)" }}>
                    <Check className="w-8 h-8" style={{ color: "var(--color-success)" }} />
                </div>
                <h2 className="text-2xl font-light mb-2" style={{ fontFamily: "var(--font-cormorant)" }}>¡Contrato enviado!</h2>
                <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>El documento fue enviado exitosamente.</p>
                <div className="flex gap-3">
                    <button onClick={() => router.push("/templates")}
                        className="px-5 py-2.5 rounded-xl text-sm" style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                        Volver a Contratos
                    </button>
                    <button onClick={() => router.push("/")}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                        Ir al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => step === "form" ? router.back() : setStep(step === "send" ? "preview" : "form")}
                    className="p-2 rounded-xl" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-3xl font-light" style={{ fontFamily: "var(--font-cormorant)" }}>{template.name}</h1>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {step === "form" ? "Completar datos" : step === "preview" ? "Vista previa" : "Enviar documento"}
                    </p>
                </div>
            </div>

            {apiError && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)", color: "var(--color-error)" }}>
                    {apiError}
                </div>
            )}

            {/* FORM */}
            {step === "form" && (
                <div className="max-w-2xl">
                    <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                        {template.fields.length === 0 ? (
                            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Esta plantilla no tiene campos configurados.</p>
                        ) : (
                            template.fields.map((field) => (
                                <div key={field.id}>
                                    <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                                        {field.label} {field.required && <span style={{ color: "var(--color-gold)" }}>*</span>}
                                        <span className="ml-2 normal-case tracking-normal font-normal" style={{ color: "var(--color-text-dim)" }}>
                                            — {getFieldTypeLabel(field.type)}
                                        </span>
                                    </label>
                                    {field.type === "DATE" ? (
                                        <input
                                            type="date"
                                            value={values[field.name] ?? ""}
                                            onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    ) : (
                                        <input
                                            type={field.type === "NUMBER" || field.type.startsWith("CURRENCY") ? "number" : "text"}
                                            step={field.type.startsWith("CURRENCY") ? "0.01" : undefined}
                                            value={values[field.name] ?? ""}
                                            onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                                            maxLength={field.maxLength ?? undefined}
                                            placeholder={`Ingresá ${field.label.toLowerCase()}...`}
                                            className="w-full px-4 py-3 rounded-xl text-sm"
                                        />
                                    )}
                                    {errors[field.name] && (
                                        <p className="text-xs mt-1" style={{ color: "var(--color-error)" }}>{errors[field.name]}</p>
                                    )}
                                </div>
                            ))
                        )}
                        <div className="pt-2">
                            <button onClick={handleGenerate} disabled={generating || template.fields.length === 0}
                                className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                                {generating ? (
                                    <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Generando PDF...</>
                                ) : (
                                    <><Eye className="w-4 h-4" />Vista previa del contrato</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW */}
            {step === "preview" && generatedPdfData && (
                <div>
                    <div className="rounded-2xl overflow-hidden mb-4 flex flex-col" style={{ border: "1px solid var(--color-border)", height: "70vh", background: "var(--color-surface-2)" }}>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" style={{ color: "var(--color-gold)" }} />
                                    <span className="text-sm font-medium">Vista previa del contrato</span>
                                </div>
                                {numPages > 1 && (
                                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-3 border border-border">
                                        <button
                                            disabled={pageNumber <= 1}
                                            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                                            className="p-1 disabled:opacity-30 hover:text-gold transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-medium min-w-[60px] text-center">
                                            Pág. {pageNumber} / {numPages}
                                        </span>
                                        <button
                                            disabled={pageNumber >= numPages}
                                            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                                            className="p-1 disabled:opacity-30 hover:text-gold transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleDownload}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)" }}>
                                <Download className="w-3.5 h-3.5" />
                                Descargar PDF
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-[#1a1a1a] flex justify-center p-4">
                            <Document
                                file={generatedPdfData}
                                onLoadSuccess={onDocumentLoadSuccess}
                                className="shadow-2xl"
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    scale={1.2}
                                />
                            </Document>
                        </div>
                    </div>

                    {/* Summary of filled values */}
                    <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                        <h3 className="text-sm font-medium mb-3">Datos ingresados</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {template.fields.map((field) => (
                                <div key={field.id} className="text-xs">
                                    <span className="block mb-0.5" style={{ color: "var(--color-text-muted)" }}>{field.label}</span>
                                    <span className="font-medium">{formatFieldValue(values[field.name] ?? "", field.type) || "—"}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep("form")}
                            className="px-5 py-3 rounded-xl text-sm" style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                            Editar datos
                        </button>
                        <button onClick={() => setStep("send")}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                            <Send className="w-4 h-4" />
                            Confirmar y Enviar
                        </button>
                    </div>
                </div>
            )}

            {/* SEND */}
            {step === "send" && (
                <div className="max-w-xl space-y-4">
                    <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>
                        Elegí cómo enviar el contrato al cliente:
                    </p>

                    {/* Mode selector */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { mode: "email" as const, icon: Mail, label: "Enviar por Email" },
                            { mode: "whatsapp" as const, icon: Phone, label: "Enviar por WhatsApp" },
                        ].map(({ mode, icon: Icon, label }) => (
                            <button key={mode} onClick={() => setSendMode(mode)}
                                className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all"
                                style={{
                                    background: sendMode === mode ? "var(--color-gold-muted)" : "var(--color-surface-2)",
                                    border: `1px solid ${sendMode === mode ? "rgba(198,167,94,0.4)" : "var(--color-border)"}`,
                                }}>
                                <Icon className="w-6 h-6" style={{ color: sendMode === mode ? "var(--color-gold)" : "var(--color-text-muted)" }} />
                                <span className="text-sm font-medium" style={{ color: sendMode === mode ? "var(--color-gold)" : "var(--color-text)" }}>
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Email form */}
                    {sendMode === "email" && (
                        <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                            <div>
                                <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: "var(--color-text-muted)" }}>Destinatario *</label>
                                <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)}
                                    placeholder="cliente@email.com" className="w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: "var(--color-text-muted)" }}>Asunto</label>
                                <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: "var(--color-text-muted)" }}>Mensaje</label>
                                <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                                    rows={4} className="w-full px-4 py-3 rounded-xl text-sm resize-none" />
                            </div>
                            <button onClick={handleSendEmail} disabled={sending || !emailTo}
                                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                                {sending ? <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Enviando...</> : <><Mail className="w-4 h-4" />Enviar Email</>}
                            </button>
                        </div>
                    )}

                    {/* WhatsApp form */}
                    {sendMode === "whatsapp" && (
                        <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                            <div>
                                <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: "var(--color-text-muted)" }}>Número (con código de país)</label>
                                <input type="tel" value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)}
                                    placeholder="5491112345678" className="w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium uppercase tracking-widest block mb-2" style={{ color: "var(--color-text-muted)" }}>Mensaje</label>
                                <textarea value={whatsappMsg} onChange={(e) => setWhatsappMsg(e.target.value)}
                                    rows={4} className="w-full px-4 py-3 rounded-xl text-sm resize-none" />
                            </div>
                            <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(198,167,94,0.05)", border: "1px solid rgba(198,167,94,0.2)" }}>
                                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                    💡 Se abrirá WhatsApp Web/Desktop. Por limitaciones de WhatsApp, el archivo no se adjunta automáticamente.
                                </p>
                                <button onClick={handleDownload}
                                    className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                                    style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-gold)" }}>
                                    <Download className="w-3.5 h-3.5" />
                                    Descargar PDF para adjuntar
                                </button>
                            </div>
                            <button onClick={handleSendWhatsapp} disabled={!whatsappPhone}
                                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff" }}>
                                <Phone className="w-4 h-4" />
                                Abrir WhatsApp
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
