"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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

        const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
        const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });

        if (error) {
            setError(error.message);
        } else {
            setStep("otp");
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
        const { error } = await supabase.auth.verifyOtp({
            phone: formattedPhone,
            token: otp,
            type: "sms",
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // Check if admin
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
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-600 text-transparent bg-clip-text">
                        Torforyou
                    </h1>
                    <p className="text-gray-400 mt-2">Sign in with your phone</p>
                </div>

                {step === "phone" ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+972501234567"
                                className="w-full rounded-lg bg-gray-800 border border-gray-700 p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !phone}
                            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? "Sending..." : "Send Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Verification Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="w-full rounded-lg bg-gray-800 border border-gray-700 p-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none text-center text-2xl tracking-widest"
                                maxLength={6}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? "Verifying..." : "Verify"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep("phone")}
                            className="w-full text-gray-400 text-sm hover:text-white"
                        >
                            ← Change phone number
                        </button>
                    </form>
                )}

                {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                )}
            </div>
        </main>
    );
}
