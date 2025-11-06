import { useState } from "react";
import { api, storeToken } from "../lib/api.js";

export default function AuthPanel({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    // Minimal client-side validation to match backend contract
    if (mode === "register") {
      if (!trimmedName) return setError("Name is required");
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return setError("Valid email required");
      if (!trimmedPassword || trimmedPassword.length < 6) return setError("Password must be at least 6 chars");
    } else {
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return setError("Valid email required");
      if (!trimmedPassword) return setError("Password is required");
    }
    setLoading(true);
    try {
      const payload = mode === "register"
        ? { name: trimmedName, email: trimmedEmail, password: trimmedPassword }
        : { email: trimmedEmail, password: trimmedPassword };
      const res = mode === "register" ? await api.register(payload) : await api.login(payload);
      if (res?.token) {
        storeToken(res.token);
        onAuthed(res);
      } else {
        throw new Error("No token returned");
      }
    } catch (e) {
      setError(e?.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h2 className="auth-title">{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <p className="auth-sub">Sign {mode === "login" ? "in" : "up"} to start chatting</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {error && <div className="error-banner">{error}</div>}
          <button className="send-btn" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <div className="auth-switch">
          {mode === "login" ? (
            <button className="link" onClick={() => setMode("register")} disabled={loading}>Need an account? Register</button>
          ) : (
            <button className="link" onClick={() => setMode("login")} disabled={loading}>Already have an account? Login</button>
          )}
        </div>
      </div>
    </div>
  );
}


