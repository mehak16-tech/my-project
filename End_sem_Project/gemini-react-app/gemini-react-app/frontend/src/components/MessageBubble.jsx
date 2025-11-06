export default function MessageBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`chat-bubble-row ${isUser ? "end" : "start"}`}>
      {!isUser && <div className="avatar bot">AI</div>}
      <div className={`bubble ${isUser ? "user" : "bot"}`}>
        {text}
      </div>
      {isUser && <div className="avatar user">You</div>}
    </div>
  );
}


