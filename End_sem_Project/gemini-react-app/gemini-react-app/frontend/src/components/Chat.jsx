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

  // Determine if user is admin (env list + stored email)
  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    const list = (import.meta.env.VITE_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(user.email.toLowerCase());
  }, [user]);

  // Always scroll to bottom when messages update
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // On mount, restore session + user if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Load stored user info
    let storedUser = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw) storedUser = JSON.parse(raw);
    } catch {
      storedUser = null;
    }

    (async () => {
      try {
        const sessions = await api.listSessions();
        let chosen = sessions?.[0];

        if (!chosen) {
          const created = await api.createSession({
            title: "Chat with Gemini",
          });
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

        // Store token + user so admin check works
        setUser(storedUser ? { ...storedUser, token } : { token });
      } catch (e) {
        setError(e?.message || "Failed to init session");
      }
    })();
  }, []);

  async function handleSend(text) {
    if (!canSend) return;
    setError("");
    setDraft("");

    const tempId = crypto.randomUUID();

    // Optimistic user message
    setMessages((prev) => [...prev, { id: tempId, role: "user", text }]);

    setLoading(true);

    try {
      let sid = sessionId;
      if (!sid) {
        const created = await api.createSession({
          title: "Chat with Gemini",
        });
        sid = created?._id;
        if (!sid) throw new Error("Session creation failed");
        setSessionId(sid);
      }

      const res = await api.sendMessage({
        sessionId: sid,
        content: text,
      });

      const userMsg = res?.user;
      const aiMsg = res?.assistant;

      // Replace temp user message + add AI reply
      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === tempId
            ? {
                id: userMsg?._id || tempId,
                role: "user",
                text: userMsg?.content || text,
              }
            : m
        ),
        ...(aiMsg
          ? [
              {
                id: aiMsg._id || crypto.randomUUID(),
                role: "model",
                text: aiMsg.content,
              },
            ]
          : []),
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
        const created = await api.createSession({
          title: "Chat with Gemini",
        });
        sid = created?._id;
        if (!sid) throw new Error("Session creation failed");
        setSessionId(sid);
      }

      const res = await api.sendMessage({
        sessionId: sid,
        content: "",
        system: systemText,
      });

      const aiMsg = res?.assistant;

      if (aiMsg) {
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsg._id || crypto.randomUUID(),
            role: "model",
            text: aiMsg.content,
          },
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
    <span>Gemini Dev Console</span>
  </div>

  {user ? (
    <div className="header-right">
      <div className="user-chip">
        <div className="user-avatar">
          {(user.name || user.email || "?").charAt(0).toUpperCase()}
        </div>
        <div className="user-name">
          {user.name || user.email}
        </div>
      </div>
      <button
        className="small-btn"
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.reload();
        }}
      >
        Logout
      </button>
      <div className={`status ${loading ? "on" : "off"}`}>
        {loading ? "Thinking…" : "Ready"}
      </div>
    </div>
  ) : (
    <div className="status">
      {loading ? "Thinking…" : "Ready"}
    </div>
  )}
</header>

        {!user ? (
          <div className="chat-list" ref={listRef}>
            <AuthPanel onAuthed={() => window.location.reload()} />
          </div>
        ) : (
          <div className="chat-body">
            <PromptsSidebar
              isAdmin={isAdmin}
              onSelect={(p) => {
                setSelectedPrompt(p);
                setFillOpen(true);
              }}
              onCreate={() => {
                setSelectedPrompt({
                  name: "",
                  content: "",
                  variables: [],
                  isGlobal: false,
                });
                setFillOpen(true);
              }}
              onEdit={(p) => {
                setSelectedPrompt(p);
                setFillOpen(true);
              }}
            />

            <div className="chat-main">
              <div className="chat-list" ref={listRef}>
                {messages.map((m) => (
                  <MessageBubble key={m.id} role={m.role} text={m.text} />
                ))}
              </div>

              {error && <div className="error-banner">{error}</div>}

              <MessageInput
                onSend={handleSend}
                disabled={!canSend}
                value={draft}
                onChangeValue={setDraft}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient" />

      <PromptFillModal
        open={fillOpen}
        prompt={selectedPrompt}
        onClose={() => setFillOpen(false)}
        onSaved={() => setFillOpen(false)}
        onApplySystem={async (text) => {
          setFillOpen(false);
          await handleSendWithSystem(text);
        }}
        onApplyUser={(text) => {
          setFillOpen(false);
          setDraft(text);
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}
