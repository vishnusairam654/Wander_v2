// app/layout.tsx
// BUG-17 FIX: Removed non-standard `ui` prop on ClerkProvider — not in Clerk docs,
//             can throw at runtime depending on version.
// BUG-28 FIX: Removed `import { ui } from "@clerk/ui"` — package version may not
//             export `ui`, causing a build-time crash.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { FONTS } from "@/lib/fonts";
import { validateEnv } from "@/lib/env";

// Validate required environment variables at startup (BUG-18)
if (typeof window === "undefined") {
  validateEnv();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WanderWay",
  description: "AI-powered travel planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = Object.values(FONTS.localFonts)
    .map((font) => font.variable)
    .join(" ");

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1A6B4A",
          colorBackground: "#FAFAF8",
          borderRadius: "1rem",
          fontFamily: "inherit",
        },
        elements: {
          card: "shadow-2xl shadow-primary/10 border border-border/50 rounded-3xl",
          headerTitle: "font-eagle font-bold text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "rounded-2xl border border-border/60 hover:bg-accent transition-all font-medium",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 rounded-2xl font-eagle font-bold transition-all",
          footerActionLink: "text-primary hover:text-primary/80",
          formFieldInput:
            "rounded-2xl border-border/60 focus:border-primary focus:ring-primary/20 bg-background",
          dividerLine: "bg-border/50",
          avatarBox: "rounded-full",
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${FONTS.inter.variable} ${fontVariables} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}