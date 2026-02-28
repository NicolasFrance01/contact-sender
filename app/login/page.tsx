"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Force light mode on login page
        document.documentElement.classList.remove("dark");
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });
            if (result?.error) {
                setError("Credenciales incorrectas. Verificá tu email y contraseña.");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch {
            setError("Error al iniciar sesión. Intentá nuevamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-5"
                    style={{ background: "radial-gradient(circle, var(--color-gold), transparent)" }} />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-5"
                    style={{ background: "radial-gradient(circle, var(--color-gold), transparent)" }} />
                {/* Fine grid lines */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: "linear-gradient(var(--color-gold) 1px, transparent 1px), linear-gradient(90deg, var(--color-gold) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
            </div>

            <div className="relative w-full max-w-md px-6">
                {/* Logo area */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center justify-center mb-5 w-full mx-auto" style={{ maxWidth: '280px' }}>
                        <img
                            src="/logo1.png"
                            alt="Logo"
                            className="w-full h-auto object-contain drop-shadow-md"
                            style={{ maxHeight: '120px', filter: 'drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.8))' }}
                        />
                    </div>
                    <div className="gold-divider mt-4" />
                </div>

                {/* Login card */}
                <div className="rounded-2xl p-8 animate-slide-up"
                    style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
                    <h2 className="text-xl font-medium mb-1" style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem" }}>
                        Bienvenido
                    </h2>
                    <p className="text-sm mb-7" style={{ color: "var(--color-text-muted)" }}>
                        Ingresá tus credenciales para continuar
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@empresa.com"
                                required
                                className="w-full px-4 py-3 rounded-xl text-sm"
                                style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)" }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 rounded-xl text-sm"
                                style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)" }}
                            />
                        </div>

                        {error && (
                            <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)", color: "var(--color-error)" }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                                background: "linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))",
                                color: "#000",
                                boxShadow: loading ? "none" : "0 4px 20px rgba(198,167,94,0.3)",
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Iniciando sesión...
                                </span>
                            ) : "Iniciar Sesión"}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs mt-8" style={{ color: "var(--color-text-dim)" }}>
                    © 2026 Yubiescalona | Impacto | Conexion | Seguros <br /> Sistema profesional de gestión
                </p>
            </div>
        </div>
    );
}
