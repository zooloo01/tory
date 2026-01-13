import { createRouter } from "@/server/trpc";
import { appointmentRouter } from "./routers/appointment";
import { serviceRouter } from "./routers/service";
import { settingsRouter } from "./routers/settings";

export const appRouter = createRouter({
    appointment: appointmentRouter,
    service: serviceRouter,
    settings: settingsRouter,
});

export type AppRouter = typeof appRouter;

