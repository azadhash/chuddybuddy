import { useEffect, useRef, useState } from 'react';
import JournalForm from './components/JournalForm.jsx';
import Analysis from './components/Analysis.jsx';
import CrisisPanel from './components/CrisisPanel.jsx';
import Timeline from './components/Timeline.jsx';
import { analyzeEntry } from './lib/api.js';
import { loadEntries, saveEntry } from './lib/storage.js';

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState(() => loadEntries());

  const resultsRef = useRef(null);
  const crisisRef = useRef(null);

  // Move focus to the new result (or to the crisis panel) so keyboard and screen
  // reader users land on the freshly announced content.
  useEffect(() => {
    if (!analysis) return;
    const target = analysis.crisis?.flag ? crisisRef.current : resultsRef.current;
    target?.focus();
  }, [analysis]);

  async function handleSubmit(entry) {
    setLoading(true);
    setError('');
    try {
      const result = await analyzeEntry(entry);
      setAnalysis(result);
      setEntries(saveEntry(result));
    } catch (err) {
      setError(err.message);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }

  const showCrisis = analysis?.crisis?.flag;

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">
          <span aria-hidden="true">⚓ </span>Anchor
        </h1>
        <p className="app__tagline">
          A wellness companion that reads between the lines of your journal — finding the hidden
          trigger, naming the thought pattern, and matching the one exercise that fits.
        </p>
      </header>

      <main className="app__main">
        <section className="card" aria-labelledby="journal-title">
          <h2 id="journal-title" className="card__title">
            Today&rsquo;s check-in
          </h2>
          <JournalForm onSubmit={handleSubmit} loading={loading} error={error} />
        </section>

        {showCrisis && (
          <div ref={crisisRef} tabIndex={-1}>
            <CrisisPanel helplines={analysis.helplines} />
          </div>
        )}

        {analysis && (
          <section
            className="card"
            aria-labelledby="results-title"
            ref={resultsRef}
            tabIndex={-1}
          >
            <h2 id="results-title" className="card__title">
              What Anchor noticed
            </h2>
            <Analysis analysis={analysis} />
          </section>
        )}

        <section className="card" aria-labelledby="timeline-title">
          <h2 id="timeline-title" className="card__title">
            Your patterns over time
          </h2>
          <Timeline entries={entries} />
        </section>
      </main>

      <footer className="app__footer">
        <p>
          Anchor is a supportive AI companion, not a medical service or a substitute for a therapist.
          If you are struggling, please reach out to a trusted person or a helpline.
        </p>
      </footer>
    </div>
  );
}
