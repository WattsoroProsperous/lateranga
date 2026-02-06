import type { LucideIcon } from "lucide-react";

interface ContactItemProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}

export function ContactItem({ icon: Icon, label, value }: ContactItemProps) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">
          {label}
        </div>
        <div className="font-semibold text-sm text-neutral-100">{value}</div>
      </div>
    </div>
  );
}
