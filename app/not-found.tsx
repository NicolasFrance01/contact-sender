import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-black">
            <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                    <FileQuestion className="w-8 h-8 text-gold" />
                </div>
                <h2 className="text-2xl font-light mb-2 text-white" style={{ fontFamily: "var(--font-cormorant)" }}>Página no encontrada</h2>
                <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                    La página que buscas no existe o ha sido movida.
                </p>
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all bg-gold text-black"
                    style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))" }}
                >
                    <Home className="w-4 h-4" />
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}
