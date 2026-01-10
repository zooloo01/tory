"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading, signOut } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-red-600 text-transparent bg-clip-text">
          Torforyou
        </h1>
        <p className="text-gray-300 text-lg">
          Professional cuts, easy scheduling. Book your next fresh look in seconds.
        </p>

        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          <Link
            href="/booking"
            className="flex items-center justify-center rounded-lg bg-orange-600 px-8 py-3 text-lg font-semibold text-white transition-all hover:bg-orange-700 hover:scale-105"
          >
            Book Appointment
          </Link>

          {!loading && (
            user ? (
              <>
                <Link
                  href="/my-appointments"
                  className="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 text-lg font-semibold text-gray-300 transition-all hover:bg-gray-700 hover:text-white"
                >
                  My Appointments
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-400 transition-all hover:bg-gray-700 hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800 px-8 py-3 text-lg font-semibold text-gray-300 transition-all hover:bg-gray-700 hover:text-white"
              >
                Sign In
              </Link>
            )
          )}
        </div>

        <Link
          href="/admin"
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors inline-block mt-6"
        >
          Admin Access →
        </Link>
      </div>
    </main>
  );
}
