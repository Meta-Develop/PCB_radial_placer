import type { ValidationResult } from '../types';

interface ValidationPanelProps {
  validation: ValidationResult;
}

export function ValidationPanel({ validation }: ValidationPanelProps) {
  if (validation.messages.length === 0) {
    return <p className="validation-ok">Inputs are valid.</p>;
  }

  return (
    <div className="validation-list" role="status" aria-live="polite">
      {validation.messages.map((message, index) => (
        <p className={`validation-message ${message.severity}`} key={`${message.field ?? 'global'}-${index}`}>
          <strong>{message.severity === 'error' ? 'Error' : 'Warning'}:</strong> {message.message}
        </p>
      ))}
    </div>
  );
}
