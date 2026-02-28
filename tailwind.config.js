/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    DEFAULT: "#2BBFBF",
                    light: "#4DD0D0",
                    dark: "#1F9E9E",
                    muted: "#A0E0E0",
                },
                surface: {
                    DEFAULT: "#FFFFFF",
                    1: "#F9FAFB",
                    2: "#F3F4F6",
                    3: "#E5E7EB",
                    4: "#D1D5DB",
                },
                border: {
                    DEFAULT: "#E5E7EB",
                    light: "#D1D5DB",
                },
            },
            fontFamily: {
                heading: ["var(--font-cormorant)", "serif"],
                body: ["var(--font-inter)", "sans-serif"],
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-in-out",
                "slide-in": "slideIn 0.3s ease-out",
                "slide-up": "slideUp 0.3s ease-out",
                shimmer: "shimmer 2s infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideIn: {
                    "0%": { transform: "translateX(-10px)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
        },
    },
    plugins: [],
};
