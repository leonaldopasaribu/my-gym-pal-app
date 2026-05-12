import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Loading({
  label,
  className,
  size = 'md',
  fullPage,
}: LoadingProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        className
      )}
    >
      <Loader2 className={cn('animate-spin text-primary', SIZES[size])} />
      {label && (
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="grid min-h-[100vh] place-items-center">{content}</div>
    );
  }
  return content;
}
