import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Briefcase, X } from "lucide-react";
import { ApplicationCard, type ApplicationStatus } from "@/components/ApplicationCard";
import { useApplications, type Application } from "@/hooks/useApplications";

const DEFAULT_BACKEND_URL = "http://localhost:3000";

interface AddApplicationFormProps {
  onSubmit: (app: { company: string; position: string; url?: string; status: ApplicationStatus }) => void;
  onCancel: () => void;
}

function AddApplicationForm({ onSubmit, onCancel }: AddApplicationFormProps) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("Applied");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;
    onSubmit({ company: company.trim(), position: position.trim(), url: url.trim() || undefined, status });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Add Application</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Job title"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Applied">Applied</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Add Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Applications() {
  const [backendUrl] = useState(DEFAULT_BACKEND_URL);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">("All");
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { applications, loading, error, fetchAll, create, updateStatus, remove } = useApplications(backendUrl);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Filter by status
    if (statusFilter !== "All") {
      result = result.filter((app) => app.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.company.toLowerCase().includes(query) ||
          app.position.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime());

    return result;
  }, [applications, statusFilter, searchQuery]);

  const handleAddApplication = async (app: {
    company: string;
    position: string;
    url?: string;
    status: ApplicationStatus;
  }) => {
    await create(app);
    setShowAddForm(false);
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await updateStatus(id, status);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      await remove(id);
    }
  };

  const statusOptions: Array<ApplicationStatus | "All"> = [
    "All",
    "Applied",
    "Interviewing",
    "Offer",
    "Rejected",
    "Withdrawn",
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Applications</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Application
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company or position..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "All")}
            className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="text-center py-8 text-slate-500">
          <div className="animate-pulse">Loading applications...</div>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          <p>Error: {error}</p>
          <button onClick={fetchAll} className="text-blue-600 hover:underline mt-2">
            Try again
          </button>
        </div>
      )}

      {/* Applications List */}
      {!loading && !error && filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-medium text-slate-700 mb-1">No applications tracked yet</h3>
          <p className="text-sm text-slate-500 mb-4">Add your first job application to get started</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </button>
        </div>
      )}

      {!loading && !error && filteredApplications.length > 0 && (
        <div className="space-y-3">
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Application Modal */}
      {showAddForm && (
        <AddApplicationForm
          onSubmit={handleAddApplication}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
