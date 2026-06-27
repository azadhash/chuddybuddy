import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage.jsx';

// The scrolling conversation. role="log" + aria-live="polite" announce new
// assistant replies to screen readers. Shows a genuine empty state before any
// message — nothing is seeded.
export default function ChatThread({ messages, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    // Guard the method itself — jsdom (tests) doesn't implement scrollIntoView.
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages, loading]);

  return (
    <div className="chat__log" role="log" aria-live="polite" aria-label="Conversation with Anchor">
      {messages.length === 0 && (
        <p className="chat__empty">
          Tell Anchor how your prep is going today. Write as much or as little as you like — it
          listens for what is really weighing on you, and we can talk it through.
        </p>
      )}

      {messages.map((turn) => (
        <ChatMessage key={turn.id} turn={turn} />
      ))}

      {loading && (
        <p className="status" role="status">
          <span aria-hidden="true">⏳ </span>Anchor is thinking…
        </p>
      )}

      <div ref={endRef} />
    </div>
  );
}
