type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'accent';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-muted',
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  info: 'bg-info-bg text-info',
  accent: 'bg-accent text-accent-ink',
};

export default function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
