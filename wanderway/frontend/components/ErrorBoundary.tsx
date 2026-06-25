"use client";
// components/ErrorBoundary.tsx
// BUG-25 FIX: No error boundaries existed in the component tree. Any runtime
// error (e.g. .map() on undefined) in TripResults, TripMap, etc. crashed the
// entire page showing a blank white screen with no recovery path.

import React, { Component, type ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    label?: string; // e.g. "Trip Map" for a descriptive error message
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`[ErrorBoundary: ${this.props.label ?? "unknown"}]`, error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border border-destructive/20 bg-destructive/5 text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle size={22} className="text-destructive" />
                    </div>
                    <div>
                        <p className="font-eagle font-bold text-foreground">
                            {this.props.label ? `${this.props.label} failed to load` : "Something went wrong"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                            {this.state.error?.message ?? "An unexpected error occurred."}
                        </p>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCw size={14} /> Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}