import { ShieldCheck } from 'lucide-react';

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border/60 text-muted-foreground mt-10 border-t pt-6 text-center font-mono text-[11px] sm:mt-16">
      <p className="flex items-center justify-center gap-1.5">
        MY GYM PAL © {year}
      </p>
      <p className="mt-1">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your data is securely stored in the cloud
        </span>
      </p>
    </footer>
  );
}
