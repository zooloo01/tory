"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { format, isSameDay, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSheet } from "@/components/ui/glass-sheet";
import { GlassInput } from "@/components/ui/glass-input";
import { Phone, Calendar, Clock, Trash2, Check, X, MessageCircle, Settings, Edit2, Ban, AlertTriangle } from "lucide-react";

type TabType = "appointments" | "services" | "settings";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<TabType>("appointments");
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [editingService, setEditingService] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: "", durationMin: 30, price: 0 });
    const utils = trpc.useUtils();

    // Appointments
    const { data: appointments, isLoading: isLoadingAppts } = trpc.appointment.list.useQuery();
    const cancelMutation = trpc.appointment.cancel.useMutation({
        onSuccess: () => {
            utils.appointment.list.invalidate();
            setSelectedAppointment(null);
        },
    });
    const markAttendanceMutation = trpc.appointment.markAttendance.useMutation({
        onSuccess: () => utils.appointment.list.invalidate(),
    });
    const clearAttendanceMutation = trpc.appointment.clearAttendance.useMutation({
        onSuccess: () => utils.appointment.list.invalidate(),
    });
    const blockSlotMutation = trpc.appointment.blockSlot.useMutation({
        onSuccess: () => {
            utils.appointment.list.invalidate();
            setBlockTime("");
        },
    });
    const unblockMutation = trpc.appointment.unblockSlot.useMutation({
        onSuccess: () => {
            utils.appointment.list.invalidate();
            setSelectedAppointment(null);
        },
    });

    // Services
    const { data: services } = trpc.service.getAll.useQuery();
    const createServiceMutation = trpc.service.create.useMutation({
        onSuccess: () => {
            utils.service.getAll.invalidate();
            setNewService({ title: "", durationMin: 30, price: 0 });
        },
    });
    const updateServiceMutation = trpc.service.update.useMutation({
        onSuccess: () => {
            utils.service.getAll.invalidate();
            setEditingService(null);
        },
    });
    const deleteServiceMutation = trpc.service.delete.useMutation({
        onSuccess: () => utils.service.getAll.invalidate(),
    });
    const seedMutation = trpc.service.seedDefaults.useMutation({
        onSuccess: () => utils.service.getAll.invalidate(),
    });

    // Settings
    const { data: settings } = trpc.settings.get.useQuery();
    const updateSettingsMutation = trpc.settings.update.useMutation({
        onSuccess: () => utils.settings.get.invalidate(),
    });
    const addBlackoutMutation = trpc.settings.addBlackoutDate.useMutation({
        onSuccess: () => utils.settings.get.invalidate(),
    });
    const removeBlackoutMutation = trpc.settings.removeBlackoutDate.useMutation({
        onSuccess: () => utils.settings.get.invalidate(),
    });

    const [newService, setNewService] = useState({ title: "", durationMin: 30, price: 0 });
    const [newBlackoutDate, setNewBlackoutDate] = useState("");
    const [blockTime, setBlockTime] = useState("");
    const [blockDuration, setBlockDuration] = useState(30);

    const todayAppts = appointments?.filter(a =>
        isSameDay(new Date(a.startUtc), new Date()) && a.status !== "cancelled"
    );
    const sortedAppointments = appointments?.filter(a => a.status !== "cancelled")
        .sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime());

    const getAttendanceBadge = (status: string | null) => {
        if (status === "arrived") return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">הגיע</span>;
        if (status === "no_show") return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">לא הגיע</span>;
        return null;
    };

    const formatWhatsAppLink = (phone: string) => {
        const clean = phone.replace(/\D/g, "");
        const formattedPhone = clean.startsWith("0") ? `972${clean.slice(1)}` : `972${clean}`;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent("היי! רציתי לעדכן לגבי התור שלך...")}`;
    };

    return (
        <div className="min-h-screen pb-20 md:pb-8">
            {/* Header */}
            <div className="sticky top-0 z-10 glass border-b border-white/10 px-4 py-4 mb-6">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-vibrant mb-3">
                    ניהול תורים
                </h1>
                <div className="flex gap-2 overflow-x-auto">
                    {(["appointments", "services", "settings"] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-surface"
                                }`}
                        >
                            {tab === "appointments" && "תורים"}
                            {tab === "services" && "שירותים"}
                            {tab === "settings" && "הגדרות"}
                        </button>
                    ))}
                </div>
            </div>

            <main className="px-4 max-w-3xl mx-auto space-y-6">
                {/* APPOINTMENTS TAB */}
                {activeTab === "appointments" && (
                    <div className="space-y-4">
                        {/* Today's Quick Stats */}
                        {todayAppts && todayAppts.length > 0 && (
                            <div className="glass p-3 rounded-xl text-center">
                                <span className="text-sm text-muted-foreground">היום: </span>
                                <span className="font-bold text-primary">{todayAppts.length} תורים</span>
                            </div>
                        )}

                        {isLoadingAppts ? (
                            <div className="text-center py-10 text-muted-foreground">טוען תורים...</div>
                        ) : sortedAppointments?.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">אין תורים קרובים</div>
                        ) : (
                            sortedAppointments?.map((apt) => (
                                <GlassCard
                                    key={apt.id}
                                    className={`p-4 cursor-pointer border-l-4 hover:bg-surface/80 transition-colors ${apt.isBlocked ? 'border-l-amber-500 opacity-75' : 'border-l-primary'}`}
                                    onClick={() => setSelectedAppointment(apt)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-lg font-bold flex items-center gap-2">
                                                {format(new Date(apt.startUtc), "HH:mm")}
                                                <span className="text-muted-foreground text-sm font-normal">
                                                    {format(new Date(apt.startUtc), "d MMM", { locale: he })}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium">{apt.isBlocked ? "חסום" : (apt.guestName || "אורח")}</div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            {apt.isBlocked ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">חסום</span>
                                            ) : (
                                                <>
                                                    <div className="text-sm font-bold text-primary">{apt.service?.title || "ללא שירות"}</div>
                                                    {getAttendanceBadge(apt.attendanceStatus)}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick attendance buttons (today only, non-blocked) */}
                                    {!apt.isBlocked && isSameDay(new Date(apt.startUtc), new Date()) && !apt.attendanceStatus && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/10" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => markAttendanceMutation.mutate({ id: apt.id, status: "arrived" })}
                                                className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium flex items-center justify-center gap-1"
                                            >
                                                <Check className="h-4 w-4" /> הגיע
                                            </button>
                                            <button
                                                onClick={() => markAttendanceMutation.mutate({ id: apt.id, status: "no_show" })}
                                                className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium flex items-center justify-center gap-1"
                                            >
                                                <X className="h-4 w-4" /> לא הגיע
                                            </button>
                                        </div>
                                    )}
                                </GlassCard>
                            ))
                        )}
                    </div>
                )}

                {/* SERVICES TAB */}
                {activeTab === "services" && (
                    <div className="space-y-6">
                        <GlassCard className="p-4 space-y-4">
                            <h3 className="font-bold">הוסף שירות חדש</h3>
                            <div className="space-y-3">
                                <GlassInput
                                    placeholder="שם השירות"
                                    value={newService.title}
                                    onChange={e => setNewService({ ...newService, title: e.target.value })}
                                />
                                <div className="flex gap-3">
                                    <GlassInput
                                        type="number"
                                        placeholder="דקות"
                                        value={newService.durationMin}
                                        onChange={e => setNewService({ ...newService, durationMin: parseInt(e.target.value) || 0 })}
                                    />
                                    <GlassInput
                                        type="number"
                                        placeholder="מחיר"
                                        value={newService.price}
                                        onChange={e => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <GlassButton
                                    onClick={() => createServiceMutation.mutate(newService)}
                                    disabled={!newService.title || createServiceMutation.isPending}
                                    className="w-full"
                                >
                                    הוסף שירות
                                </GlassButton>
                            </div>
                        </GlassCard>

                        <div className="grid gap-3">
                            {services?.map((service) => (
                                <div key={service.id} className="glass p-4 rounded-xl">
                                    {editingService === service.id ? (
                                        <div className="space-y-3">
                                            <GlassInput
                                                value={editForm.title}
                                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="שם"
                                            />
                                            <div className="flex gap-2">
                                                <GlassInput
                                                    type="number"
                                                    value={editForm.durationMin}
                                                    onChange={e => setEditForm({ ...editForm, durationMin: parseInt(e.target.value) || 0 })}
                                                    placeholder="דקות"
                                                />
                                                <GlassInput
                                                    type="number"
                                                    value={editForm.price}
                                                    onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                                    placeholder="מחיר"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <GlassButton
                                                    className="flex-1"
                                                    onClick={() => updateServiceMutation.mutate({ id: service.id, ...editForm })}
                                                    disabled={updateServiceMutation.isPending}
                                                >
                                                    שמור
                                                </GlassButton>
                                                <GlassButton
                                                    variant="secondary"
                                                    onClick={() => setEditingService(null)}
                                                >
                                                    ביטול
                                                </GlassButton>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold">{service.title}</div>
                                                <div className="text-xs text-muted-foreground">{service.durationMin} דקות</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-primary">₪{service.price}</span>
                                                <button
                                                    onClick={() => {
                                                        setEditingService(service.id);
                                                        setEditForm({ title: service.title, durationMin: service.durationMin, price: service.price });
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-surface text-muted-foreground"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm("למחוק את השירות?")) {
                                                            deleteServiceMutation.mutate({ id: service.id });
                                                        }
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {(!services || services.length === 0) && (
                            <button
                                onClick={() => seedMutation.mutate()}
                                className="text-xs text-muted-foreground w-full text-center hover:text-primary transition-colors"
                            >
                                אתחול נתוני בדיקה
                            </button>
                        )}
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === "settings" && settings && (
                    <div className="space-y-6">
                        {/* Working Hours */}
                        <GlassCard className="p-4 space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4" /> שעות פעילות
                            </h3>
                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground block mb-1">פתיחה</label>
                                    <select
                                        value={settings.workStartHour}
                                        onChange={(e) => updateSettingsMutation.mutate({ workStartHour: parseInt(e.target.value) })}
                                        className="w-full glass p-3 rounded-xl bg-transparent"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>{i.toString().padStart(2, "0")}:00</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground block mb-1">סגירה</label>
                                    <select
                                        value={settings.workEndHour}
                                        onChange={(e) => updateSettingsMutation.mutate({ workEndHour: parseInt(e.target.value) })}
                                        className="w-full glass p-3 rounded-xl bg-transparent"
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>{i.toString().padStart(2, "0")}:00</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </GlassCard>

                        {/* SMS Reminder */}
                        <GlassCard className="p-4 space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" /> תזכורת SMS
                            </h3>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">שלח תזכורת לפני</label>
                                <select
                                    value={settings.smsReminderMinutes}
                                    onChange={(e) => updateSettingsMutation.mutate({ smsReminderMinutes: parseInt(e.target.value) })}
                                    className="w-full glass p-3 rounded-xl bg-transparent"
                                >
                                    <option value={30}>30 דקות</option>
                                    <option value={60}>שעה</option>
                                    <option value={120}>שעתיים</option>
                                    <option value={180}>3 שעות</option>
                                    <option value={1440}>24 שעות</option>
                                </select>
                            </div>
                        </GlassCard>

                        {/* Blackout Dates */}
                        <GlassCard className="p-4 space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Ban className="h-4 w-4" /> ימי סגירה
                            </h3>

                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={newBlackoutDate}
                                    onChange={(e) => setNewBlackoutDate(e.target.value)}
                                    className="flex-1 glass p-3 rounded-xl bg-transparent"
                                    min={format(new Date(), "yyyy-MM-dd")}
                                />
                                <GlassButton
                                    onClick={() => {
                                        if (newBlackoutDate) {
                                            addBlackoutMutation.mutate({ date: newBlackoutDate });
                                            setNewBlackoutDate("");
                                        }
                                    }}
                                    disabled={!newBlackoutDate || addBlackoutMutation.isPending}
                                >
                                    הוסף
                                </GlassButton>
                            </div>

                            {settings.blackoutDates.length > 0 && (
                                <div className="space-y-2">
                                    {settings.blackoutDates.sort().map((date: string) => (
                                        <div key={date} className="flex justify-between items-center bg-surface/50 p-2 rounded-lg">
                                            <span className="text-sm">{format(new Date(date), "d בMMMM yyyy", { locale: he })}</span>
                                            <button
                                                onClick={() => removeBlackoutMutation.mutate({ date })}
                                                className="p-1 rounded hover:bg-red-500/20 text-red-400"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {settings.blackoutDates.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center">אין ימי סגירה מתוכננים</p>
                            )}
                        </GlassCard>

                        {/* Block Specific Time */}
                        <GlassCard className="p-4 space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Ban className="h-4 w-4" /> חסימת זמנים
                            </h3>
                            <div className="flex gap-2">
                                <GlassInput
                                    type="datetime-local"
                                    value={blockTime}
                                    onChange={(e) => setBlockTime(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <label className="text-sm whitespace-nowrap">משך (דקות):</label>
                                <GlassInput
                                    type="number"
                                    value={blockDuration}
                                    onChange={(e) => setBlockDuration(parseInt(e.target.value))}
                                    className="w-20"
                                />
                                <GlassButton
                                    onClick={() => {
                                        if (blockTime) {
                                            blockSlotMutation.mutate({
                                                startUtc: new Date(blockTime),
                                                durationMin: blockDuration,
                                                reason: "חסימה ידנית"
                                            });
                                        }
                                    }}
                                    disabled={!blockTime || blockSlotMutation.isPending}
                                    className="flex-1"
                                >
                                    חסום זמן זה
                                </GlassButton>
                            </div>
                        </GlassCard>

                        {/* Emergency Actions */}
                        <GlassCard className="p-4 space-y-4 border-red-500/20 bg-red-500/5">
                            <h3 className="font-bold text-red-400 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> אזור סכנה
                            </h3>
                            <GlassButton
                                variant="danger"
                                className="w-full"
                                onClick={() => {
                                    if (confirm("האם אתה בטוח שברצונך לסגור את העסק להיום? כל התורים יבוטלו.")) {
                                        addBlackoutMutation.mutate({ date: format(new Date(), "yyyy-MM-dd") });
                                    }
                                }}
                                disabled={addBlackoutMutation.isPending || settings.blackoutDates.includes(format(new Date(), "yyyy-MM-dd"))}
                            >
                                סגירת חירום להיום
                            </GlassButton>
                        </GlassCard>

                    </div>
                )
                }
            </main >

            {/* Appointment Details Sheet */}
            < GlassSheet
                isOpen={!!selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                title="פרטי תור"
            >
                {selectedAppointment && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface/50 p-3 rounded-xl">
                                <span className="text-xs text-muted-foreground block mb-1">לקוח</span>
                                <div className="font-bold">{selectedAppointment.guestName}</div>
                            </div>
                            <div className="bg-surface/50 p-3 rounded-xl">
                                <span className="text-xs text-muted-foreground block mb-1">שירות</span>
                                <div className="font-bold">{selectedAppointment.service.title}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    {selectedAppointment.service.durationMin} דק׳
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface/50 p-3 rounded-xl flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">זמן</span>
                            <div className="font-bold dir-ltr">
                                {format(new Date(selectedAppointment.startUtc), "HH:mm | d.M.yyyy")}
                            </div>
                        </div>

                        {/* Attendance Status */}
                        {selectedAppointment.attendanceStatus && (
                            <div className="flex items-center justify-between bg-surface/50 p-3 rounded-xl">
                                <span className="text-sm text-muted-foreground">סטטוס</span>
                                <div className="flex items-center gap-2">
                                    {getAttendanceBadge(selectedAppointment.attendanceStatus)}
                                    <button
                                        onClick={() => {
                                            clearAttendanceMutation.mutate({ id: selectedAppointment.id });
                                            setSelectedAppointment({ ...selectedAppointment, attendanceStatus: null });
                                        }}
                                        className="text-xs text-muted-foreground hover:text-primary"
                                    >
                                        איפוס
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href={`tel:${selectedAppointment.guestPhone}`}
                                className="glass p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-surface/80 transition-colors"
                            >
                                <Phone className="h-6 w-6 text-primary" />
                                <span className="text-sm font-medium">התקשר</span>
                            </a>
                            <a
                                href={formatWhatsAppLink(selectedAppointment.guestPhone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-surface/80 transition-colors"
                            >
                                <MessageCircle className="h-6 w-6 text-green-400" />
                                <span className="text-sm font-medium">WhatsApp</span>
                            </a>
                        </div>

                        {/* Mark Attendance (if not marked) */}
                        {!selectedAppointment.attendanceStatus && (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        markAttendanceMutation.mutate({ id: selectedAppointment.id, status: "arrived" });
                                        setSelectedAppointment({ ...selectedAppointment, attendanceStatus: "arrived" });
                                    }}
                                    className="py-3 rounded-xl bg-green-500/20 text-green-400 font-medium flex items-center justify-center gap-2"
                                >
                                    <Check className="h-5 w-5" /> הגיע
                                </button>
                                <button
                                    onClick={() => {
                                        markAttendanceMutation.mutate({ id: selectedAppointment.id, status: "no_show" });
                                        setSelectedAppointment({ ...selectedAppointment, attendanceStatus: "no_show" });
                                    }}
                                    className="py-3 rounded-xl bg-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2"
                                >
                                    <X className="h-5 w-5" /> לא הגיע
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <GlassButton
                                variant="danger"
                                className="flex-1"
                                onClick={() => cancelMutation.mutate({ id: selectedAppointment.id })}
                                isLoading={cancelMutation.isPending}
                            >
                                <Trash2 className="h-4 w-4 ml-2" />
                                ביטול תור
                            </GlassButton>
                            <GlassButton
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setSelectedAppointment(null)}
                            >
                                סגור
                            </GlassButton>
                        </div>
                    </div>
                )}
            </GlassSheet >
        </div >
    );
}
