"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, ChevronRight, ChevronLeft, Save, Settings, Move } from "lucide-react";
import { getFieldTypeLabel } from "@/lib/utils";

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

export default function NewTemplatePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [fields, setFields] = useState<FieldBox[]>([]);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState("");
    const [templateDesc, setTemplateDesc] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dragging, setDragging] = useState(false);

    // Drag-and-drop state
    const [isDraggingField, setIsDraggingField] = useState(false);
    const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileSelect(file: File) {
        if (file.type !== "application/pdf") {
            setError("Solo se aceptan archivos PDF.");
            return;
        }
        setPdfFile(file);
        const url = URL.createObjectURL(file);
        setPdfPreviewUrl(url);
        setError("");
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
            page: 0,
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
        if (!isDraggingField || !draggedFieldId || !previewRef.current) return;

        const containerRect = previewRef.current.getBoundingClientRect();
        const scrollLeft = previewRef.current.scrollLeft;
        const scrollTop = previewRef.current.scrollTop;

        let newX = e.clientX - containerRect.left + scrollLeft - dragOffset.x;
        let newY = e.clientY - containerRect.top + scrollTop - dragOffset.y;

        // Contain within preview reasonably
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);

        updateField(draggedFieldId, { x: newX, y: newY });
    };

    const stopDragging = () => {
        setIsDraggingField(false);
        setDraggedFieldId(null);
    };

    // Global listeners for stopping drag outside
    useEffect(() => {
        if (isDraggingField) {
            window.addEventListener('mouseup', stopDragging);
            return () => window.removeEventListener('mouseup', stopDragging);
        }
    }, [isDraggingField]);

    async function handleSave() {
        if (!pdfFile) return setError("Seleccioná un archivo PDF.");
        if (!templateName.trim()) return setError("Ingresá un nombre para la plantilla.");
        if (fields.length === 0) return setError("Agregá al menos un campo.");

        setSaving(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("pdf", pdfFile);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
            if (!uploadRes.ok) throw new Error("Error al subir el PDF");
            const { path: pdfPath } = await uploadRes.json();

            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: templateName.trim(),
                    description: templateDesc.trim() || null,
                    pdfPath,
                    fields: fields.map((f, i) => ({ ...f, order: i })),
                }),
            });
            if (!res.ok) throw new Error("Error al guardar la plantilla");
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
                <button onClick={() => router.back()} className="p-2 rounded-xl transition-colors"
                    style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-3xl font-light" style={{ fontFamily: "var(--font-cormorant)" }}>
                        Nueva Plantilla
                    </h1>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                        Paso {step} de 3
                    </p>
                </div>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-3 mb-8">
                {["Subir PDF", "Configurar campos", "Guardar"].map((s, i) => (
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

            {/* Step 1: Upload PDF */}
            {step === 1 && (
                <div className="max-w-2xl">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-4 p-12 rounded-2xl cursor-pointer transition-all duration-200"
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
                                {pdfFile ? pdfFile.name : "Arrastrá tu PDF o hacé clic para seleccionar"}
                            </p>
                            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Solo archivos PDF · Máx. 20MB</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        />
                    </div>

                    {pdfFile && (
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
                                style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)" }}>
                                <span className="text-sm font-medium">{pdfFile.name}</span>
                                <span className="text-xs ml-auto" style={{ color: "var(--color-text-muted)" }}>
                                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                            <button onClick={() => { setPdfFile(null); setPdfPreviewUrl(null); }}
                                className="p-3 rounded-xl" style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <button
                        disabled={!pdfFile}
                        onClick={() => setStep(2)}
                        className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}
                    >
                        Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Step 2: Configure fields */}
            {step === 2 && (
                <div className="flex gap-6 h-[calc(100vh-280px)]">
                    {/* PDF preview area */}
                    <div className="flex-1 rounded-2xl overflow-hidden relative flex flex-col"
                        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{pdfFile?.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-3)", color: "var(--color-text-dim)" }}>
                                    Matené apretado un campo para moverlo
                                </span>
                            </div>
                            <button onClick={addField}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "var(--color-gold-muted)", border: "1px solid rgba(198,167,94,0.3)", color: "var(--color-gold)" }}>
                                <Plus className="w-3.5 h-3.5" />
                                Agregar campo
                            </button>
                        </div>

                        {/* PDF container with overlay */}
                        <div
                            ref={previewRef}
                            onMouseMove={handleMouseMove}
                            onMouseUp={stopDragging}
                            className="relative flex-1 w-full overflow-auto bg-[#1a1a1a]"
                        >
                            {pdfPreviewUrl && (
                                <iframe
                                    src={pdfPreviewUrl + "#toolbar=0&navpanes=0"}
                                    className="w-full h-full pointer-events-none"
                                    style={{ minHeight: "800px", border: "none" }}
                                />
                            )}

                            {/* Interaction layer */}
                            <div className="absolute inset-0 z-10" style={{ minHeight: "800px" }}>
                                {fields.map((field) => (
                                    <div
                                        key={field.id}
                                        onMouseDown={(e) => startDragging(e, field)}
                                        className={`absolute cursor-move select-none transition-shadow ${isDraggingField && draggedFieldId === field.id ? 'z-50' : 'z-20'}`}
                                        style={{
                                            left: field.x,
                                            top: field.y,
                                            width: field.width,
                                            height: field.height,
                                            border: `2px solid ${selectedField === field.id ? "var(--color-gold)" : "rgba(198,167,94,0.5)"}`,
                                            background: selectedField === field.id ? "rgba(198,167,94,0.2)" : "rgba(198,167,94,0.08)",
                                            borderRadius: "4px",
                                            boxShadow: selectedField === field.id ? "0 0 15px rgba(198,167,94,0.3)" : "none",
                                        }}
                                    >
                                        <div className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium"
                                            style={{ background: "var(--color-surface-1)", border: `1px solid ${selectedField === field.id ? "var(--color-gold)" : "var(--color-border)"}`, color: selectedField === field.id ? "var(--color-gold)" : "var(--color-text)" }}>
                                            <Move className="w-2.5 h-2.5" />
                                            {field.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: List & Config */}
                    <div className="w-80 flex flex-col gap-3">
                        {/* Fields list */}
                        <div className="flex-1 rounded-2xl overflow-hidden flex flex-col"
                            style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-border)" }}>
                                <span className="text-sm font-medium">{fields.length} campos</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {fields.length === 0 ? (
                                    <p className="text-xs text-center py-8" style={{ color: "var(--color-text-muted)" }}>
                                        No hay campos. Agregá uno para empezar.
                                    </p>
                                ) : (
                                    fields.map((field) => (
                                        <div
                                            key={field.id}
                                            onClick={() => setSelectedField(field.id)}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                                            style={{
                                                background: selectedField === field.id ? "var(--color-gold-muted)" : "var(--color-surface-3)",
                                                border: `1px solid ${selectedField === field.id ? "rgba(198,167,94,0.3)" : "var(--color-border)"}`,
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium truncate">{field.label}</div>
                                                <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                                                    {getFieldTypeLabel(field.type)}
                                                </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                                className="p-1 hover:text-red-500 transition-colors" style={{ color: "var(--color-text-dim)" }}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Config Panel */}
                        {selectedFieldData && (
                            <div className="rounded-2xl p-4 space-y-3 overflow-y-auto animate-slide-up"
                                style={{ maxHeight: "400px", background: "var(--color-surface-2)", border: "1px solid var(--color-gold)", boxShadow: "0 8px 32px rgba(198,167,94,0.15)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Settings className="w-4 h-4" style={{ color: "var(--color-gold)" }} />
                                    <span className="text-sm font-medium text-gradient-gold">Configuración</span>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--color-text-muted)" }}>Etiqueta</label>
                                        <input className="w-full px-3 py-2 rounded-lg text-sm bg-surface-3 border-border" value={selectedFieldData.label}
                                            onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--color-text-muted)" }}>Tipo</label>
                                        <select className="w-full px-3 py-2 rounded-lg text-sm bg-surface-3 border-border" value={selectedFieldData.type}
                                            onChange={(e) => updateField(selectedFieldData.id, { type: e.target.value })}>
                                            {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] uppercase block mb-1" style={{ color: "var(--color-text-muted)" }}>Ancho</label>
                                            <input type="number" className="w-full px-3 py-2 rounded-lg text-sm" value={Math.round(selectedFieldData.width)}
                                                onChange={(e) => updateField(selectedFieldData.id, { width: Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase block mb-1" style={{ color: "var(--color-text-muted)" }}>Alto</label>
                                            <input type="number" className="w-full px-3 py-2 rounded-lg text-sm" value={Math.round(selectedFieldData.height)}
                                                onChange={(e) => updateField(selectedFieldData.id, { height: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                                        <input type="checkbox" checked={selectedFieldData.required}
                                            onChange={(e) => updateField(selectedFieldData.id, { required: e.target.checked })}
                                            className="w-4 h-4 rounded accent-gold" />
                                        <span className="text-xs">Requerido</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setStep(1)}
                                className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                                style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                                Atrás
                            </button>
                            <button disabled={fields.length === 0} onClick={() => setStep(3)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                                Finalizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Save */}
            {step === 3 && (
                <div className="max-w-lg mx-auto">
                    <div className="rounded-2xl p-8 space-y-6" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
                        <div className="text-center">
                            <h2 className="text-3xl font-light mb-2" style={{ fontFamily: "var(--font-cormorant)" }}>Guardar Plantilla</h2>
                            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Asignale un nombre y descripción para identificarla</p>
                        </div>

                        <div className="gold-divider" />

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                                    Nombre de la plantilla
                                </label>
                                <input
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Ej: Contrato de Locación - Residencial"
                                    className="w-full px-4 py-3 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    value={templateDesc}
                                    onChange={(e) => setTemplateDesc(e.target.value)}
                                    rows={3}
                                    placeholder="Detalles adicionales..."
                                    className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <button onClick={() => setStep(2)}
                                className="flex-1 py-3.5 rounded-xl text-sm"
                                style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                                Atrás
                            </button>
                            <button onClick={handleSave} disabled={saving || !templateName.trim()}
                                className="flex-3 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))", color: "#000" }}>
                                {saving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Confirmar y Guardar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
