import { z } from "zod";
import { createRouter, publicProcedure } from "@/server/trpc";

export const serviceRouter = createRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        return await ctx.prisma.service.findMany({
            orderBy: { title: "asc" },
        });
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

    update: publicProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            durationMin: z.number().min(5).optional(),
            price: z.number().min(0).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            return await ctx.prisma.service.update({
                where: { id },
                data,
            });
        }),

    delete: publicProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.prisma.service.delete({
                where: { id: input.id },
            });
        }),

    seedDefaults: publicProcedure.mutation(async ({ ctx }) => {
        const count = await ctx.prisma.service.count();
        if (count > 0) return { message: "Already seeded" };

        await ctx.prisma.service.createMany({
            data: [
                { title: "תספורת", durationMin: 30, price: 50 },
                { title: "זקן", durationMin: 15, price: 30 },
                { title: "תספורת + זקן", durationMin: 45, price: 70 },
            ]
        });
        return { message: "Seeded services" };
    }),
});
