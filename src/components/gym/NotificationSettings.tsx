import { useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  getPrefs,
  getPermission,
  requestPermission,
  applyPrefs,
  type NotifPrefs,
} from '@/lib/notifications';

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotifPrefs>(getPrefs);
  const [permission, setPermission] = useState(getPermission);

  // Don't render if browser doesn't support notifications
  if (permission === 'unsupported') return null;

  const timeValue = `${String(prefs.hour).padStart(2, '0')}:${String(prefs.minute).padStart(2, '0')}`;

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      const perm = await requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error('Notifikasi diblokir', {
          description:
            'Aktifkan notifikasi di pengaturan browser kamu, lalu coba lagi.',
        });
        return;
      }
    }

    const newPrefs: NotifPrefs = { ...prefs, enabled };
    setPrefs(newPrefs);
    await applyPrefs(newPrefs);

    if (enabled) {
      toast.success('Reminder aktif 🔔', {
        description: `Kamu akan diingatkan tiap hari pukul ${timeValue}.`,
      });
    } else {
      toast.success('Reminder dimatikan');
    }
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(':').map(Number);
    const newPrefs: NotifPrefs = { ...prefs, hour: h, minute: m };
    setPrefs(newPrefs);
    await applyPrefs(newPrefs);
    toast.success(`Reminder diatur ke ${e.target.value} ✅`);
  };

  const isBlocked = permission === 'denied';

  return (
    <Card className="surface border-border/60 p-4 sm:p-5">
      {/* Header label */}
      <div className="text-primary mb-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] uppercase">
        <BellRing className="h-3.5 w-3.5" />
        Workout Reminder
      </div>

      {/* Toggle row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {prefs.enabled && !isBlocked ? (
            <div className="border-border/60 bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
              <Bell className="text-primary h-4 w-4" />
            </div>
          ) : (
            <div className="border-border/60 bg-secondary/40 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
              <BellOff className="text-muted-foreground h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {prefs.enabled && !isBlocked
                ? `Aktif · Tiap hari ${timeValue}`
                : 'Aktifkan pengingat harian'}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {isBlocked
                ? '⚠️ Permission diblokir — buka pengaturan browser'
                : 'Notifikasi push supaya gak skip workout'}
            </p>
          </div>
        </div>

        <Switch
          checked={prefs.enabled}
          onCheckedChange={handleToggle}
          disabled={isBlocked}
          className="shrink-0"
        />
      </div>

      {/* Time picker — only shown when enabled */}
      {prefs.enabled && !isBlocked && (
        <div className="border-border/60 mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
          <Label
            htmlFor="reminder-time"
            className="text-muted-foreground text-xs"
          >
            Jam pengingat
          </Label>
          <input
            id="reminder-time"
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="border-border/60 bg-secondary/40 text-foreground focus:ring-primary rounded-lg border px-3 py-1.5 font-mono text-sm outline-none focus:ring-2"
          />
          <p className="text-muted-foreground font-mono text-[10px]">
            Notifikasi dikirim tiap hari pada jam ini
          </p>
        </div>
      )}

      {/* Blocked state hint */}
      {isBlocked && (
        <div className="border-border/60 mt-4 rounded-lg border bg-yellow-500/5 p-3">
          <p className="text-xs text-yellow-400">
            Permission notifikasi sudah diblokir. Buka{' '}
            <strong>Settings → Site Settings → Notifications</strong> di browser
            dan aktifkan untuk situs ini.
          </p>
        </div>
      )}
    </Card>
  );
}
