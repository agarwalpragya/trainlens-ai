import { useRef, useState } from 'react';
import { sampleRuns } from '../data/sampleRuns';
import { validateTrainingRun } from '../utils/validateTrainingRun';
import type { AnalyzeRequest } from '../types/analysis';

type Mode = 'sample' | 'upload';

interface Props {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  selectedKey: string;
  onSelectedKeyChange: (key: string) => void;
  uploadedFileName: string | null;
  onUpload: (payload: AnalyzeRequest, fileName: string) => void;
  onUploadClear: () => void;
  loading: boolean;
}

export function DataSourceCard({
  mode,
  onModeChange,
  selectedKey,
  onSelectedKeyChange,
  uploadedFileName,
  onUpload,
  onUploadClear,
  loading,
}: Props) {
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleModeTab(newMode: Mode) {
    if (newMode === mode) return;
    setParseError(null);
    if (inputRef.current) inputRef.current.value = '';
    onModeChange(newMode);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const result = validateTrainingRun(raw);
        if (result.valid) {
          onUpload(result.payload, file.name);
        } else {
          setParseError(result.error);
          if (inputRef.current) inputRef.current.value = '';
        }
      } catch {
        setParseError('Could not parse file. Make sure it is valid JSON.');
        if (inputRef.current) inputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }

  function handleClear() {
    setParseError(null);
    if (inputRef.current) inputRef.current.value = '';
    onUploadClear();
  }

  return (
    <div className="card">
      <div className="card-title">Data source</div>

      <div className="source-tabs">
        <button
          type="button"
          className={`source-tab${mode === 'sample' ? ' active' : ''}`}
          onClick={() => handleModeTab('sample')}
          disabled={loading}
        >
          Sample run
        </button>
        <button
          type="button"
          className={`source-tab${mode === 'upload' ? ' active' : ''}`}
          onClick={() => handleModeTab('upload')}
          disabled={loading}
        >
          Upload JSON
        </button>
      </div>

      {mode === 'sample' && (
        <div className="source-panel">
          <p className="selector-helper">
            Choose a sample training run to diagnose. TrainLens will analyze it for anomalies and prepare an explanation.
          </p>
          <select
            value={selectedKey}
            onChange={(e) => onSelectedKeyChange(e.target.value)}
            disabled={loading}
          >
            {sampleRuns.map((run) => (
              <option key={run.key} value={run.key}>
                {run.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'upload' && (
        <div className="source-panel">
          <p className="selector-helper">
            Use your own run in the same format as the sample logs. JSON must include{' '}
            <code>run_name</code> and a <code>metrics</code> array where every step has at least{' '}
            <code>step</code> and <code>train_loss</code>.
          </p>

          {uploadedFileName ? (
            <div className="upload-active">
              <div className="upload-active-name">
                <span className="upload-check">✓</span>
                <span className="upload-filename">{uploadedFileName}</span>
              </div>
              <button className="btn-clear-upload" type="button" onClick={handleClear}>
                Clear
              </button>
            </div>
          ) : (
            <div className="upload-trigger">
              <input
                ref={inputRef}
                id="json-upload-input"
                type="file"
                accept=".json"
                className="upload-input-hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="json-upload-input" className="btn-upload">
                Choose JSON file
              </label>
              <span className="upload-hint">.json files only</span>
            </div>
          )}

          {parseError && <p className="upload-error">{parseError}</p>}
        </div>
      )}
    </div>
  );
}
