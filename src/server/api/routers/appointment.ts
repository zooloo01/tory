import { z } from "zod";
import { createRouter, publicProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const appointmentRouter = createRouter({
    getAvailability: publicProcedure
        .input(z.object({
            serviceId: z.string(),
            date: z.date(), // Client sends start of day or specific date
        }))
        .query(async ({ ctx, input }) => {
            // Very simple availability: fetch all appointments for the day and return open slots
            // 10x shortcut: assume 9-5, 1 hour slots for now (dynamic later)

            const startOfDay = new Date(input.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startOfDay);
            endOfDay.setHours(23, 59, 59, 999);

            const appointments = await ctx.prisma.appointment.findMany({
                where: {
                    startUtc: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                    status: {
                        not: "cancelled",
                    },
                },
            });

            // Generate slots (hardcoded 9:00 to 17:00 for MVP)
            const slots = [];
            const service = await ctx.prisma.service.findUnique({ where: { id: input.serviceId } });
            if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });

            const durationMs = service.durationMin * 60 * 1000;
            let currentTime = new Date(startOfDay);
            currentTime.setHours(9, 0, 0, 0); // Start at 9 AM

            const endTime = new Date(startOfDay);
            endTime.setHours(17, 0, 0, 0); // End at 5 PM

            while (currentTime < endTime) {
                const slotEnd = new Date(currentTime.getTime() + durationMs);

                // Check overlap
                const isTaken = appointments.some((appt: { startUtc: Date; endUtc: Date }) => {
                    return (
                        (appt.startUtc < slotEnd && appt.endUtc > currentTime)
                    );
                });

                if (!isTaken) {
                    slots.push(new Date(currentTime));
                }

                currentTime = new Date(currentTime.getTime() + durationMs); // Simple logic: jump by duration
            }

            return slots;
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

            // Check double booking (race condition possible without raw SQL locking or serializable isolation, but unique constraints on a Slot table is better. For MVP, we use Prisma transaction + check)
            // Actually Prisma interactive transactions are good here.

            return await ctx.prisma.$transaction(async (tx) => {
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

                return await tx.appointment.create({
                    data: {
                        serviceId: input.serviceId,
                        startUtc: input.startUtc,
                        endUtc: endUtc,
                        guestName: input.guestName,
                        guestPhone: input.guestPhone,
                    },
                });
            });
        }),

    cancel: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.appointment.update({
                where: { id: input.id },
                data: { status: "cancelled" },
            });
        }),

    list: publicProcedure.query(async ({ ctx }) => {
        return await ctx.prisma.appointment.findMany({
            include: { service: true },
            orderBy: { startUtc: "asc" },
        });
    }),

    listByPhone: publicProcedure
        .input(z.object({ phone: z.string() }))
        .query(async ({ ctx, input }) => {
            return await ctx.prisma.appointment.findMany({
                where: { guestPhone: input.phone },
                include: { service: true },
                orderBy: { startUtc: "desc" },
            });
        }),
});
