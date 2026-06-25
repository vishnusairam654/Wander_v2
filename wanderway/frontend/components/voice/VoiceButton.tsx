"use client";
// components/voice/VoiceButton.tsx
// BUG-08 FIX: VoiceButton previously fetched a LiveKit token but NEVER connected
//             to the room. The `@livekit/components-react` package was installed but
//             unused. Now uses Room from livekit-client to actually connect.
// BUG-27 FIX: Added onVoiceActiveChange prop so ChatBot can conditionally render
//             VoiceBanner based on the actual connection state.

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, PhoneOff, Loader2, Link2 } from "lucide-react";
import { Room, RoomEvent, type RemoteParticipant } from "livekit-client";
import { cn } from "@/lib/utils";

interface VoiceParticipant {
    identity: string;
    isSpeaking: boolean;
}

interface VoiceBannerProps {
    threadId: string;
    username?: string;
    onClose: () => void;
}

export function VoiceBanner({ threadId, username = "Traveler", onClose }: VoiceBannerProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [participants, setParticipants] = useState<VoiceParticipant[]>([
        { identity: username, isSpeaking: false },
    ]);
    const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

    const copyInviteLink = async () => {
        const link = `${window.location.origin}?voice=${threadId}`;
        try {
            await navigator.clipboard.writeText(link);
            setInviteLinkCopied(true);
            setTimeout(() => setInviteLinkCopied(false), 2000);
        } catch (err) {
            console.error("Clipboard write failed:", err);
        }
    };

    return (
        <div className="bg-primary/5 border-b border-primary/20 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs font-medium text-foreground">
                    Voice active · {participants.length} in room
                </span>
            </div>

            <div className="flex items-center gap-1">
                {participants.map((p, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-7 h-7 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2",
                            p.isSpeaking ? "border-secondary animate-pulse" : "border-background"
                        )}
                        title={p.identity}
                    >
                        {p.identity.charAt(0).toUpperCase()}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <button
                    suppressHydrationWarning
                    onClick={copyInviteLink}
                    className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors"
                >
                    <Link2 size={11} />
                    {inviteLinkCopied ? "Copied!" : "Invite"}
                </button>

                <button
                    suppressHydrationWarning
                    onClick={() => setIsMuted(!isMuted)}
                    className={cn(
                        "p-1.5 rounded-full transition-colors",
                        isMuted
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                </button>

                <button
                    suppressHydrationWarning
                    onClick={onClose}
                    className="p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    title="Leave voice"
                >
                    <PhoneOff size={14} />
                </button>
            </div>
        </div>
    );
}

interface VoiceButtonProps {
    threadId: string;
    username?: string;
    /** Callback so parent (ChatBot) knows when to show/hide VoiceBanner */
    onVoiceActiveChange?: (active: boolean) => void;
}

export function VoiceButton({ threadId, username, onVoiceActiveChange }: VoiceButtonProps) {
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const roomRef = useRef<Room | null>(null);

    // Cleanup room on unmount
    useEffect(() => {
        return () => {
            roomRef.current?.disconnect();
        };
    }, []);

    const setActive = (active: boolean) => {
        setIsVoiceActive(active);
        onVoiceActiveChange?.(active);
    };

    const handleLeaveVoice = async () => {
        await roomRef.current?.disconnect();
        roomRef.current = null;
        setActive(false);
        setError(null);
    };

    const handleJoinVoice = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/voice/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomName: threadId,
                    username: username || `Traveler-${Math.floor(Math.random() * 9000) + 1000}`,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to get voice token");
            }

            const { token, url } = await res.json();

            if (!url) throw new Error("LiveKit URL not configured on server");

            // BUG-08 FIX: Actually connect to the LiveKit room using the token
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            room.on(RoomEvent.Disconnected, () => {
                setActive(false);
            });

            await room.connect(url, token);
            // Enable microphone
            await room.localParticipant.setMicrophoneEnabled(true);

            roomRef.current = room;
            setActive(true);
        } catch (err) {
            console.error("Voice join failed:", err);
            setError(err instanceof Error ? err.message : "Could not join voice");
            setActive(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = () => {
        if (isVoiceActive) {
            handleLeaveVoice();
        } else {
            handleJoinVoice();
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                suppressHydrationWarning
                onClick={handleToggle}
                disabled={isLoading}
                className={cn(
                    "p-2 rounded-xl transition-all duration-300 flex items-center gap-1.5",
                    isVoiceActive
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "opacity-60 hover:opacity-100 text-primary-foreground hover:bg-primary-foreground/10"
                )}
                title={isVoiceActive ? "Leave voice chat" : "Join voice chat"}
            >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Mic size={16} />
                )}
                {isVoiceActive && <span className="text-[10px] font-medium">Live</span>}
            </button>
            {error && (
                <span className="text-[9px] text-destructive bg-destructive/10 px-2 py-0.5 rounded-full max-w-[140px] truncate">
                    {error}
                </span>
            )}
        </div>
    );
}