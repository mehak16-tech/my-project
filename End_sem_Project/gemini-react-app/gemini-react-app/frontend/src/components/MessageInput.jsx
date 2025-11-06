import { useState, useEffect } from "react";

export default function MessageInput({ onSend, disabled, value: controlledValue, onChangeValue }) {
  const [value, setValue] = useState("");

  const isControlled = controlledValue !== undefined;
  const val = isControlled ? controlledValue : value;
  const setVal = isControlled ? onChangeValue : setValue;

  useEffect(() => {
    if (isControlled) return;
    // keep internal state; nothing else
  }, [isControlled]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = val.trim();
    if (!text) return;
    onSend(text);
    if (!isControlled) setValue("");
  }

  return (
    <form className="input-bar" onSubmit={handleSubmit}>
      <input
        className="input"
        type="text"
        placeholder="Ask anything..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={disabled}
      />
      <button className="send-btn" type="submit" disabled={disabled}>
        Send
      </button>
    </form>
  );
}


