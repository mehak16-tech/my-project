import { useMemo, useState } from "react";
import { api } from "../lib/api.js";

function extractVariables(template) {
  const re = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g;
  const vars = new Set();
  let m;
  while ((m = re.exec(template))) vars.add(m[1]);
  return Array.from(vars);
}

export default function PromptFillModal({ open, prompt, onClose, onApplySystem, onApplyUser, onSaved }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const variables = useMemo(() => {
    const v = prompt?.variables?.length ? prompt.variables : extractVariables(prompt?.content || "");
    return v;
  }, [prompt]);

  if (!open) return null;

  function fillTemplate() {
    let text = prompt?.content || "";
    for (const k of variables) {
      const val = values[k] ?? "";
      const re = new RegExp(`\\{\\{\\s*${k}\\s*\\}}`, "g");
      text = text.replace(re, String(val));
    }
    return text;
  }

  async function handleSave(newPrompt) {
    setBusy(true);
    setError("");
    try {
      if (prompt?._id) {
        await api.updatePrompt(prompt._id, newPrompt);
      } else {
        await api.createPrompt(newPrompt);
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to save prompt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{prompt?._id ? "Use template" : "New template"}</div>
          <button className="icon-btn" onClick={onClose}>✖</button>
        </div>
        <div className="modal-body">
          {!prompt?._id && (
            <PromptEditor busy={busy} error={error} onSave={handleSave} initial={prompt} />
          )}
          {prompt?._id && (
            <div className="vars-grid">
              {variables.length === 0 ? (
                <div className="muted">No variables</div>
              ) : (
                variables.map((k) => (
                  <div key={k} className="var-row">
                    <label>{k}</label>
                    <input className="input" value={values[k] || ""} onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))} />
                  </div>
                ))
              )}
            </div>
          )}
          {error && <div className="error-banner">{error}</div>}
        </div>
        {prompt?._id ? (
          <div className="modal-actions">
            <button className="send-btn" disabled={busy} onClick={() => onApplySystem?.(fillTemplate())}>Use as system</button>
            <button className="send-btn" disabled={busy} onClick={() => onApplyUser?.(fillTemplate())}>Use as message</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PromptEditor({ initial, onSave, busy, error }) {
  const [name, setName] = useState(initial?.name || "");
  const [content, setContent] = useState(initial?.content || "");
  const [vars, setVars] = useState((initial?.variables || []).join(", "));
  const [isGlobal, setIsGlobal] = useState(Boolean(initial?.isGlobal));

  function parseVars(s) {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return (
    <div className="editor-grid">
      <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea className="textarea" placeholder="Template content with {{variables}}" value={content} onChange={(e) => setContent(e.target.value)} />
      <input className="input" placeholder="Variables (comma-separated)" value={vars} onChange={(e) => setVars(e.target.value)} />
      <label className="checkbox-row">
        <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} />
        Make global
      </label>
      {error && <div className="error-banner">{error}</div>}
      <div className="modal-actions">
        <button className="send-btn" disabled={busy} onClick={() => onSave({ name, content, variables: parseVars(vars), isGlobal })}>Save</button>
      </div>
    </div>
  );
}


