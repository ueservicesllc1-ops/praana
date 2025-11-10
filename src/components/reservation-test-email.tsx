"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { EmailJsConfigurationError, sendReservationConfirmation } from "@/lib/emailjs";

export function ReservationTestEmail({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please provide a destination email");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendReservationConfirmation({
        to_email: trimmed,
        guest_name: "Test Guest",
        reservation_code: "TEST-EMAIL",
        reservation_date: new Date().toLocaleDateString(),
        reservation_time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        guest_count: "2",
        guest_phone: "",
        manage_reservation_url: "https://praanabypaheli.com",
        venue_address: "Praana Studio",
      });

      setMessage("Test email sent. Check the inbox.");
    } catch (err) {
      console.error("Test email error", err);
      if (err instanceof EmailJsConfigurationError) {
        setError(err.message);
      } else {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to send test email. Verify EmailJS settings and try again.";
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#101b15]/95 p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">EmailJS</p>
            <h2 className="font-display text-2xl">Send test reservation email</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-white/70">Destination email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="guest@example.com"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
            />
          </label>

          {message ? (
            <p className="text-sm text-emerald-200">{message}</p>
          ) : null}
          {error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300/90 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? "Sending" : "Send test email"}
          </button>
        </form>
      </div>
    </div>
  );
}
