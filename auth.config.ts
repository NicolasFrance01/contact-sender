import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isPublicRoute = nextUrl.pathname.startsWith("/login");

            if (!isLoggedIn && !isPublicRoute) {
                return false; // Redirect to login
            }
            if (isLoggedIn && isPublicRoute) {
                return Response.redirect(new URL("/", nextUrl));
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role: string }).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    providers: [], // Add empty providers array to satisfy type
} satisfies NextAuthConfig;
