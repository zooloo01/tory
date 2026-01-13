"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Scissors, Calendar, User, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-primary/20 blur-[100px] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-pink-500/20 blur-[100px] -z-10" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-8"
      >
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="inline-block p-4 rounded-full bg-surface/50 border border-white/20 glass mb-4">
            <Scissors className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary-vibrant text-transparent bg-clip-text">
            Torforyou
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            תספורת מקצועית, קביעת תור בקליק.
            <br />
            הלוק הבא שלך מתחיל כאן.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 w-full">
          {!loading && (
            user ? (
              <>
                <GlassButton variant="primary" size="lg" className="w-full h-14 text-lg" onClick={() => router.push("/book")}>
                  קבע תור חדש
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </GlassButton>

                <GlassButton variant="secondary" size="lg" className="w-full h-14 text-lg" onClick={() => router.push("/my-appointments")}>
                  <User className="ml-2 h-5 w-5" />
                  התורים שלי
                </GlassButton>

                <button
                  onClick={signOut}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
                >
                  התנתק
                </button>
              </>
            ) : (
              <GlassButton variant="primary" size="lg" className="w-full h-14 text-lg" onClick={() => router.push("/login")}>
                התחבר לקביעת תור
                <ArrowLeft className="mr-2 h-5 w-5" />
              </GlassButton>
            )
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="pt-8">
          <Link
            href="/admin"
            className="text-muted-foreground text-xs hover:text-primary transition-colors inline-block opacity-50 hover:opacity-100"
          >
            התחברות מנהל מערכת
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
