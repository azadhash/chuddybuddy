// Crisis safety net. When the entry contains language suggesting self-harm, this
// panel is shown as an assertive live region (role="alert") with prominent,
// always-actionable helplines and an empathetic, non-platitude message. It is
// transparent that Anchor is an AI, not a therapist.

export default function CrisisPanel({ helplines }) {
  return (
    <section className="crisis" role="alert" aria-labelledby="crisis-title">
      <h2 id="crisis-title" className="crisis__title">
        <span aria-hidden="true">💛 </span>You deserve support right now
      </h2>
      <p className="crisis__message">
        What you wrote sounds really heavy, and you do not have to carry it alone. Anchor is an
        AI companion, not a crisis service — please reach out to a real person who can help. If you
        are in immediate danger, contact your local emergency services.
      </p>
      <ul className="crisis__lines">
        {helplines.map((line) => (
          <li key={line.name} className="crisis__line">
            <span className="crisis__name">{line.name}</span>
            <a className="crisis__number" href={`tel:${line.number.replace(/\s/g, '')}`}>
              {line.number}
            </a>
            <span className="crisis__org">{line.org}</span>
          </li>
        ))}
      </ul>
      <p className="crisis__followup">
        Telling someone you trust — a friend, a parent, a teacher, or a counsellor — is a strong
        first step, not a weak one.
      </p>
    </section>
  );
}
