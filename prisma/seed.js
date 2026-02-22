const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

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

    console.log(`\n✅ Admin user created: ${admin.email}`);
    console.log(`📌 Password: admin123`);
    console.log("✅ Settings initialized\n");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
