import type { ValidationResult } from '../types';
import type { Language, UiText } from '../i18n';
import { translateValidationMessage } from '../i18n';

interface ValidationPanelProps {
  validation: ValidationResult;
  language: Language;
  text: UiText['validation'];
}

export function ValidationPanel({ validation, language, text }: ValidationPanelProps) {
  if (validation.messages.length === 0) {
    return <p className="validation-ok">{text.ok}</p>;
  }

  return (
    <div className="validation-list" role="status" aria-live="polite">
      {validation.messages.map((message, index) => (
        <p className={`validation-message ${message.severity}`} key={`${message.field ?? 'global'}-${index}`}>
          <strong>{message.severity === 'error' ? text.error : text.warning}:</strong>{' '}
          {translateValidationMessage(message, language)}
        </p>
      ))}
    </div>
  );
}
