import { useId, useState } from 'react';

const MAX_CHARS = 4000;

// The journal entry form. A real <label> is associated with the textarea, the
// character counter is announced politely, and loading/error states use live
// regions. (Voice input is the next feature and will attach here.)
export default function JournalForm({ onSubmit, loading, error }) {
  const [value, setValue] = useState('');
  const fieldId = useId();
  const helpId = useId();
  const counterId = useId();

  const tooLong = value.length > MAX_CHARS;
  const empty = value.trim().length === 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (loading || empty || tooLong) return;
    onSubmit(value.trim());
  }

  return (
    <form className="journal" onSubmit={handleSubmit} noValidate>
      <label className="journal__label" htmlFor={fieldId}>
        How are you feeling about your prep today?
      </label>
      <p id={helpId} className="journal__help">
        Write freely — a few sentences about today. Anchor reads between the lines to find
        what is really weighing on you.
      </p>
      <textarea
        id={fieldId}
        className="journal__textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        aria-describedby={`${helpId} ${counterId}`}
        aria-invalid={tooLong}
        placeholder="Today another mock came back and my rank dropped again…"
      />
      <div className="journal__footer">
        <span
          id={counterId}
          className={`journal__counter${tooLong ? ' journal__counter--over' : ''}`}
          aria-live="polite"
        >
          {value.length} / {MAX_CHARS} characters
        </span>
        <button className="button" type="submit" disabled={loading || empty || tooLong}>
          {loading ? 'Reading your entry…' : 'Reflect with Anchor'}
        </button>
      </div>

      {loading && (
        <p className="status" role="status">
          <span aria-hidden="true">⏳ </span>Reading between the lines…
        </p>
      )}
      {error && (
        <p className="alert" role="alert">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </form>
  );
}
