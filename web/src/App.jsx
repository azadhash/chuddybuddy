import { useEffect, useMemo, useRef, useState } from 'react';
import AuthForm from './components/AuthForm.jsx';
import ChatThread from './components/ChatThread.jsx';
import ChatInput from './components/ChatInput.jsx';
import Timeline from './components/Timeline.jsx';
import Dashboard from './components/Dashboard.jsx';
import Journal from './components/Journal.jsx';
import { me, logout, getHistory, chat } from './lib/api.js';
import { deriveEntries } from './lib/timeline.js';

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [view, setView] = useState('chat');
  const sendErrorRef = useRef(null);
  // True when a new turn has been sent since history was last loaded, so the
  // Insights tab knows it must refresh (to pick up timestamps + persisted insight).
  const historyDirty = useRef(false);

  // Timeline entries derive from the conversation; recompute only when it changes.
  const timelineEntries = useMemo(() => deriveEntries(messages), [messages]);

  // Take focus to a send error when it appears (WCAG: errors should receive focus).
  useEffect(() => {
    if (sendError) sendErrorRef.current?.focus?.();
  }, [sendError]);

  async function loadHistory() {
    try {
      const data = await getHistory();
      setMessages(data.messages);
    } catch {
      setMessages([]);
    } finally {
      historyDirty.current = false;
    }
  }

  // On load, check whether we already have a session.
  useEffect(() => {
    let active = true;
    me()
      .then(async (u) => {
        if (!active) return;
        setUser(u);
        if (u) await loadHistory();
      })
      .catch(() => {})
      .finally(() => active && setAuthChecked(true));
    return () => {
      active = false;
    };
  }, []);

  async function handleAuthed(u) {
    setUser(u);
    await loadHistory();
  }

  async function handleSend(text) {
    setSendError('');
    setMessages((prev) => [...prev, { id: uid(), role: 'user', content: text }]);
    setSending(true);
    try {
      const res = await chat(text);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: res.reply,
          emotion: res.emotion,
          intensity: res.intensity,
          triggers: res.triggers,
          distortion: res.distortion,
          intervention: res.intervention,
          crisis: res.crisis,
          helplines: res.helplines,
        },
      ]);
      historyDirty.current = true;
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  // Opening Insights refreshes from the database so the dashboard reflects the
  // user's persisted entries (with timestamps) — but only when a new turn has been
  // sent since the last load, avoiding a redundant fetch on every tab switch.
  async function changeView(next) {
    if (next === 'insights' && historyDirty.current) await loadHistory();
    setView(next);
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setMessages([]);
    setView('chat');
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="app__header">
        <div className="app__brand">
          <h1 className="app__title">
            <span aria-hidden="true">⚓ </span>Anchor
          </h1>
          {user && (
            <div className="app__account">
              <span className="app__email">{user.email}</span>
              <button type="button" className="linkbutton" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>
        <p className="app__tagline">
          A wellness companion you can talk to — it listens between the lines for the hidden trigger
          and the thought pattern, and offers the one exercise that fits.
        </p>
      </header>

      <main className="app__main" id="main" tabIndex={-1}>
        {!authChecked ? (
          <p className="status" role="status">
            Loading…
          </p>
        ) : !user ? (
          <AuthForm onAuthed={handleAuthed} />
        ) : (
          <>
            <nav className="tabs" aria-label="Sections">
              <button
                type="button"
                className="tab"
                aria-current={view === 'chat' ? 'page' : undefined}
                onClick={() => changeView('chat')}
              >
                Talk
              </button>
              <button
                type="button"
                className="tab"
                aria-current={view === 'insights' ? 'page' : undefined}
                onClick={() => changeView('insights')}
              >
                Insights
              </button>
            </nav>

            {view === 'chat' ? (
              <section className="card chat" aria-labelledby="chat-title" aria-busy={sending}>
                <h2 id="chat-title" className="card__title">
                  Talk it through
                </h2>
                <ChatThread messages={messages} loading={sending} />
                <ChatInput onSend={handleSend} loading={sending} />
                {sendError && (
                  <p className="alert" role="alert" tabIndex={-1} ref={sendErrorRef}>
                    <span aria-hidden="true">⚠ </span>
                    {sendError}
                  </p>
                )}
              </section>
            ) : (
              <>
                <section className="card" aria-labelledby="dashboard-title">
                  <h2 id="dashboard-title" className="card__title">
                    Your dashboard
                  </h2>
                  <Dashboard messages={messages} />
                </section>

                <section className="card" aria-labelledby="timeline-title">
                  <h2 id="timeline-title" className="card__title">
                    Your patterns over time
                  </h2>
                  <Timeline entries={timelineEntries} />
                </section>

                <section className="card" aria-labelledby="journal-title">
                  <h2 id="journal-title" className="card__title">
                    Your journal
                  </h2>
                  <Journal messages={messages} />
                </section>
              </>
            )}
          </>
        )}
      </main>

      <footer className="app__footer">
        <p>
          Anchor is a supportive AI companion, not a medical service or a substitute for a
          therapist. If you are struggling, please reach out to a trusted person or a helpline.
        </p>
      </footer>
    </div>
  );
}
