// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// BUG-10 FIX: getThreadId was duplicated in both ChatBot.tsx and TripForm.tsx.
// Extracting to a shared utility prevents silent divergence if either copy changes.
export function getThreadId(): string {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem("wandr-thread-id");
  if (!id) {
    id = `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("wandr-thread-id", id);
  }
  return id;
}