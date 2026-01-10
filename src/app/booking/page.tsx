"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { format, addDays } from "date-fns";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function BookingPage() {
    const { user } = useAuth();
    const [step, setStep] = useState<"service" | "slot" | "confirm" | "success">("service");
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [guestDetails, setGuestDetails] = useState({ name: "", phone: "" });

    useEffect(() => {
        if (user?.phone) {
            setGuestDetails((prev) => ({ ...prev, phone: user.phone || "" }));
        }
    }, [user]);

    const { data: services } = trpc.service.getAll.useQuery();
    const { data: slots, isLoading: isLoadingSlots } = trpc.appointment.getAvailability.useQuery(
        { serviceId: selectedServiceId!, date: selectedDate },
        { enabled: !!selectedServiceId && step === "slot" }
    );

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

    if (step === "success") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg text-center space-y-4">
                    <div className="text-4xl">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
                    <p className="text-gray-600">See you on {selectedSlot && format(selectedSlot, "PPpp")}.</p>
                    <Link href="/" className="inline-block mt-4 text-orange-600 hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="mx-auto max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-[500px]">
                {/* Header */}
                <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
                    <h1 className="text-xl font-bold">Book Appointment</h1>
                    <div className="text-sm text-gray-400">Step {step === "service" ? 1 : step === "slot" ? 2 : 3}/3</div>
                </div>

                <div className="p-6">
                    {/* Step 1: Services */}
                    {step === "service" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select a Service</h2>
                            <div className="grid gap-4">
                                {services?.map((service: { id: string; title: string; durationMin: number; price: number }) => (
                                    <button
                                        key={service.id}
                                        onClick={() => handleServiceSelect(service.id)}
                                        className="flex w-full items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-900 group-hover:text-orange-700">{service.title}</div>
                                            <div className="text-sm text-gray-500">{service.durationMin} mins</div>
                                        </div>
                                        <div className="font-bold text-gray-900">${service.price}</div>
                                    </button>
                                ))}
                                {services?.length === 0 && <p className="text-gray-500">No services available.</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Date & Time */}
                    {step === "slot" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button onClick={() => setStep("service")} className="text-sm text-gray-500 hover:text-gray-900">← Back</button>

                            <h2 className="text-2xl font-semibold text-gray-800">Pick a Time</h2>

                            {/* Date Picker (Simple Row) */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[0, 1, 2, 3, 4, 10].map((offset) => {
                                    const date = addDays(new Date(), offset);
                                    const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

                                    return (
                                        <button
                                            key={offset}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex-shrink-0 px-4 py-3 rounded-lg border text-center min-w-[80px] transition-colors ${isSelected
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "border-gray-200 text-gray-600 hover:border-gray-400"
                                                }`}
                                        >
                                            <div className="text-xs font-medium uppercase">{format(date, "EEE")}</div>
                                            <div className="text-xl font-bold">{format(date, "d")}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Slots Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6">
                                {isLoadingSlots ? (
                                    <p className="col-span-full text-center text-gray-400 py-8">Loading availability...</p>
                                ) : slots?.map((slot, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSlotSelect(slot)}
                                        className="py-2 px-3 rounded-md border border-gray-200 text-gray-700 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors text-sm font-medium"
                                    >
                                        {format(slot, "h:mm aa")}
                                    </button>
                                ))}
                                {slots?.length === 0 && !isLoadingSlots && (
                                    <p className="col-span-full text-center text-gray-500 py-4">No slots available for this date.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === "confirm" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button onClick={() => setStep("slot")} className="text-sm text-gray-500 hover:text-gray-900">← Back</button>

                            <h2 className="text-2xl font-semibold text-gray-800">Your Details</h2>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">Service</span>
                                    <span className="font-medium">{services?.find((s: { id: string; title: string }) => s.id === selectedServiceId)?.title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Time</span>
                                    <span className="font-medium text-orange-600">
                                        {selectedSlot && format(selectedSlot, "PPpp")}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        value={guestDetails.name}
                                        onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        value={guestDetails.phone}
                                        onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                                        placeholder="050-123-4567"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleBooking}
                                disabled={bookMutation.isPending || !guestDetails.name || !guestDetails.phone}
                                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6 shadow-lg shadow-orange-200"
                            >
                                {bookMutation.isPending ? "Confirming..." : "Confirm Booking"}
                            </button>

                            {bookMutation.error && (
                                <p className="text-red-500 text-center text-sm">{bookMutation.error.message}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
