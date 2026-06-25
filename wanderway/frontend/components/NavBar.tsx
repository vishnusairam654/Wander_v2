"use client";
// components/NavBar.tsx
// BUG-05 FIX: Pass onLoadTrip to TripHistoryModal. When a trip is loaded, dispatch
// a CustomEvent that app/page.tsx listens for — avoiding prop-drilling through layout.

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";
import { useUser, useClerk, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { History, LogIn, UserPlus } from "lucide-react";
import TripHistoryModal from "@/components/planning/TripHistoryModal";
import type { TripData } from "@/types/trip";

const nav_links = [
  { label: "Trip Planner", href: "/", isCTA: false },
];

const NavBar = () => {
  const { isSignedIn } = useUser();
  const [showHistory, setShowHistory] = useState(false);

  // BUG-05 FIX: Dispatch CustomEvent — page.tsx handles the trip load
  const handleLoadTrip = (trip: TripData) => {
    window.dispatchEvent(
      new CustomEvent<TripData>("wandr:load-trip", { detail: trip })
    );
    setShowHistory(false);
  };

  return (
    <>
      <nav className="flex items-center justify-between w-full px-6 py-4 bg-background border-b border-border/50 z-50 sticky top-0 backdrop-blur-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-accent">
            <Image
              src={ASSETS.logo}
              alt="WanderWay logo"
              fill
              sizes="40px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              // Graceful fallback if image 404s
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <h1 className="text-secondary text-xl font-bold tracking-tight font-eagle">
            Wander<span className="text-foreground italic"> Way</span>
          </h1>
        </Link>

        {/* Right Side: Nav + Auth */}
        <div className="flex items-center gap-6">
          <ul className="hidden md:flex items-center gap-6">
            {nav_links.map((link, index) => (
              <li key={index}>
                <Link
                  href={link.href}
                  className="relative text-sm font-eagle font-medium tracking-wide text-foreground group"
                >
                  {link.label}
                  <span className="absolute left-1/2 -bottom-1 h-[2px] w-0 bg-secondary/80 transition-all duration-300 ease-out group-hover:w-full group-hover:left-0" />
                </Link>
              </li>
            ))}
          </ul>

          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-eagle font-medium text-foreground bg-accent hover:bg-accent/80 border border-border/50 rounded-xl transition-all"
                title="Trip History"
              >
                <History size={15} className="text-primary" />
                <span className="hidden sm:block">My Trips</span>
              </button>
              <div className="[&_.cl-avatarBox]:w-9 [&_.cl-avatarBox]:h-9 [&_.cl-avatarBox]:ring-2 [&_.cl-avatarBox]:ring-primary/20 [&_.cl-avatarBox]:rounded-full">
                <UserButton
                  appearance={{ elements: { avatarBox: "w-9 h-9 ring-2 ring-primary/20" } }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button suppressHydrationWarning className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-eagle font-medium text-foreground hover:text-primary border border-border/60 rounded-xl hover:border-primary/40 hover:bg-accent transition-all">
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button suppressHydrationWarning className="flex items-center gap-1.5 px-4 py-2 text-sm font-eagle font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 transition-all">
                  <UserPlus size={14} />
                  <span className="hidden sm:block">Get Started</span>
                  <span className="sm:hidden">Join</span>
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </nav>

      {showHistory && (
        <TripHistoryModal
          onClose={() => setShowHistory(false)}
          onLoadTrip={handleLoadTrip}
        />
      )}
    </>
  );
};

export default NavBar;