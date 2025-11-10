"use client";

import { useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  EmailJsConfigurationError,
  sendReservationConfirmation,
} from "@/lib/emailjs";
import Image from "next/image";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  partySize: "2",
  occasion: "",
  notes: "",
};

const timeSlots = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
];

const partySizes = Array.from({ length: 8 }).map((_, index) => String(index + 2));

export function ReservationForm() {
  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const db = useMemo(() => getFirebaseFirestore(), []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const { name, email, phone, date, time, partySize } = formState;

    if (!name.trim() || !email.trim() || !phone.trim() || !date || !time) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "reservations"), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        date,
        time,
        partySize: Number(partySize),
        occasion: formState.occasion.trim(),
        notes: formState.notes.trim(),
        createdAt: serverTimestamp(),
      });

      const timestampLabel = new Date().toLocaleString();

      try {
        await sendReservationConfirmation({
          to_email: email.trim(),
          guest_name: name.trim(),
          reservation_code: docRef.id,
          reservation_date: date,
          reservation_time: time,
          guest_count: partySize,
          guest_email: email.trim(),
          guest_phone: phone.trim(),
          special_request: formState.notes.trim() || "—",
          occasion: formState.occasion.trim() || "—",
          manage_reservation_url: `${window.location.origin}/admin`,
          venue_address: "Praana Studio",
          submitted_at: timestampLabel,
        });
      } catch (emailError) {
        console.error("EmailJS send error:", emailError);
        if (emailError instanceof EmailJsConfigurationError) {
          setErrorMessage(emailError.message);
        } else if (emailError instanceof Error) {
          setErrorMessage(
            "Reservation saved, but we couldn't send the confirmation email. We'll follow up manually."
          );
        }
      }

      setSuccessMessage("Your reservation is confirmed. Details were sent to your email.");
      setShowSuccessModal(true);
      setFormState(initialFormState);
    } catch (error) {
      console.error("Reservation submission error:", error);
      setErrorMessage(
        "We couldn't process your reservation right now. Please try again or call us at (973) 987-3089."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4 md:max-w-md">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Reservation</p>
          <h2 className="font-display text-3xl text-white sm:text-4xl">Reserve your table at Praana.</h2>
          <p className="text-sm text-white/70">
            Share your preferred date and time. Our hospitality team will confirm availability and
            tailor the experience to your occasion.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid w-full max-w-2xl gap-4 md:grid-cols-2"
          noValidate
        >
          <div className="md:col-span-1">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Full name *</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                value={formState.name}
                onChange={handleChange}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                placeholder="Anaya Sharma"
              />
            </label>
          </div>
          <div className="md:col-span-1">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Email *</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={formState.email}
                onChange={handleChange}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                placeholder="you@example.com"
              />
            </label>
          </div>
          <div className="md:col-span-1">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Phone *</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formState.phone}
                onChange={handleChange}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                placeholder="(973) 987-3089"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 md:col-span-1 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Date *</span>
              <input
                name="date"
                type="date"
                value={formState.date}
                onChange={handleChange}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Time *</span>
              <select
                name="time"
                value={formState.time}
                onChange={handleChange}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
              >
                <option value="" className="bg-[#101b15] text-white">
                  Select
                </option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot} className="bg-[#101b15] text-white">
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 md:col-span-1 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Guests *</span>
              <select
                name="partySize"
                value={formState.partySize}
                onChange={handleChange}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
              >
                {partySizes.map((size) => (
                  <option key={size} value={size} className="bg-[#101b15] text-white">
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-white/70">Occasion</span>
              <input
                name="occasion"
                type="text"
                value={formState.occasion}
                onChange={handleChange}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                placeholder="Birthday, anniversary"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="text-white/70">Special notes</span>
            <textarea
              name="notes"
              rows={3}
              value={formState.notes}
              onChange={handleChange}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
              placeholder="Let us know about dietary preferences or celebration details."
            />
          </label>

          <div className="md:col-span-2 flex flex-col gap-3">
            {successMessage ? (
              <p className="flex items-center gap-2 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                {successMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="flex items-center gap-2 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4" />
                {errorMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300/90 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Submit reservation"
              )}
            </button>
            <p className="text-xs text-white/40">
              By submitting, you consent to being contacted by Praana By Paheli for reservation
              confirmation.
            </p>
            {errorMessage && successMessage ? (
              <p className="text-xs text-amber-200/80">
                Email confirmation may take a moment to arrive.
              </p>
            ) : null}
          </div>
        </form>
      </div>
      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#101b15]/95 p-8 text-white shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
            <div className="flex flex-col items-center gap-6">
              <div className="relative h-16 w-40">
                <Image
                  src="/images/logo2.png"
                  alt="Praana logo"
                  fill
                  sizes="160px"
                  className="object-contain"
                />
              </div>
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-200">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <div className="space-y-3">
                  <h3 className="font-display text-2xl">Reservation confirmed</h3>
                  <p className="text-sm text-white/70">
                    Your reservation is confirmed. Details were sent to your email.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSuccessModal(false)}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-300/95 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
