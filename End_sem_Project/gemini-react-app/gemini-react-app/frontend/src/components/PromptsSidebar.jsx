import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function PromptsSidebar({ onSelect, onCreate, onEdit, onDelete, isAdmin }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const list = await api.listPrompts();
      setPrompts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <aside className="prompts-sidebar">
      <div className="prompts-header">
        <div className="prompts-title">Templates</div>
        <button className="small-btn" onClick={() => onCreate?.(refresh)}>New</button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="prompts-list">
        {loading ? (
          <div className="muted">Loading…</div>
        ) : prompts.length === 0 ? (
          <div className="muted">No prompts yet</div>
        ) : (
          prompts.map((p) => (
            <div key={p._id} className="prompt-item">
              <button className="prompt-main" onClick={() => onSelect?.(p)}>
                <div className="prompt-name">{p.name}</div>
                <div className="prompt-meta">{p.isGlobal ? "Global" : "Personal"}</div>
              </button>
              <div className="prompt-actions">
                {(!p.isGlobal || isAdmin) && (
                  <>
                    <button
                      className="icon-btn"
                      title="Edit"
                      onClick={() => onEdit?.(p, refresh)}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      title="Delete"
                      onClick={async () => {
                        await api.deletePrompt(p._id);
                        refresh();
                        onDelete?.();
                      }}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}