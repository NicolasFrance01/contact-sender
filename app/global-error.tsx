"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="bg-black text-white">
                <div className="min-h-screen flex items-center justify-center p-6 bg-black">
                    <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-light mb-2 text-white" style={{ fontFamily: "var(--font-cormorant)" }}>Error Crítico</h2>
                        <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                            Se ha producido un error crítico en la aplicación.
                        </p>
                        <button
                            onClick={() => reset()}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all bg-gold text-black w-full"
                            style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))" }}
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
