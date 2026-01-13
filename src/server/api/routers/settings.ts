import { z } from "zod";
import { createRouter, publicProcedure } from "@/server/trpc";

export const settingsRouter = createRouter({
    get: publicProcedure.query(async ({ ctx }) => {
        // Upsert default settings if not exist
        let settings = await ctx.prisma.settings.findUnique({
            where: { id: "default" },
        });

        if (!settings) {
            settings = await ctx.prisma.settings.create({
                data: { id: "default" },
            });
        }

        return settings;
    }),

    update: publicProcedure
        .input(z.object({
            workStartHour: z.number().min(0).max(23).optional(),
            workEndHour: z.number().min(0).max(23).optional(),
            blackoutDates: z.array(z.string()).optional(),
            smsReminderMinutes: z.number().min(15).max(1440).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.settings.upsert({
                where: { id: "default" },
                create: {
                    id: "default",
                    ...input,
                },
                update: input,
            });
        }),

    addBlackoutDate: publicProcedure
        .input(z.object({ date: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const settings = await ctx.prisma.settings.findUnique({
                where: { id: "default" },
            });

            const currentDates = settings?.blackoutDates ?? [];
            if (currentDates.includes(input.date)) {
                return settings;
            }

            return await ctx.prisma.settings.upsert({
                where: { id: "default" },
                create: {
                    id: "default",
                    blackoutDates: [input.date],
                },
                update: {
                    blackoutDates: [...currentDates, input.date],
                },
            });
        }),

    removeBlackoutDate: publicProcedure
        .input(z.object({ date: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const settings = await ctx.prisma.settings.findUnique({
                where: { id: "default" },
            });

            const currentDates = settings?.blackoutDates ?? [];

            return await ctx.prisma.settings.update({
                where: { id: "default" },
                data: {
                    blackoutDates: currentDates.filter(d => d !== input.date),
                },
            });
        }),
});
