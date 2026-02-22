"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black">
            <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-light mb-2 text-white" style={{ fontFamily: "var(--font-cormorant)" }}>Algo salió mal</h2>
                <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                    Se produjo un error inesperado. Por favor, intenta recargar la página.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all bg-gold text-black"
                        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))" }}
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Reintentar
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
                        style={{ background: "var(--color-surface-4)", color: "var(--color-text-muted)" }}
                    >
                        <Home className="w-4 h-4" />
                        Ir al inicio
                    </Link>
                </div>
                {error.digest && (
                    <div className="mt-8 pt-6 border-t border-border">
                        <p className="text-[10px] uppercase tracking-widest opacity-30">ID de error: {error.digest}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
