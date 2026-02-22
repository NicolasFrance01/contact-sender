import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    // Create settings singleton
    await prisma.settings.upsert({
        where: { id: "1" },
        update: {},
        create: {
            id: "1",
            companyName: "Mi Escribanía",
        },
    });

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const admin = await prisma.user.upsert({
        where: { email: "admin@escribania.com" },
        update: {},
        create: {
            name: "Administrador",
            email: "admin@escribania.com",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    console.log(`✅ Admin user created: ${admin.email}`);
    console.log("📌 Password: admin123");
    console.log("✅ Settings initialized");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
