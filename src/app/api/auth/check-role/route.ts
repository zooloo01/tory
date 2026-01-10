import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const { phone } = await req.json();

    try {
        const admin = await prisma.admin.findUnique({
            where: { phone },
        });
        return NextResponse.json({ isAdmin: !!admin });
    } catch {
        // Table might not exist yet
        return NextResponse.json({ isAdmin: false });
    }
}
