import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { FirebaseAnalyticsProvider } from "@/components/firebase-analytics-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-praana-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Praana By Paheli | Vegetarian Indian Restaurant in Wayne, NJ",
  description:
    "Praana By Paheli is a modern vegetarian restaurant that celebrates the vibrant flavors of India with a refined touch in Wayne, New Jersey.",
  keywords: [
    "Praana By Paheli",
    "vegetarian restaurant Wayne",
    "modern Indian cuisine",
    "vegetarian fine dining",
  ],
  openGraph: {
    title: "Praana By Paheli | Pure Vegetarian Indian Restaurant",
    description:
      "An elevated vegetarian dining experience with handcrafted spices, ayurvedic rituals, and warm hospitality in the heart of Wayne.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1400&q=80",
        width: 1400,
        height: 980,
        alt: "Elegant table with modern vegetarian Indian dishes at Praana By Paheli",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Praana By Paheli | Vegetarian Indian Dining",
    description:
      "Vibrant flavors, mindful spices, and a refined vegetarian experience in Wayne.",
    images: [
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1400&q=80",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <FirebaseAnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
