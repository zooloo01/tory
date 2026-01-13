"use client";

import { useAuth } from "@/components/AuthProvider";
import { trpc } from "@/trpc/client";
import { format, isPast } from "date-fns";
import { he } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { ArrowRight, Calendar, Clock, Lock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Appointment = {
    id: string;
    startUtc: Date;
    endUtc: Date;
    status: string;
    service: { title: string };
};

export default function MyAppointmentsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const phone = user?.phone;
    const { data: appointments, isLoading } = trpc.appointment.listByPhone.useQuery(
        { phone: phone || "" },
        { enabled: !!phone }
    );

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-muted-foreground animate-pulse">טוען נתונים...</div>
            </div>
        );
    }

    const typedAppointments = appointments as Appointment[] | undefined;
    const upcoming = typedAppointments?.filter((a: Appointment) => !isPast(a.startUtc) && a.status !== "cancelled") || [];
    const past = typedAppointments?.filter((a: Appointment) => isPast(a.startUtc) || a.status === "cancelled") || [];

    return (
        <div className="min-h-screen p-4 pb-20">
            <header className="flex justify-between items-center mb-8 pt-4">
                <Link href="/" className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
                    <ArrowRight className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-vibrant">
                    התורים שלי
                </h1>
                <div className="w-10"></div>
            </header>

            <AnimatePresence mode="popLayout">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 mb-8"
                >
                    <div className="flex justify-between items-end px-2">
                        <h2 className="text-lg font-bold">תורים עתידיים</h2>
                        <GlassButton size="sm" variant="ghost" onClick={() => router.push("/book")} className="text-primary hover:bg-primary/10">
                            + תור חדש
                        </GlassButton>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">טוען...</div>
                    ) : upcoming.length === 0 ? (
                        <GlassCard className="py-12 flex flex-col items-center text-center gap-4 border-dashed border-2 border-white/20 shadow-none bg-surface/30">
                            <Calendar className="h-10 w-10 text-muted-foreground/50" />
                            <p className="text-muted-foreground">אין לך תורים עתידיים</p>
                            <GlassButton onClick={() => router.push("/book")} variant="primary">
                                קבע תור עכשיו
                                <ArrowLeft className="mr-2 h-4 w-4" />
                            </GlassButton>
                        </GlassCard>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map((apt: Appointment) => (
                                <GlassCard key={apt.id} className="p-4 border-l-4 border-l-primary flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-lg">{apt.service.title}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {format(apt.startUtc, "d MMMM", { locale: he })}
                                            <span className="mx-1">•</span>
                                            <Clock className="h-3.5 w-3.5" />
                                            {format(apt.startUtc, "HH:mm")}
                                        </div>
                                    </div>
                                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                                        מאושר
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </motion.section>

                {past.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h2 className="text-lg font-bold px-2 text-muted-foreground">היסטוריה</h2>
                        <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                            {past.map((apt: Appointment) => (
                                <div key={apt.id} className="glass p-4 rounded-xl flex justify-between items-center bg-surface/30 grayscale hover:grayscale-0 transition-all">
                                    <div>
                                        <div className="font-semibold text-muted-foreground">{apt.service.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(apt.startUtc, "d.M.yyyy", { locale: he })} | {format(apt.startUtc, "HH:mm")}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${apt.status === 'cancelled' ? 'border-red-200 text-red-500 bg-red-50' :
                                            'border-gray-200 text-gray-500 bg-gray-50'
                                        }`}>
                                        {apt.status === 'cancelled' ? 'בוטל' : 'הושלם'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
}
