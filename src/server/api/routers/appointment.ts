import { z } from "zod";
import { createRouter, publicProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { sendBookingConfirmation } from "@/lib/sms";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export const appointmentRouter = createRouter({
    // Get customer profile by phone (for name auto-fill)
    getCustomerProfile: publicProcedure
        .input(z.object({ phone: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.user.findUnique({
                where: { phone: input.phone },
                select: { name: true, phone: true },
            });
        }),

    getAvailability: publicProcedure
        .input(z.object({
            serviceId: z.string(),
            date: z.date(),
        }))
        .query(async ({ ctx, input }) => {
            const startOfDay = new Date(input.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startOfDay);
            endOfDay.setHours(23, 59, 59, 999);

            // Get settings
            let settings = await ctx.prisma.settings.findUnique({
                where: { id: "default" },
            });
            if (!settings) {
                settings = await ctx.prisma.settings.create({
                    data: { id: "default" },
                });
            }

            // Check blackout
            const dateStr = format(startOfDay, "yyyy-MM-dd");
            if (settings.blackoutDates.includes(dateStr)) {
                return { slots: [], isBlackout: true, slotCount: 0 };
            }

            const appointments = await ctx.prisma.appointment.findMany({
                where: {
                    startUtc: { gte: startOfDay, lte: endOfDay },
                    status: { not: "cancelled" },
                },
            });

            const service = await ctx.prisma.service.findUnique({ where: { id: input.serviceId } });
            if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });

            const slots: Date[] = [];
            const durationMs = service.durationMin * 60 * 1000;

            const currentTime = new Date(startOfDay);
            currentTime.setHours(settings.workStartHour, 0, 0, 0);

            const endTime = new Date(startOfDay);
            endTime.setHours(settings.workEndHour, 0, 0, 0);

            while (currentTime < endTime) {
                const slotEnd = new Date(currentTime.getTime() + durationMs);

                const isTaken = appointments.some((appt) =>
                    appt.startUtc < slotEnd && appt.endUtc > currentTime
                );

                if (!isTaken && slotEnd <= endTime) {
                    slots.push(new Date(currentTime));
                }

                currentTime.setTime(currentTime.getTime() + durationMs);
            }

            return { slots, isBlackout: false, slotCount: slots.length };
        }),

    book: publicProcedure
        .input(z.object({
            serviceId: z.string(),
            startUtc: z.date(),
            guestName: z.string(),
            guestPhone: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const service = await ctx.prisma.service.findUnique({ where: { id: input.serviceId } });
            if (!service) throw new TRPCError({ code: "NOT_FOUND" });

            const endUtc = new Date(input.startUtc.getTime() + service.durationMin * 60 * 1000);

            const appointment = await ctx.prisma.$transaction(async (tx) => {
                // Check conflict
                const conflict = await tx.appointment.findFirst({
                    where: {
                        status: { not: "cancelled" },
                        OR: [
                            { startUtc: { lt: endUtc, gte: input.startUtc } },
                            { endUtc: { gt: input.startUtc, lte: endUtc } },
                            { startUtc: { lte: input.startUtc }, endUtc: { gte: endUtc } }
                        ]
                    }
                });

                if (conflict) {
                    throw new TRPCError({ code: "CONFLICT", message: "Slot already taken" });
                }

                // Upsert user by phone (link appointments to real users)
                const user = await tx.user.upsert({
                    where: { phone: input.guestPhone },
                    update: { name: input.guestName },
                    create: {
                        phone: input.guestPhone,
                        name: input.guestName,
                        email: `${input.guestPhone.replace(/\D/g, "")}@phone.local`,
                    },
                });

                return await tx.appointment.create({
                    data: {
                        serviceId: input.serviceId,
                        startUtc: input.startUtc,
                        endUtc: endUtc,
                        guestName: input.guestName,
                        guestPhone: input.guestPhone,
                        userId: user.id,
                    },
                    include: { service: true },
                });
            });

            // SMS confirmation
            sendBookingConfirmation(input.guestPhone, {
                serviceName: service.title,
                date: format(input.startUtc, "d בMMMM", { locale: he }),
                time: format(input.startUtc, "HH:mm"),
            }).catch(console.error);

            return appointment;
        }),

    // Block a specific time slot (admin)
    blockSlot: publicProcedure
        .input(z.object({
            startUtc: z.date(),
            durationMin: z.number().default(30),
            reason: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const endUtc = new Date(input.startUtc.getTime() + input.durationMin * 60 * 1000);

            return await ctx.prisma.appointment.create({
                data: {
                    startUtc: input.startUtc,
                    endUtc,
                    isBlocked: true,
                    status: "confirmed",
                    guestName: input.reason || "חסום",
                },
            });
        }),

    // Unblock (delete blocked appointment)
    unblockSlot: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const apt = await ctx.prisma.appointment.findUnique({ where: { id: input.id } });
            if (!apt?.isBlocked) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Not a blocked slot" });
            }
            return await ctx.prisma.appointment.delete({ where: { id: input.id } });
        }),

    cancel: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.appointment.update({
                where: { id: input.id },
                data: { status: "cancelled" },
            });
        }),

    markAttendance: publicProcedure
        .input(z.object({
            id: z.string(),
            status: z.enum(["arrived", "no_show"]),
        }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.appointment.update({
                where: { id: input.id },
                data: { attendanceStatus: input.status },
                include: { service: true },
            });
        }),

    clearAttendance: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.appointment.update({
                where: { id: input.id },
                data: { attendanceStatus: null },
                include: { service: true },
            });
        }),

    list: publicProcedure.query(async ({ ctx }) => {
        return await ctx.prisma.appointment.findMany({
            include: { service: true, user: true },
            orderBy: { startUtc: "asc" },
        });
    }),

    listByPhone: publicProcedure
        .input(z.object({ phone: z.string() }))
        .query(async ({ ctx, input }) => {
            // Get user by phone first
            const user = await ctx.prisma.user.findUnique({
                where: { phone: input.phone },
            });

            // Return appointments linked by userId OR guestPhone (backwards compat)
            return await ctx.prisma.appointment.findMany({
                where: {
                    OR: [
                        { userId: user?.id },
                        { guestPhone: input.phone },
                    ].filter(Boolean),
                },
                include: { service: true },
                orderBy: { startUtc: "desc" },
            });
        }),
});
