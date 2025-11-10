"use client";

import { useEffect } from "react";
import { getFirebaseAnalytics } from "@/lib/firebase";

export function FirebaseAnalyticsProvider() {
  useEffect(() => {
    getFirebaseAnalytics();
  }, []);

  return null;
}


