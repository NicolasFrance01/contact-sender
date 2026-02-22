import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Contract Sender | Gestión Inteligente de Contratos",
    description: "Plataforma profesional para gestión, completado y envío de contratos PDF.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="antialiased">{children}</body>
        </html>
    );
}
