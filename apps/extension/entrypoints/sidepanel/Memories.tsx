import { useState, useEffect } from "react";
import { Brain, Trash2, Edit2, Check, X, Plus, RefreshCw } from "lucide-react";
import { BACKEND_URL } from "@/lib/env";

interface Memory {
  id: string;
  question: string;
  answer: string;
  category: string;
  source: string;
  usage_count: number;
  created_at: number;
}

export function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: "", answer: "" });
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/memories/all`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      } else {
        setError("Failed to fetch memories");
      }
    } catch (e) {
      setError("Backend offline - cannot connect");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/memories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories(memories.filter((m) => m.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditForm({ question: memory.question, answer: memory.answer });
  };

  const handleSaveEdit = async (id: string) => {
    // Use PATCH endpoint to update
    try {
      const res = await fetch(`${BACKEND_URL}/api/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: editForm.question,
          answer: editForm.answer,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchMemories();
      }
    } catch (e) {
      console.error("Failed to update:", e);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ question: "", answer: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchMemories}
          className="mt-2 text-sm text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Your Memories</h2>
        <button
          onClick={fetchMemories}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed rounded-xl p-8 text-center text-slate-400">
          <Brain className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>No memories stored yet.</p>
          <p className="text-xs mt-1">Memories are created automatically when you auto-fill forms.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="p-4 bg-white border rounded-xl space-y-2"
            >
              {editingId === memory.id ? (
                <>
                  <input
                    type="text"
                    value={editForm.question}
                    onChange={(e) =>
                      setEditForm({ ...editForm, question: e.target.value })
                    }
                    className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Question"
                  />
                  <textarea
                    value={editForm.answer}
                    onChange={(e) =>
                      setEditForm({ ...editForm, answer: e.target.value })
                    }
                    className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={3}
                    placeholder="Answer"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(memory.id)}
                      className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 line-clamp-2">
                        {memory.question}
                      </p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-3">
                        {memory.answer}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(memory)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(memory.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {memory.category && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                        {memory.category}
                      </span>
                    )}
                    <span>Used {memory.usage_count || 0} times</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
