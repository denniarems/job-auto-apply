import { useState, useEffect } from "react";
import { BACKEND_URL } from '@/lib/env';

const POLL_ONLINE_MS = 5000;
const POLL_OFFLINE_MS = 15000;

interface ApiKeys {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
  qwen: boolean;
}

export function useBackendStatus() {
  const [status, setStatus] = useState<"online" | "offline" | "loading">("loading");
  const [keys, setKeys] = useState<ApiKeys>({
    anthropic: false,
    openai: false,
    google: false,
    qwen: false,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`);
        if (res.ok) {
          const data = await res.json();
          setStatus("online");
          setKeys(data.keys as ApiKeys);
          // Server is online — poll frequently
          timeoutId = setTimeout(checkStatus, POLL_ONLINE_MS);
        } else {
          setStatus("offline");
          // Server returned error — back off
          timeoutId = setTimeout(checkStatus, POLL_OFFLINE_MS);
        }
      } catch {
        setStatus("offline");
        // Server unreachable — back off
        timeoutId = setTimeout(checkStatus, POLL_OFFLINE_MS);
      }
    };

    checkStatus();
    return () => clearTimeout(timeoutId);
  }, []);

  return { status, keys };
}
