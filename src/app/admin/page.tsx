"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { format } from "date-fns";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<"appointments" | "services">("appointments");
    const utils = trpc.useUtils();

    // Appointments Data
    const { data: appointments, isLoading: isLoadingAppts } = trpc.appointment.list.useQuery();
    const cancelMutation = trpc.appointment.cancel.useMutation({
        onSuccess: () => utils.appointment.list.invalidate(),
    });

    // Services Data
    const { data: services } = trpc.service.getAll.useQuery();
    const createServiceMutation = trpc.service.create.useMutation({
        onSuccess: () => {
            utils.service.getAll.invalidate();
            setNewService({ title: "", durationMin: 30, price: 0 });
        },
    });
    const seedMutation = trpc.service.seedDefaults.useMutation({
        onSuccess: () => utils.service.getAll.invalidate(),
    });

    const [newService, setNewService] = useState({ title: "", durationMin: 30, price: 0 });

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
                <h1 className="text-2xl font-bold mb-10 text-orange-500">BarberAdmin</h1>
                <nav className="space-y-2">
                    <button
                        onClick={() => setActiveTab("appointments")}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === "appointments" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Appointments
                    </button>
                    <button
                        onClick={() => setActiveTab("services")}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === "services" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Services
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {/* Mobile Header */}
                <div className="md:hidden pb-6 mb-6 border-b">
                    <div className="flex gap-4">
                        <button onClick={() => setActiveTab("appointments")} className={`${activeTab === "appointments" ? "font-bold" : ""}`}>Appointments</button>
                        <button onClick={() => setActiveTab("services")} className={`${activeTab === "services" ? "font-bold" : ""}`}>Services</button>
                    </div>
                </div>

                {activeTab === "appointments" && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">Appointments</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Service</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoadingAppts ? (
                                        <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                                    ) : appointments?.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">No appointments found.</td></tr>
                                    ) : appointments?.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{format(apt.startUtc, "MMM d")}</div>
                                                <div className="text-sm text-gray-500">{format(apt.startUtc, "h:mm aa")}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{apt.guestName || "Unknown"}</div>
                                                <div className="text-sm text-gray-500">{apt.guestPhone}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {apt.service.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {apt.status !== "cancelled" && (
                                                    <button
                                                        onClick={() => cancelMutation.mutate({ id: apt.id })}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "services" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-gray-900">Services</h2>
                            <button
                                onClick={() => seedMutation.mutate()}
                                className="text-sm text-gray-500 hover:text-orange-600 underline"
                            >
                                Seed Defaults
                            </button>
                        </div>

                        {/* Create Service */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold mb-4">Add New Service</h3>
                            <div className="flex gap-4 items-end flex-wrap">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm text-gray-500 mb-1">Title</label>
                                    <input
                                        className="w-full border p-2 rounded-md"
                                        value={newService.title}
                                        onChange={e => setNewService({ ...newService, title: e.target.value })}
                                        placeholder="e.g. Haircut"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-sm text-gray-500 mb-1">Duration (m)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded-md"
                                        value={newService.durationMin}
                                        onChange={e => setNewService({ ...newService, durationMin: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-sm text-gray-500 mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded-md"
                                        value={newService.price}
                                        onChange={e => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <button
                                    onClick={() => createServiceMutation.mutate(newService)}
                                    disabled={!newService.title}
                                    className="bg-gray-900 text-white px-6 py-2.5 rounded-md hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {services?.map((service) => (
                                <div key={service.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-lg text-gray-900">{service.title}</div>
                                        <div className="text-gray-500">{service.durationMin} mins</div>
                                    </div>
                                    <div className="text-xl font-bold text-orange-600">${service.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
