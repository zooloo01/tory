import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { sendReminder } from "@/lib/sms";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    // Simple secret protection
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get settings for reminder timing
        let settings = await prisma.settings.findUnique({
            where: { id: "default" },
        });
        if (!settings) {
            settings = await prisma.settings.create({
                data: { id: "default" },
            });
        }

        const reminderMinutes = settings.smsReminderMinutes;
        const now = new Date();
        const reminderWindowStart = new Date(now.getTime() + (reminderMinutes - 15) * 60 * 1000);
        const reminderWindowEnd = new Date(now.getTime() + (reminderMinutes + 15) * 60 * 1000);

        // Find appointments in the reminder window that haven't been reminded
        const appointments = await prisma.appointment.findMany({
            where: {
                startUtc: {
                    gte: reminderWindowStart,
                    lte: reminderWindowEnd,
                },
                status: { not: "cancelled" },
                reminderSent: false,
                guestPhone: { not: null },
                isBlocked: false,
            },
            include: { service: true },
        });

        const results = [];

        for (const apt of appointments) {
            if (!apt.service || !apt.guestPhone) continue;

            const sent = await sendReminder(apt.guestPhone, {
                serviceName: apt.service.title,
                date: format(apt.startUtc, "d בMMMM", { locale: he }),
                time: format(apt.startUtc, "HH:mm"),
            });

            if (sent) {
                await prisma.appointment.update({
                    where: { id: apt.id },
                    data: { reminderSent: true },
                });
                results.push({ id: apt.id, phone: apt.guestPhone, status: "sent" });
            } else {
                results.push({ id: apt.id, phone: apt.guestPhone, status: "failed" });
            }
        }

        return NextResponse.json({
            success: true,
            reminderMinutes,
            windowStart: reminderWindowStart.toISOString(),
            windowEnd: reminderWindowEnd.toISOString(),
            processed: results.length,
            results,
        });

    } catch (error) {
        console.error("[CRON] Reminder error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
