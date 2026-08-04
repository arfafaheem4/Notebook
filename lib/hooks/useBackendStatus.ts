import { useState, useEffect } from "react";

export function useBackendStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("http://localhost:8000/docs");
        if (!cancelled) setConnected(res.ok);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }
    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return connected; // null = checking, true = connected, false = down
}