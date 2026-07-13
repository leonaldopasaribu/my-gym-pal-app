import { Card } from '@/components/ui/card';

export default function StatCard({
  label,
  value,
  accent,
  direction,
  footer,
}: {
  label: string;
  value: string;
  accent?: boolean;
  direction?: 'up' | 'down' | 'flat' | 'new';
  footer?: React.ReactNode;
}) {
  const colorClass =
    direction === 'up'
      ? 'text-emerald-400'
      : direction === 'down'
        ? 'text-red-400'
        : direction === 'new'
          ? 'text-primary'
          : '';

  return (
    <Card
      className={`surface border-border/60 p-4 ${accent ? 'border-primary/40' : ''}`}
    >
      <div className="text-muted-foreground text-[11px] tracking-widest uppercase">
        {label}
      </div>
      <div
        className={`font-display mt-1 text-xl leading-tight font-bold ${accent ? colorClass || 'text-gradient-primary' : ''}`}
      >
        {value}
      </div>
      {footer}
    </Card>
  );
}
