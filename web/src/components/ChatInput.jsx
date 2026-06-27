import { useId, useState } from 'react';

// The message composer. A real (visually compact) label names the field. Enter
// sends; Shift+Enter inserts a newline.
export default function ChatInput({ onSend, loading }) {
  const [value, setValue] = useState('');
  const fieldId = useId();
  const empty = value.trim().length === 0;

  function submit() {
    if (loading || empty) return;
    onSend(value.trim());
    setValue('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="composer__label" htmlFor={fieldId}>
        Your message to Anchor
      </label>
      <div className="composer__row">
        <textarea
          id={fieldId}
          className="composer__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Type how you're feeling…"
        />
        <button className="button" type="submit" disabled={loading || empty}>
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  );
}
