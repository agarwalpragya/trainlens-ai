import type { Diagnosis } from '../types/analysis';

interface Props {
  diagnosis: Diagnosis;
}

export function DiagnosisPanel({ diagnosis }: Props) {
  const { headline, root_cause, explanation, remediation_steps } = diagnosis;
  const isHealthy = remediation_steps.length === 0;

  return (
    <div className="card">
      <div className="card-title">Diagnosis</div>

      {isHealthy ? (
        <>
          <div className="healthy-note">
            <span className="healthy-dot" />
            {headline}
          </div>

          <div className="diagnosis-section" style={{ marginTop: '14px' }}>
            <div className="diagnosis-label">Root cause</div>
            <p className="diagnosis-text">{root_cause}</p>
          </div>

          <div className="diagnosis-section">
            <div className="diagnosis-label">Explanation</div>
            <p className="diagnosis-text">{explanation}</p>
          </div>
        </>
      ) : (
        <>
          <p className="diagnosis-headline">{headline}</p>

          <div className="diagnosis-section">
            <div className="diagnosis-label">Root cause</div>
            <p className="diagnosis-text">{root_cause}</p>
          </div>

          <div className="diagnosis-section">
            <div className="diagnosis-label">Explanation</div>
            <p className="diagnosis-text">{explanation}</p>
          </div>

          <div className="diagnosis-section">
            <div className="diagnosis-label">Remediation steps</div>
            <ol className="remediation-list">
              {remediation_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
