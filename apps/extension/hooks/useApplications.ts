import { useState, useCallback } from "react";

export type ApplicationStatus = "Applied" | "Interviewing" | "Offer" | "Rejected" | "Withdrawn";

export interface Application {
  id: string;
  company: string;
  position: string;
  url?: string;
  status: ApplicationStatus;
  applied_date: string;
  cover_letter_id?: string;
}

export interface UseApplicationsReturn {
  applications: Application[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  create: (app: Omit<Application, "id" | "applied_date">) => Promise<Application>;
  updateStatus: (id: string, status: ApplicationStatus) => Promise<Application>;
  remove: (id: string) => Promise<void>;
}

export function useApplications(backendUrl: string): UseApplicationsReturn {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/applications`);
      if (!res.ok) {
        throw new Error(`Failed to fetch applications: ${res.statusText}`);
      }
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  const create = useCallback(async (app: Omit<Application, "id" | "applied_date">): Promise<Application> => {
    const res = await fetch(`${backendUrl}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(app),
    });
    if (!res.ok) {
      throw new Error(`Failed to create application: ${res.statusText}`);
    }
    const newApp = await res.json();
    setApplications((prev) => [newApp, ...prev]);
    return newApp;
  }, [backendUrl]);

  const updateStatus = useCallback(async (id: string, status: ApplicationStatus): Promise<Application> => {
    const res = await fetch(`${backendUrl}/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update application: ${res.statusText}`);
    }
    const updatedApp = await res.json();
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? updatedApp : app))
    );
    return updatedApp;
  }, [backendUrl]);

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`${backendUrl}/api/applications/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`Failed to delete application: ${res.statusText}`);
    }
    setApplications((prev) => prev.filter((app) => app.id !== id));
  }, [backendUrl]);

  return {
    applications,
    loading,
    error,
    fetchAll,
    create,
    updateStatus,
    remove,
  };
}
