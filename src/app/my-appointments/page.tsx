"use client";

import { useAuth } from "@/components/AuthProvider";
import { trpc } from "@/trpc/client";
import { format, isPast } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    const typedAppointments = appointments as Appointment[] | undefined;
    const upcoming = typedAppointments?.filter((a: Appointment) => !isPast(a.startUtc) && a.status !== "cancelled") || [];
    const past = typedAppointments?.filter((a: Appointment) => isPast(a.startUtc) || a.status === "cancelled") || [];

    const statusColors: Record<string, string> = {
        confirmed: "bg-blue-100 text-blue-800",
        cancelled: "bg-red-100 text-red-800",
        completed: "bg-green-100 text-green-800",
    };

    const AppointmentCard = ({ apt }: { apt: Appointment }) => (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-semibold text-gray-900">{apt.service.title}</div>
                    <div className="text-gray-500 text-sm">
                        {format(apt.startUtc, "PPP")} at {format(apt.startUtc, "h:mm a")}
                    </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[apt.status] || "bg-gray-100 text-gray-800"}`}>
                    {apt.status}
                </span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                    <Link
                        href="/book"
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
                    >
                        Book New
                    </Link>
                </div>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming</h2>
                    {isLoading ? (
                        <p className="text-gray-400">Loading...</p>
                    ) : upcoming.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                            <p className="text-gray-400">No upcoming appointments</p>
                            <Link href="/book" className="text-orange-600 text-sm hover:underline mt-2 inline-block">
                                Book your first appointment →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map((apt: Appointment) => (
                                <AppointmentCard key={apt.id} apt={apt} />
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Past</h2>
                    {past.length === 0 ? (
                        <p className="text-gray-400 text-sm">No past appointments</p>
                    ) : (
                        <div className="space-y-3 opacity-75">
                            {past.map((apt: Appointment) => (
                                <AppointmentCard key={apt.id} apt={apt} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
