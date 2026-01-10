import { z } from "zod";
import { createRouter, publicProcedure } from "@/server/trpc";

export const serviceRouter = createRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        return await ctx.prisma.service.findMany();
    }),

    create: publicProcedure
        .input(z.object({
            title: z.string(),
            durationMin: z.number().min(5),
            price: z.number().min(0),
        }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.service.create({
                data: input,
            });
        }),

    // Seed procedure to quickly set up data
    seedDefaults: publicProcedure.mutation(async ({ ctx }) => {
        const count = await ctx.prisma.service.count();
        if (count > 0) return { message: "Already seeded" };

        await ctx.prisma.service.createMany({
            data: [
                { title: "Haircut", durationMin: 30, price: 25 },
                { title: "Beard Trim", durationMin: 15, price: 15 },
                { title: "Full Service", durationMin: 60, price: 40 },
            ]
        });
        return { message: "Seeded services" };
    }),
});
