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
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                var theme = localStorage.getItem('theme');
                                if (theme === 'dark') {
                                    document.documentElement.classList.add('dark');
                                } else if (theme === 'light') {
                                    document.documentElement.classList.remove('dark');
                                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                                    document.documentElement.classList.add('dark');
                                }
                            } catch (_) {}
                        `,
                    }}
                />
            </head>
            <body className="antialiased">{children}</body>
        </html>
    );
}
