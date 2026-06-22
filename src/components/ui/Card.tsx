export default function Card({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`rounded-card border border-border bg-surface ${className}`}>
      {children}
    </div>
  );
}
