interface StatBadgeProps {
  value: string;
  label: string;
}

export function StatBadge({ value, label }: StatBadgeProps) {
  return (
    <div className="text-left">
      <div className="font-display text-3xl text-foreground">{value}</div>
      <div className="text-[13px] text-muted-foreground">{label}</div>
    </div>
  );
}
