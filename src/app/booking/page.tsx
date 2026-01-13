"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { format, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { useAuth } from "@/components/AuthProvider";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Clock, Check, Lock, ChevronLeft, AlertTriangle } from "lucide-react";

export default function BookingPage() {
    const { user } = useAuth();
    const [step, setStep] = useState<"service" | "slot" | "confirm" | "success">("service");
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [guestDetails, setGuestDetails] = useState({ name: "", phone: "" });

    // Fetch customer profile for auto-fill
    const { data: profile } = trpc.appointment.getCustomerProfile.useQuery(
        { phone: user?.phone || "" },
        { enabled: !!user?.phone }
    );

    // Auto-fill from user profile
    useEffect(() => {
        if (user?.phone) {
            setGuestDetails((prev) => ({
                name: profile?.name || prev.name,
                phone: user.phone || prev.phone,
            }));
        }
    }, [user, profile]);

    const { data: services, isLoading: isLoadingServices } = trpc.service.getAll.useQuery();
    const { data: availability, isLoading: isLoadingSlots } = trpc.appointment.getAvailability.useQuery(
        { serviceId: selectedServiceId!, date: selectedDate },
        { enabled: !!selectedServiceId && step === "slot" }
    );
    const slots = availability?.slots;
    const isBlackout = availability?.isBlackout;
    const slotCount = availability?.slotCount ?? 0;

    const bookMutation = trpc.appointment.book.useMutation({
        onSuccess: () => setStep("success"),
    });

    const handleServiceSelect = (id: string) => {
        setSelectedServiceId(id);
        setStep("slot");
    };

    const handleSlotSelect = (date: Date) => {
        setSelectedSlot(date);
        setStep("confirm");
    };

    const handleBooking = () => {
        if (!selectedServiceId || !selectedSlot) return;
        bookMutation.mutate({
            serviceId: selectedServiceId,
            startUtc: selectedSlot,
            guestName: guestDetails.name,
            guestPhone: guestDetails.phone,
        });
    };

    const selectedService = services?.find(s => s.id === selectedServiceId);

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
    };

    if (step === "success") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <GlassCard className="max-w-md w-full flex flex-col items-center gap-6" gradient>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 border border-green-500/30"
                    >
                        <Check className="h-12 w-12" />
                    </motion.div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700">הוזמן בהצלחה!</h2>
                        <p className="text-muted-foreground text-lg">
                            נתראה ב-{selectedSlot && format(selectedSlot, "EEEE, d MMMM, HH:mm", { locale: he })}
                        </p>
                    </div>
                    <GlassButton className="w-full mt-4" variant="primary" onClick={() => window.location.href = "/"}>
                        חזרה לדף הבית
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-lg space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between px-2">
                    {step !== "service" ? (
                        <button onClick={() => setStep(step === "confirm" ? "slot" : "service")} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    ) : <div className="w-10" />}

                    <h1 className="text-xl font-bold">קביעת תור</h1>
                    <div className="text-sm font-medium text-muted-foreground w-10 text-left">
                        {step === "service" ? "1" : step === "slot" ? "2" : "3"}/3
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === "service" && (
                        <motion.div
                            key="service"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-4"
                        >
                            <h2 className="text-2xl font-bold px-2">בחר שירות</h2>
                            <div className="grid gap-3">
                                {isLoadingServices ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-surface/30 animate-pulse" />)
                                ) : services?.map((service) => (
                                    <GlassButton
                                        key={service.id}
                                        onClick={() => handleServiceSelect(service.id)}
                                        variant="secondary"
                                        className="h-auto p-4 flex justify-between items-center text-right group hover:border-primary/50 transition-all"
                                    >
                                        <div className="space-y-1">
                                            <div className="font-bold text-lg">{service.title}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {service.durationMin} דקות
                                            </div>
                                        </div>
                                        <div className="text-xl font-bold text-primary mr-4">
                                            ₪{service.price}
                                        </div>
                                    </GlassButton>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === "slot" && (
                        <motion.div
                            key="slot"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-bold px-2">בחר מועד</h2>

                            {/* Date Scroller */}
                            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                                    const date = addDays(new Date(), offset);
                                    const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

                                    return (
                                        <button
                                            key={offset}
                                            onClick={() => setSelectedDate(date)}
                                            className={`snap-start flex-shrink-0 w-[72px] h-[90px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                                                : "bg-surface/50 text-muted-foreground border-white/20 hover:bg-surface"
                                                }`}
                                        >
                                            <div className="text-xs font-medium uppercase">{format(date, "EEE", { locale: he })}</div>
                                            <div className="text-2xl font-bold">{format(date, "d")}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Slot count hint */}
                            {!isLoadingSlots && slotCount > 0 && slotCount <= 3 && (
                                <div className="flex items-center justify-center gap-2 text-amber-500 text-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>נשארו {slotCount} תורים בלבד</span>
                                </div>
                            )}

                            {/* Slots Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {isLoadingSlots ? (
                                    <div className="col-span-full py-12 text-center text-muted-foreground">טוען זמינות...</div>
                                ) : slots?.map((slot, i) => (
                                    <GlassButton
                                        key={i}
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleSlotSelect(slot)}
                                        className="h-12 text-base font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                    >
                                        {format(slot, "HH:mm")}
                                    </GlassButton>
                                ))}
                                {slots?.length === 0 && !isLoadingSlots && (
                                    <div className="col-span-full py-12 flex flex-col items-center text-muted-foreground gap-2">
                                        <Lock className="h-8 w-8 opacity-50" />
                                        <p>{isBlackout ? "יום סגור - לא ניתן לקבוע תור" : "אין תורים פנויים בתאריך זה"}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {step === "confirm" && (
                        <motion.div
                            key="confirm"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-bold px-2">אישור הפרטים</h2>

                            <GlassCard className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/10">
                                    <span className="text-muted-foreground">שירות</span>
                                    <span className="font-bold">{selectedService?.title}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/10">
                                    <span className="text-muted-foreground">תאריך ושעה</span>
                                    <span className="font-bold dir-ltr">
                                        {selectedSlot && format(selectedSlot, "HH:mm | d.M")}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">מחיר</span>
                                    <span className="font-bold text-primary">₪{selectedService?.price}</span>
                                </div>
                            </GlassCard>

                            <div className="space-y-4">
                                <GlassInput
                                    placeholder="שם מלא"
                                    value={guestDetails.name}
                                    onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                                />
                                <GlassInput
                                    placeholder="מספר טלפון"
                                    type="tel"
                                    value={guestDetails.phone}
                                    onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                                />
                            </div>

                            <GlassButton
                                onClick={handleBooking}
                                disabled={bookMutation.isPending || !guestDetails.name || !guestDetails.phone}
                                className="w-full mt-8"
                                size="lg"
                                isLoading={bookMutation.isPending}
                            >
                                אשר הזמנה
                            </GlassButton>

                            {bookMutation.error && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-center text-sm bg-red-500/10 p-2 rounded-lg"
                                >
                                    {bookMutation.error.message}
                                </motion.p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
