import { useState, useEffect } from "react";

export function useBackendStatus() {
  const [status, setStatus] = useState<"online" | "offline" | "loading">("loading");
  const [keys, setKeys] = useState<{ anthropic: boolean; openai: boolean }>({
    anthropic: false,
    openai: false,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:3000/health");
        if (res.ok) {
          const data = await res.json();
          setStatus("online");
          setKeys(data.keys);
        } else {
          setStatus("offline");
        }
      } catch (e) {
        setStatus("offline");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return { status, keys };
}
