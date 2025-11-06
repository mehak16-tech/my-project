import { useEffect, useMemo, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";
import AuthPanel from "./AuthPanel.jsx";
import PromptsSidebar from "./PromptsSidebar.jsx";
import PromptFillModal from "./PromptFillModal.jsx";
import { api } from "../lib/api.js";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [fillOpen, setFillOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const canSend = useMemo(() => !loading, [loading]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // On mount, if token exists, ensure a session and load messages
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Fetch sessions and pick the most recent active, else create one
    (async () => {
      try {
        const sessions = await api.listSessions();
        let chosen = sessions?.[0];
        if (!chosen) {
          const created = await api.createSession({ title: "Chat with Gemini" });
          chosen = created;
        }
        if (chosen?._id) {
          setSessionId(chosen._id);
          const msgs = await api.listMessages(chosen._id);
          setMessages(
            msgs.map((m) => ({
              id: m._id,
              role: m.role === "assistant" ? "model" : m.role,
              text: m.content,
            }))
          );
        }
        setUser({ token });
      } catch (e) {
        setError(e?.message || "Failed to init session");
      }
    })();
  }, []);

  async function handleSend(text) {
    if (!canSend) return;
    setError("");
    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", text },
    ]);
    setLoading(true);
    try {
      let sid = sessionId;
      if (!sid) {
        const created = await api.createSession({ title: "Chat with Gemini" });
        sid = created?._id;
        if (!sid) throw new Error("Session creation failed");
        setSessionId(sid);
      }
      const res = await api.sendMessage({ sessionId: sid, content: text });
      const userMsg = res?.user;
      const aiMsg = res?.assistant;
      setMessages((prev) => [
        ...prev.map((m) => (m.id === tempId ? { id: userMsg?._id || tempId, role: "user", text: userMsg?.content || text } : m)),
        ...(aiMsg ? [{ id: aiMsg._id || crypto.randomUUID(), role: "model", text: aiMsg.content }] : []),
      ]);
    } catch (e) {
      setError(
        e?.message || "Something went wrong. Check your API key and network."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSendWithSystem(systemText) {
    setError("");
    setLoading(true);
    try {
      let sid = sessionId;
      if (!sid) {
        const created = await api.createSession({ title: "Chat with Gemini" });
        sid = created?._id;
        if (!sid) throw new Error("Session creation failed");
        setSessionId(sid);
      }
      const res = await api.sendMessage({ sessionId: sid, content: "", system: systemText });
      const aiMsg = res?.assistant;
      if (aiMsg) {
        setMessages((prev) => [
          ...prev,
          { id: aiMsg._id || crypto.randomUUID(), role: "model", text: aiMsg.content },
        ]);
      }
    } catch (e) {
      setError(e?.message || "Failed to send system prompt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-root">
      <div className="chat-card">
        <header className="chat-header">
          <div className="brand">
            <span className="spark" />
            <span>Gemini Chat</span>
          </div>
          <div className={`status ${loading ? "on" : "off"}`}>
            {loading ? "Thinking…" : "Ready"}
          </div>
        </header>
        {!user ? (
          <div className="chat-list" ref={listRef}>
            <AuthPanel onAuthed={() => window.location.reload()} />
          </div>
        ) : (
          <div className="chat-body">
            <PromptsSidebar
              onSelect={(p) => { setSelectedPrompt(p); setFillOpen(true); }}
              onCreate={(refresh) => { setSelectedPrompt({ name: "", content: "", variables: [], isGlobal: false }); setFillOpen(true); }}
              onEdit={(p, refresh) => { setSelectedPrompt(p); setFillOpen(true); }}
            />
            <div className="chat-main">
              <div className="chat-list" ref={listRef}>
                {messages.map((m) => (
                  <MessageBubble key={m.id} role={m.role} text={m.text} />
                ))}
              </div>
              {error && <div className="error-banner">{error}</div>}
              <MessageInput onSend={handleSend} disabled={!canSend} value={draft} onChangeValue={setDraft} />
            </div>
          </div>
        )}
      </div>
      <div className="bg-gradient" />
      <PromptFillModal
        open={fillOpen}
        prompt={selectedPrompt}
        onClose={() => setFillOpen(false)}
        onSaved={() => { setFillOpen(false); }}
        onApplySystem={async (text) => {
          setFillOpen(false);
          await handleSendWithSystem(text);
        }}
        onApplyUser={(text) => {
          setFillOpen(false);
          setDraft(text);
        }}
      />
    </div>
  );
}

 


