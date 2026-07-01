import { SpecTag } from "./SpecTag";

export function SpecRail({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  return (
    <div className={`spec-rail ${className}`} role="list">
      {items.map((it) => (
        <SpecTag key={it}>{it}</SpecTag>
      ))}
    </div>
  );
}
