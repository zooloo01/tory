const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEBUG_PHONES = {
    ADMIN: ["+972544448102"],
    CUSTOMERS: ["+972507570657", "+972533880088"],
};

async function main() {
    console.log("Seeding debug users...");

    // Seed Admin
    for (const phone of DEBUG_PHONES.ADMIN) {
        await prisma.admin.upsert({
            where: { phone },
            update: {},
            create: { phone },
        });

        await prisma.user.upsert({
            where: { email: `admin_${phone}@debug.com` },
            update: { phone, role: "admin" },
            create: {
                phone,
                email: `admin_${phone}@debug.com`,
                name: "מנהל דיבאג",
                role: "admin"
            }
        });
        console.log(`Admin ${phone} seeded.`);
    }

    // Seed Customers
    for (const phone of DEBUG_PHONES.CUSTOMERS) {
        await prisma.user.upsert({
            where: { email: `customer_${phone}@debug.com` },
            update: { phone, role: "customer" },
            create: {
                phone,
                email: `customer_${phone}@debug.com`,
                name: "לקוח דיבאג",
                role: "customer"
            }
        });
        console.log(`Customer ${phone} seeded.`);
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
