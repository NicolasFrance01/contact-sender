"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, ChevronRight, ChevronLeft, Save, Settings, Move, FileText, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { getFieldTypeLabel } from "@/lib/utils";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import React, { memo } from "react";

// Set the worker URL correctly for react-pdf/pdfjs
const PDFJS_VERSION = pdfjs.version || '4.0.379'; // Fallback to a known working version if undefined
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

// Static options to prevent re-renders
const PDF_OPTIONS = {
    cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
};

// Create a stable PDF viewer that ONLY re-renders when the PDF itself changes
const StablePDFViewer = memo(({
    file,
    pageNumber,
    scale,
    onLoadSuccess,
}: {
    file: any;
    pageNumber: number;
    scale: number;
    onLoadSuccess: (data: any) => void;
}) => {
    return (
        <Document
            file={file}
            onLoadSuccess={onLoadSuccess}
            onLoadError={(err) => console.error("PDF Load Error:", err)}
            options={PDF_OPTIONS}
            loading={null}
            className="relative"
        >
            <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                scale={scale}
                loading={null}
                className="shadow-2xl"
            />
        </Document>
    );
}, (prev, next) => {
    return prev.file === next.file &&
        prev.pageNumber === next.pageNumber &&
        prev.scale === next.scale;
});

StablePDFViewer.displayName = "StablePDFViewer";

interface FieldBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    name: string;
    label: string;
    type: string;
    required: boolean;
    maxLength: number | null;
}

const FIELD_TYPES = [
    { value: "TEXT", label: "Texto" },
    { value: "NUMBER", label: "Número" },
    { value: "CURRENCY_ARS", label: "Moneda ARS ($)" },
    { value: "CURRENCY_USD", label: "Moneda USD (U$D)" },
    { value: "CURRENCY_EUR", label: "Moneda EUR (€)" },
    { value: "DATE", label: "Fecha" },
    { value: "CUSTOM", label: "Personalizado" },
];

