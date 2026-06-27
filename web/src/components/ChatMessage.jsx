import InsightChips from './InsightChips.jsx';
import Exercise from './Exercise.jsx';
import CrisisPanel from './CrisisPanel.jsx';

// One turn in the conversation. User turns are a plain bubble. Assistant turns
// render the reply bubble plus, when present, the inline insight chips, the
// matched exercise, and the crisis panel.
export default function ChatMessage({ turn }) {
  const isUser = turn.role === 'user';

  if (isUser) {
    return (
      <div className="msg msg--user">
        <div className="bubble bubble--user">{turn.content}</div>
      </div>
    );
  }

  return (
    <div className="msg msg--assistant">
      <div className="bubble bubble--assistant">{turn.content}</div>
      <InsightChips triggers={turn.triggers} distortion={turn.distortion} />
      {turn.intervention && <Exercise intervention={turn.intervention} />}
      {turn.crisis?.flag && <CrisisPanel helplines={turn.helplines} />}
    </div>
  );
}
