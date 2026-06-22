/** Shared input styling — apply to <input>/<select>/<textarea> for a consistent control vocabulary. */
export const inputClass =
  'w-full rounded-btn border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Labelled form field: associates <label htmlFor> with the control the caller renders (with a matching id). */
export default function Field({ label, htmlFor, hint, error, required, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
