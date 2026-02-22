import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, type: string): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);

    const formatted = new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);

    switch (type) {
        case "CURRENCY_ARS":
            return `$ ${formatted}`;
        case "CURRENCY_USD":
            return `U$D ${formatted}`;
        case "CURRENCY_EUR":
            return `€ ${formatted}`;
        default:
            return String(value);
    }
}

export function formatFieldValue(value: string, type: string): string {
    if (!value) return "";
    switch (type) {
        case "CURRENCY_ARS":
        case "CURRENCY_USD":
        case "CURRENCY_EUR":
            return formatCurrency(value, type);
        case "DATE": {
            try {
                const d = new Date(value + "T00:00:00");
                return d.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                });
            } catch {
                return value;
            }
        }
        default:
            return value;
    }
}

export function getFieldTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        TEXT: "Texto",
        NUMBER: "Número",
        CURRENCY_ARS: "Moneda ARS ($)",
        CURRENCY_USD: "Moneda USD (U$D)",
        CURRENCY_EUR: "Moneda EUR (€)",
        DATE: "Fecha",
        CUSTOM: "Personalizado",
    };
    return labels[type] || type;
}

export function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        READER: "Lectura",
        EDITOR: "Editor",
        MANAGER: "Gestor",
        ADMIN: "Administrador",
    };
    return labels[role] || role;
}
