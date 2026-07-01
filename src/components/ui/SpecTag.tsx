export function SpecTag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`spec-tag ${className}`}>{children}</span>;
}
