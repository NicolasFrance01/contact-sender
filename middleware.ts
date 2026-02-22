import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login"];

export default auth((req) => {
    const isAuthenticated = !!req.auth;
    const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

    if (!isAuthenticated && !isPublicRoute) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isAuthenticated && isPublicRoute) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
