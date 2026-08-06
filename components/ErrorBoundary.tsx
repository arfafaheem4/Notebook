"use client";
import { Component, ReactNode } from "react";

type Props = { children: ReactNode; fallbackMessage?: string; severity?: "low" | "high" };
type State = { hasError: boolean };

const errorCounts = new Map<string, number>();

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  retryTimeout: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const key = error.message;
    const count = (errorCounts.get(key) || 0) + 1;
    errorCounts.set(key, count);

    console.error(`[ErrorBoundary:${this.props.severity || "low"}] Component crashed:`, error, info.componentStack);

    const isHighSeverity = this.props.severity === "high";
    const isRepeatedIssue = count >= 3;

    if (isHighSeverity || isRepeatedIssue) {
      reportToDeveloper(error, info.componentStack, count);
    }

    // Auto-retry once for low-severity issues, after a short pause
    if (!isHighSeverity && count < 3) {

  this.retryTimeout = setTimeout(() => {
    this.setState({ hasError: false });
  }, 2000);
}
  }

  componentWillUnmount() {
  console.log("ErrorBoundary UNMOUNTING - clearing retry");
  if (this.retryTimeout) clearTimeout(this.retryTimeout);
}

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-2 rounded-lg border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300 text-sm">
          {this.props.fallbackMessage || "Something went wrong in this section."}
        </div>
      );
    }
    return this.props.children;
  }
}

function reportToDeveloper(error: Error, componentStack: string | null | undefined, occurrences: number) {
 // Placeholder — wired to Sentry in the next step
  console.warn("[NOTIFY DEVELOPER] High-priority error:", error.message, `(seen ${occurrences}x)`);
}