export default function EditTemplateClient({ template }: { template: any }) {
    const router = useRouter();
    const [step, setStep] = useState(2); // Start at configuration for editing
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(template.pdfData);
    const [fields, setFields] = useState<FieldBox[]>(
        template.fields.map((f: any) => ({
            id: f.id,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
            page: f.page,
            name: f.name,
            label: f.label,
            type: f.type,
            required: f.required,
            maxLength: f.maxLength,
        }))
    );
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState(template.name);
    const [templateDesc, setTemplateDesc] = useState(template.description || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    // Drag-and-drop state
    const [isDraggingField, setIsDraggingField] = useState(false);
    const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const previewRef = useRef<HTMLDivElement>(null);
    const pdfWrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);

    function handleFileSelect(file: File) {
        if (file.type !== "application/pdf") {
            setError("Solo se aceptan archivos PDF.");
            return;
        }
        setPdfFile(file);
        const url = URL.createObjectURL(file);
        setPdfPreviewUrl(url);
        setError("");
        setPageNumber(1);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }

    function addField() {
        const newField: FieldBox = {
            id: Date.now().toString(),
            x: 60,
            y: 60,
            width: 200,
            height: 32,
            page: pageNumber - 1,
            name: `campo_${fields.length + 1}`,
            label: `Campo ${fields.length + 1}`,
            type: "TEXT",
            required: true,
            maxLength: null,
        };
        setFields([...fields, newField]);
        setSelectedField(newField.id);
    }

    function updateField(id: string, updates: Partial<FieldBox>) {
        setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    }

    function removeField(id: string) {
        setFields(fields.filter((f) => f.id !== id));
        if (selectedField === id) setSelectedField(null);
    }

    // Drag and Drop implementation
    const startDragging = (e: React.MouseEvent, field: FieldBox) => {
        setIsDraggingField(true);
        setDraggedFieldId(field.id);
        setSelectedField(field.id);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.stopPropagation();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingField || !draggedFieldId || !pdfWrapperRef.current) return;

        const rect = pdfWrapperRef.current.getBoundingClientRect();

        // Calculate position relative to the PDF wrapper itself
        const x = e.clientX - rect.left - dragOffset.x;
        const y = e.clientY - rect.top - dragOffset.y;

        // Convert screen pixels to base PDF pixels by dividing by scale
        const baseFieldX = x / scale;
        const baseFieldY = y / scale;

        updateField(draggedFieldId, {
            x: Math.max(0, baseFieldX),
            y: Math.max(0, baseFieldY)
        });
    };

    const stopDragging = () => {
        setIsDraggingField(false);
        setDraggedFieldId(null);
    };

    useEffect(() => {
        if (isDraggingField) {
            window.addEventListener('mouseup', stopDragging);
            return () => window.removeEventListener('mouseup', stopDragging);
        }
    }, [isDraggingField]);

    async function handleSave() {
        if (!templateName.trim()) return setError("Ingresá un nombre para la plantilla.");
        if (fields.length === 0) return setError("Agregá al menos un campo.");

        setSaving(true);
        setError("");
        try {
            let pdfData = null;
            if (pdfFile) {
                const formData = new FormData();
                formData.append("pdf", pdfFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("Error al subir el PDF");
                const uploadData = await uploadRes.json();
                pdfData = uploadData.pdfData;
            }

            const res = await fetch(`/api/templates/${template.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: templateName.trim(),
                    description: templateDesc.trim() || null,
                    pdfData,
                    fields: fields.map((f, i) => ({ ...f, order: i })),
                }),
            });
            if (!res.ok) throw new Error("Error al actualizar la plantilla");
            router.push("/templates");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error inesperado");
        } finally {
            setSaving(false);
        }
    }

    const selectedFieldData = fields.find((f) => f.id === selectedField);

    return (
        <div className="animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => router.back()} className="p-2 rounded-xl"
                    style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-3xl font-light" style={{ fontFamily: "var(--font-cormorant)" }}>
                        Editar Plantilla
                    </h1>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        {template.name}
                    </p>
                </div>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-3 mb-8">
                {["Cambiar PDF", "Configurar campos", "Guardar"].map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all`}
                            style={{
                                background: step === i + 1 ? "var(--color-gold-muted)" : "var(--color-surface-2)",
                                border: `1px solid ${step === i + 1 ? "rgba(198,167,94,0.3)" : "var(--color-border)"}`,
                                color: step > i ? (step === i + 1 ? "var(--color-gold)" : "var(--color-text)") : "var(--color-text-muted)",
                            }}>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                                style={{ background: step > i ? "var(--color-gold)" : "var(--color-surface-3)", color: step > i ? "#000" : "var(--color-text-muted)" }}>
                                {i + 1}
                            </span>
                            {s}
                        </div>
                        {i < 2 && <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-dim)" }} />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)", color: "var(--color-error)" }}>
                    {error}
                </div>
            )}

            {/* Step 1: Change PDF */}
            {step === 1 && (
                <div className="max-w-2xl">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-4 p-12 rounded-2xl cursor-pointer"
                        style={{
                            border: `2px dashed ${dragging ? "var(--color-gold)" : "var(--color-border)"}`,
                            background: dragging ? "var(--color-gold-muted)" : "var(--color-surface-2)",
                        }}
                    >
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: "var(--color-gold-muted)", border: "1px solid rgba(198,167,94,0.2)" }}>
                            <Upload className="w-8 h-8" style={{ color: "var(--color-gold)" }} />
                        </div>
                        <div className="text-center">
                            <p className="font-medium mb-1">
                                {pdfFile ? pdfFile.name : "Subir nuevo PDF para reemplazar el actual"}
                            </p>
                            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>O dejá el actual si no querés cambiarlo</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        />
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}
                    >
                        Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Step 2: Configure fields */}
            {step === 2 && (
                <div className="flex gap-6 h-[calc(100vh-280px)]">
                    <div className="flex-1 rounded-2xl overflow-hidden relative flex flex-col"
                        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{pdfFile?.name || "PDF Original"}</span>
                                    {numPages > 1 && (
                                        <div className="flex items-center gap-2 ml-4 px-2 py-1 rounded-lg bg-surface-3 border border-border">
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

                                {/* Zoom Controls */}
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-3 border border-border ml-2">
                                    <button
                                        onClick={() => setScale(prev => Math.max(0.4, prev - 0.1))}
                                        className="p-1 hover:text-gold transition-colors"
                                        title="Alejar"
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-medium min-w-[45px] text-center">
                                        {Math.round(scale * 100)}%
                                    </span>
                                    <button
                                        onClick={() => setScale(prev => Math.min(3, prev + 0.1))}
                                        className="p-1 hover:text-gold transition-colors"
                                        title="Acercar"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <div className="w-[1px] h-4 bg-border mx-1" />
                                    <button
                                        onClick={() => setScale(1.0)}
                                        className="p-1 hover:text-gold transition-colors"
                                        title="Ajustar"
                                    >
                                        <Maximize className="w-4 h-4" />
                                    </button>
                                </div>

                                <span className="text-xs px-2 py-0.5 rounded-full hidden lg:block" style={{ background: "var(--color-surface-3)", color: "var(--color-text-dim)" }}>
                                    Matené apretado un campo para moverlo
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setStep(1)}
                                    className="px-3 py-1.5 rounded-lg text-xs"
                                    style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)" }}>
                                    Cambiar PDF
                                </button>
                                <button onClick={addField}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                    style={{ background: "var(--color-gold-muted)", border: "1px solid rgba(198,167,94,0.3)", color: "var(--color-gold)" }}>
                                    <Plus className="w-3.5 h-3.5" />
                                    Agregar campo
                                </button>
                            </div>
                        </div>

                        <div
                            ref={previewRef}
                            onMouseMove={handleMouseMove}
                            onMouseUp={stopDragging}
                            className="relative flex-1 w-full overflow-auto bg-[#1a1a1a] flex justify-center p-8"
                        >
                            <div ref={pdfWrapperRef} className="relative inline-block">
                                {pdfPreviewUrl && (
                                    <>
                                        <StablePDFViewer
                                            file={pdfPreviewUrl}
                                            pageNumber={pageNumber}
                                            scale={scale}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                        />

                                        {/* Interaction layer overlayed EXACTLY on the page */}
                                        <div className="absolute inset-0 z-10 pointer-events-none">
                                            {fields
                                                .filter(f => f.page === pageNumber - 1)
                                                .map((field) => (
                                                    <div
                                                        key={field.id}
                                                        onMouseDown={(e) => startDragging(e, field)}
                                                        className={`absolute cursor-move select-none transition-shadow pointer-events-auto ${isDraggingField && draggedFieldId === field.id ? 'z-50' : 'z-20'}`}
                                                        style={{
                                                            left: field.x * scale,
                                                            top: field.y * scale,
                                                            width: field.width * scale,
                                                            height: field.height * scale,
                                                            border: `2px solid ${selectedField === field.id ? "var(--color-gold)" : "rgba(198,167,94,0.5)"}`,
                                                            background: selectedField === field.id ? "rgba(198,167,94,0.2)" : "rgba(198,167,94,0.08)",
                                                            borderRadius: "4px",
                                                            boxShadow: selectedField === field.id ? "0 0 15px rgba(198,167,94,0.3)" : "none",
                                                        }}
                                                    >
                                                        <div className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                                                            style={{
                                                                background: "var(--color-surface-1)",
                                                                border: `1px solid ${selectedField === field.id ? "var(--color-gold)" : "var(--color-border)"}`,
                                                                color: selectedField === field.id ? "var(--color-gold)" : "var(--color-text)",
                                                                transformOrigin: "left bottom",
                                                                transform: scale < 0.8 ? `scale(${1 / scale * 0.8})` : "none"
                                                            }}>
                                                            <Move className="w-2.5 h-2.5" />
                                                            {field.label}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-80 flex flex-col gap-3">
                        <div className="flex-1 rounded-2xl overflow-hidden flex flex-col"
                            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                            <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                                <span className="text-sm font-medium">{fields.length} campos</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {fields.map((field) => (
                                    <div
                                        key={field.id}
                                        onClick={() => setSelectedField(field.id)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all border"
                                        style={{
                                            background: selectedField === field.id ? "var(--color-gold-muted)" : "var(--color-surface-3)",
                                            borderColor: selectedField === field.id ? "var(--color-gold)" : "var(--color-border)",
                                        }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium truncate">{field.label}</div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                            className="p-1 hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedFieldData && (
                            <div className="rounded-2xl p-4 space-y-3 bg-surface-2 border border-gold shadow-lg">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase block mb-1">Etiqueta</label>
                                        <input className="w-full px-3 py-2 rounded-lg text-sm bg-surface-3 border-border" value={selectedFieldData.label}
                                            onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase block mb-1">Tipo</label>
                                        <select className="w-full px-3 py-2 rounded-lg text-sm bg-surface-3 border-border" value={selectedFieldData.type}
                                            onChange={(e) => updateField(selectedFieldData.id, { type: e.target.value })}>
                                            {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setStep(3)}
                            className="w-full py-3 rounded-xl text-sm font-semibold mt-auto"
                            style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                            Finalizar
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Save */}
            {step === 3 && (
                <div className="max-w-lg mx-auto">
                    <div className="rounded-2xl p-8 space-y-6 bg-surface-2 border border-border shadow-2xl">
                        <div className="text-center">
                            <h2 className="text-3xl font-light mb-2" style={{ fontFamily: "var(--font-cormorant)" }}>Actualizar Plantilla</h2>
                            <p className="text-sm text-dim">Confirmá los cambios</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">Nombre</label>
                                <input value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">Descripción</label>
                                <textarea value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)}
                                    rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-xl text-sm border border-border bg-surface-3">Atrás</button>
                            <button onClick={handleSave} disabled={saving || !templateName.trim()}
                                className="flex-3 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                                style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                                {saving ? "Guardando..." : "Actualizar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
