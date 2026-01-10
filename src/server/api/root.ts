import { createRouter } from "@/server/trpc";
import { appointmentRouter } from "./routers/appointment";
import { serviceRouter } from "./routers/service";

export const appRouter = createRouter({
    appointment: appointmentRouter,
    service: serviceRouter,
});

export type AppRouter = typeof appRouter;
