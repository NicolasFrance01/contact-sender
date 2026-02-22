"use client";

import { Trash2 } from "lucide-react";

interface DeleteTemplateButtonProps {
    templateId: string;
}

export function DeleteTemplateButton({ templateId }: DeleteTemplateButtonProps) {
    async function handleDelete() {
        if (confirm("¿Eliminar esta plantilla? Esta acción no se puede deshacer.")) {
            try {
                const res = await fetch(`/api/templates/${templateId}`, { method: "DELETE" });
                if (res.ok) {
                    window.location.reload();
                } else {
                    alert("Error al eliminar la plantilla");
                }
            } catch (error) {
                console.error("Delete error:", error);
                alert("Error de conexión al eliminar");
            }
        }
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
            style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
