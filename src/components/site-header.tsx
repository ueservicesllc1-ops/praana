"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ShieldCheck, LogIn, LogOut, Menu, X, Phone } from "lucide-react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const LOGO_SRC = "/images/logo2.png";

export function SiteHeader() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      setAuthError(null);
    });
    return unsubscribe;
  }, []);

  const userInitials = useMemo(() => {
    if (!currentUser) return "";
    const identifier = currentUser.displayName ?? currentUser.email ?? "";
    return identifier
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [currentUser]);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setAuthError("Unable to sign in with Google. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthError(null);
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
      setAuthError("Unable to sign out. Please try again.");
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.setProperty("overflow", "hidden");
    } else {
      document.body.style.removeProperty("overflow");
    }

    return () => {
      document.body.style.removeProperty("overflow");
    };
    if (!isMenuOpen) {
      setIsUserMenuOpen(false);
    }
  }, [isMenuOpen]);

  const navItems = [
    { href: "#rituals", label: "Experiences" },
    { href: "#tasting-menu", label: "Tasting Menu" },
    { href: "#reservations", label: "Reservations" },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1813]/90 backdrop-blur"
      >
        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 text-white sm:px-6 lg:px-10">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white transition hover:border-white/40 hover:text-emerald-100 lg:hidden"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="#" className="flex items-center" onClick={closeMenu}>
              <div className="relative h-9 w-36 overflow-visible sm:h-10 sm:w-48 lg:h-12 lg:w-60">
                <Image
                  src={LOGO_SRC}
                  alt="Praana By Paheli logo"
                  fill
                  sizes="224px"
                  className="origin-left scale-[1.15] object-contain brightness-0 invert lg:scale-[1.25]"
                  priority
                />
              </div>
            </Link>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                className="transition hover:text-white"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            {authError ? (
              <span className="hidden rounded-md border border-red-300/60 bg-red-400/15 px-3 py-1 text-xs text-red-100 md:inline-flex">
                {authError}
              </span>
            ) : null}
            <Link
              href="/admin"
              className="hidden items-center rounded-md border border-white/10 p-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white md:flex"
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
            </Link>
            <div className="flex items-center gap-2">
              <a
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white md:hidden"
                href="tel:+19739873089"
                aria-label="Call Praana"
              >
                <Phone className="h-4 w-4" />
              </a>
              <a
                className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
                href="#reservations"
              >
                Book a Table
              </a>
            </div>
            {currentUser ? (
              <div className="relative hidden md:flex md:ml-4 lg:ml-6">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <span className="uppercase">
                    {userInitials || "U"}
                  </span>
                </button>
                <AnimatePresence>
                  {isUserMenuOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-white/15 bg-[#101b15]/95 shadow-lg"
                    >
                      <div className="border-b border-white/10 px-4 py-3 text-sm text-white/80">
                        <p className="font-medium text-white">
                          {currentUser.displayName ?? currentUser.email ?? "Guest"}
                        </p>
                        {currentUser.email ? (
                          <p className="text-xs text-white/50">{currentUser.email}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          void handleSignOut();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="hidden items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white/75 transition hover:border-white/40 hover:text-white md:inline-flex"
                disabled={authLoading}
              >
                <LogIn className="h-4 w-4" />
                {authLoading ? "Loading" : "Login"}
              </button>
            )}
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.button
              type="button"
              onClick={closeMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 flex w-[78vw] max-w-xs flex-col gap-6 border-r border-white/10 bg-[#0d1813]/95 px-5 pb-10 pt-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Link href="#" onClick={closeMenu} className="relative h-9 w-32">
                  <Image
                    src={LOGO_SRC}
                    alt="Praana By Paheli logo"
                    fill
                    sizes="128px"
                    className="object-contain brightness-0 invert"
                    priority
                  />
                </Link>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-white transition hover:border-white/40 hover:text-emerald-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-2 text-sm text-white/85">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                    onClick={closeMenu}
                  >
                    {item.label}
                  </a>
                ))}
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-left text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                  onClick={closeMenu}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              </nav>
              <div className="space-y-4">
                {currentUser ? (
                  <div className="space-y-3 rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/90 text-sm font-semibold text-emerald-950 uppercase">
                        {userInitials || "U"}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {currentUser.displayName ?? currentUser.email ?? "Guest"}
                        </span>
                        <span className="text-xs text-white/50">Signed in</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        void handleSignOut();
                      }}
                      className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:border-white/30 hover:bg-white/15"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      void handleGoogleLogin();
                    }}
                    disabled={authLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/15 disabled:opacity-60"
                  >
                    <LogIn className="h-4 w-4" />
                    {authLoading ? "Loading" : "Sign in with Google"}
                  </button>
                )}
                <a
                  href="tel:+19739873089"
                  className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/85 transition hover:border-white/30 hover:bg-white/15 hover:text-white"
                  onClick={closeMenu}
                >
                  <Phone className="h-4 w-4" />
                  (973) 987-3089
                </a>
                <a
                  href="#reservations"
                  className="flex items-center justify-center gap-2 rounded-md border border-emerald-200/60 bg-emerald-300/90 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
                  onClick={closeMenu}
                >
                  Book a Table
                </a>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

