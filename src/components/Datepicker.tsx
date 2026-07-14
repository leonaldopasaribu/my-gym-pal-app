import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { cn, Utils } from '@/lib/utils';

export function DatePicker({
  value,
  onChange,
  isMobile,
  open,
  setOpen,
}: {
  value: string;
  onChange: (iso: string) => void;
  isMobile: boolean;
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  const presets = [
    { label: 'Today', iso: Utils.shiftDays(0) },
    { label: 'Yesterday', iso: Utils.shiftDays(-1) },
    { label: '2 days ago', iso: Utils.shiftDays(-2) },
    { label: '3 days ago', iso: Utils.shiftDays(-3) },
  ];

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className="border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/40 h-12 w-full justify-start gap-2 text-left font-normal"
    >
      <CalendarIcon className="text-primary h-4 w-4 shrink-0" />
      <span className="truncate capitalize">{Utils.formatDateID(value)}</span>
    </Button>
  );

  const calendar = (
    <Calendar
      mode="single"
      selected={Utils.isoToDate(value)}
      onSelect={(d) => {
        if (d) {
          onChange(Utils.dateToISO(d));
          setOpen(false);
        }
      }}
      disabled={(d) => d > new Date()}
      className={cn('pointer-events-auto p-3')}
    />
  );

  const presetChips = (
    <div className="flex flex-wrap gap-2 px-3 pb-3">
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => {
            onChange(p.iso);
            setOpen(false);
          }}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95',
            value === p.iso
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/60 bg-secondary/40 hover:border-primary/50'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Pick a date</DrawerTitle>
          </DrawerHeader>
          {presetChips}
          <div className="flex justify-center">{calendar}</div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {presetChips}
        {calendar}
      </PopoverContent>
    </Popover>
  );
}
