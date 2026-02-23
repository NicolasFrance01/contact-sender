const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSmtpErrors() {
    try {
        const lastSends = await prisma.contractSend.findMany({
            where: { status: "ERROR" },
            orderBy: { sentAt: "desc" },
            take: 5
        });

        console.log("--- Last 5 Failed Sends ---");
        console.log(JSON.stringify(lastSends, null, 2));

        const settings = await prisma.settings.findFirst();
        console.log("\n--- Current SMTP Settings ---");
        console.log({
            host: settings?.smtpHost,
            port: settings?.smtpPort,
            user: settings?.smtpUser,
            from: settings?.smtpFrom,
            passLength: settings?.smtpPass?.length
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSmtpErrors();
