"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { validatePhone } from "./actions";
import { DEBUG_OTP, isDebugPhone, DEBUG_COOKIE_NAME } from "@/lib/constants";
import Cookies from "js-cookie";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Lock, ArrowRight, ArrowLeft } from "lucide-react";

export default function LoginPage() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const validation = await validatePhone(phone);

            if (!validation.valid) {
                setError(validation.error || "מספר הטלפון לא תקין");
                setLoading(false);
                return;
            }

            const formattedPhone = validation.formatted!;

            if (isDebugPhone(formattedPhone)) {
                setStep("otp");
                setPhone(formattedPhone);
                setLoading(false);
                return;
            }

            const { error: supabaseError } = await supabase.auth.signInWithOtp({
                phone: formattedPhone
            });

            if (supabaseError) {
                if (supabaseError.message.includes("Twilio")) {
                    console.error("Supabase/Twilio Error:", supabaseError);
                    setError("שגיאה בשליחת SMS. נא לוודא שהמספר תקין.");
                } else {
                    setError(supabaseError.message);
                }
            } else {
                setStep("otp");
                setPhone(formattedPhone);
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError("אירעה שגיאה בלתי צפויה. נא לנסות שוב.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

        if (isDebugPhone(formattedPhone)) {
            if (otp === DEBUG_OTP) {
                Cookies.set(DEBUG_COOKIE_NAME, formattedPhone, { expires: 7 });
            } else {
                setError("קוד אימות שגוי למספר דיבאג.");
                setLoading(false);
                return;
            }
        } else {
            const { error } = await supabase.auth.verifyOtp({
                phone: formattedPhone,
                token: otp,
                type: "sms",
            });

            if (error) {
                setError("קוד האימות שגוי או פג תוקף.");
                setLoading(false);
                return;
            }
        }

        const res = await fetch("/api/auth/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: formattedPhone }),
        });
        const { isAdmin } = await res.json();

        router.push(isAdmin ? "/admin" : "/book");
        router.refresh();
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <GlassCard className="w-full max-w-sm space-y-6 p-8" gradient>
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-primary-vibrant text-transparent bg-clip-text">
                        Torforyou
                    </h1>
                    <p className="text-muted-foreground">התחברות באמצעות הטלפון</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === "phone" ? (
                        <motion.form
                            key="phone"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleSendOtp}
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground mr-1">מספר טלפון</label>
                                <GlassInput
                                    type="tel"
                                    value={phone}
                                    icon={<Smartphone className="h-4 w-4" />}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                        if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
                                        if (value.length > 7) value = value.slice(0, 7) + '-' + value.slice(7);
                                        setPhone(value);
                                    }}
                                    placeholder="050-123-4567"
                                    className="dir-ltr text-left"
                                    required
                                />
                            </div>
                            <GlassButton
                                type="submit"
                                disabled={loading || !phone}
                                className="w-full h-12 text-lg"
                                isLoading={loading}
                            >
                                שלח קוד אימות
                                <ArrowLeft className="mr-2 h-4 w-4" />
                            </GlassButton>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleVerifyOtp}
                            className="space-y-4"
                        >
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground mr-1">קוד אימות</label>
                                <GlassInput
                                    type="text"
                                    value={otp}
                                    icon={<Lock className="h-4 w-4" />}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="123456"
                                    className="text-center text-2xl tracking-[0.5em] font-mono dir-ltr"
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                            </div>
                            <GlassButton
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full h-12 text-lg"
                                isLoading={loading}
                            >
                                התחבר
                                <ArrowLeft className="mr-2 h-4 w-4" />
                            </GlassButton>
                            <button
                                type="button"
                                onClick={() => setStep("phone")}
                                className="w-full text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
                            >
                                <ArrowRight className="h-3 w-3" />
                                החלף מספר
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-lg"
                    >
                        {error}
                    </motion.div>
                )}
            </GlassCard>
        </main>
    );
}
