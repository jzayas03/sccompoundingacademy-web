export function SloganLockup({
  roman,
  italic,
  className = "",
}: {
  roman: string;
  italic: string;
  className?: string;
}) {
  return (
    <p className={`slogan-lockup ${className}`}>
      {roman} <em>{italic}</em>
    </p>
  );
}
