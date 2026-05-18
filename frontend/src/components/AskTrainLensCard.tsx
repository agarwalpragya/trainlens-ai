import { useState } from 'react';
import { askQuestion } from '../api/trainlensApi';
import type { AnalyzeResponse } from '../types/analysis';

const SUGGESTED_QUESTIONS = [
  'Explain this simply',
  'What should I try first?',
  'Is this model or resource related?',
  'What evidence supports this?',
  'How would I explain this to my team?',
];

interface Props {
  result: AnalyzeResponse;
}

export function AskTrainLensCard({ result }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const data = await askQuestion({ question: trimmed, analysis: result });
      setAnswer(data.answer);
    } catch {
      setError('Could not reach the backend. Make sure the API server is running.');
    } finally {
      setLoading(false);
    }
  }

  function handleChipClick(q: string) {
    setQuestion(q);
    handleAsk(q);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAsk(question);
  }

  return (
    <div className="ask-mentor-card">
      <div className="ask-mentor-header">
        <p className="ask-mentor-title">Ask TrainLens</p>
        <p className="ask-mentor-subtitle">Ask follow-up questions grounded in this run's metrics and diagnosis.</p>
      </div>

      <div className="ask-chips">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            className="ask-chip"
            onClick={() => handleChipClick(q)}
            disabled={loading}
            type="button"
          >
            {q}
          </button>
        ))}
      </div>

      <form className="ask-input-row" onSubmit={handleSubmit}>
        <input
          className="ask-input"
          type="text"
          placeholder="Ask a follow-up question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          aria-label="Follow-up question"
        />
        <button
          className="btn-ask"
          type="submit"
          disabled={loading || !question.trim()}
        >
          {loading ? 'Asking…' : 'Ask'}
        </button>
      </form>

      {loading && (
        <div className="ask-loading">
          <span className="spinner" />
          Generating answer…
        </div>
      )}

      {error && (
        <div className="ask-error">{error}</div>
      )}

      {answer && !loading && (
        <div className="ask-answer">
          <span className="ask-answer-label">Answer</span>
          <p className="ask-answer-text">{answer}</p>
        </div>
      )}
    </div>
  );
}
