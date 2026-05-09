import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Bot,
  Send,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Zap,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useExercises,
  useWorkouts,
  useRestDays,
  epley1RM,
  entryTopWeight,
  entryVolume,
} from '@/lib/gym-store';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tag?: 'plateau' | 'good' | 'plan' | 'info';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectTag(text: string): Message['tag'] {
  const lower = text.toLowerCase();
  if (
    lower.includes('plateau') ||
    lower.includes('stuck') ||
    lower.includes('stagnan')
  )
    return 'plateau';
  if (
    lower.includes('bagus') ||
    lower.includes('great') ||
    lower.includes('progress') ||
    lower.includes('naik')
  )
    return 'good';
  if (
    lower.includes('program') ||
    lower.includes('plan') ||
    lower.includes('minggu')
  )
    return 'plan';
  return 'info';
}

function toISODate(d: Date) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}

// ─── Context Builder ──────────────────────────────────────────────────────────

function buildCoachingContext(
  exercises: ReturnType<typeof useExercises>['exercises'],
  workouts: ReturnType<typeof useWorkouts>['workouts'],
  restDays: ReturnType<typeof useRestDays>['restDays']
): string {
  if (exercises.length === 0) return 'User belum punya exercise data.';

  const workoutDateSet = new Set(workouts.map((w) => w.date));
  const restDateSet = new Set(restDays.map((r) => r.date));
  const activeDateSet = new Set([...workoutDateSet, ...restDateSet]);
  let streak = 0;
  const cursor = new Date();
  if (!activeDateSet.has(toISODate(cursor)))
    cursor.setDate(cursor.getDate() - 1);
  while (activeDateSet.has(toISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);
  const sessions30 = workouts.filter(
    (w) => w.date >= toISODate(thirtyAgo)
  ).length;
  const restCount30 = restDays.filter(
    (r) => r.date >= toISODate(thirtyAgo)
  ).length;

  const summaries = exercises.map((ex) => {
    const sessions = workouts
      .filter((w) => w.exerciseId === ex.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    if (sessions.length === 0)
      return `${ex.name} (${ex.muscleGroup}): belum ada sesi`;

    const maxE1RM = sessions.reduce((max, s) => {
      const e = s.sets.reduce(
        (m, set) => Math.max(m, epley1RM(set.weight, set.reps)),
        0
      );
      return Math.max(max, e);
    }, 0);

    const recent = sessions
      .slice(0, 3)
      .map(
        (s) =>
          `${s.date}: ${entryTopWeight(s)}kg×${s.sets.reduce((m, set) => m + set.reps, 0)}reps`
      )
      .join(' | ');

    const tops = sessions.slice(0, 3).map(entryTopWeight);
    const plateau = tops.length >= 3 && tops.every((w) => w === tops[0]);

    return `${ex.name} (${ex.muscleGroup}): e1RM ~${maxE1RM.toFixed(1)}kg${plateau ? ' ⚠️ PLATEAU' : ''}. Recent → ${recent}`;
  });

  const oneWeekAgo = toISODate(
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    })()
  );
  const twoWeeksAgo = toISODate(
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 14);
      return d;
    })()
  );
  const volNow = workouts
    .filter((w) => w.date >= oneWeekAgo)
    .reduce((m, w) => m + entryVolume(w), 0);
  const volPrev = workouts
    .filter((w) => w.date >= twoWeeksAgo && w.date < oneWeekAgo)
    .reduce((m, w) => m + entryVolume(w), 0);
  const delta =
    volPrev > 0 ? `${(((volNow - volPrev) / volPrev) * 100).toFixed(0)}%` : '—';

  const latestRest = restDays
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const restInsight = latestRest
    ? `${latestRest.date}${latestRest.note ? ` (${latestRest.note})` : ''}`
    : 'belum ada rest day tercatat';

  return `
=== DATA LATIHAN USER ===
Streak: ${streak} hari (workout/rest) | Sesi 30 hari: ${sessions30} | Rest 30 hari: ${restCount30} | Volume minggu ini: ${volNow.toLocaleString()}kg (${delta !== '—' ? delta + ' vs minggu lalu' : 'no prev data'})
Last rest day: ${restInsight}

=== PER EXERCISE ===
${summaries.join('\n')}
`.trim();
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Analisis progress aku secara keseluruhan',
  'Exercise mana yang lagi plateau?',
  'Program latihan minggu depan gimana?',
  'Volume aku udah optimal belum?',
  'Kapan waktu yang tepat buat deload?',
];

const TAG_CONFIG = {
  plateau: {
    label: 'Plateau Detected',
    icon: AlertTriangle,
    className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  },
  good: {
    label: 'Good Progress',
    icon: TrendingUp,
    className: 'bg-green-500/10 text-green-400 border border-green-500/20',
  },
  plan: {
    label: 'Action Plan',
    icon: Lightbulb,
    className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  },
  info: {
    label: 'Insight',
    icon: Zap,
    className: 'bg-primary/10 text-primary border border-primary/20',
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function AICoach() {
  const { exercises } = useExercises();
  const { workouts } = useWorkouts();
  const { restDays } = useRestDays();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);

  const coachingContext = useMemo(
    () => buildCoachingContext(exercises, workouts, restDays),
    [exercises, workouts, restDays]
  );

  const systemPrompt = useMemo(
    () => `Kamu adalah AI coach gym personal di aplikasi MyGymPal.

${coachingContext}

INSTRUKSI:
- Selalu referensikan data spesifik user (tanggal, weight, reps, nama exercise)
- Kalau ada ⚠️ PLATEAU, wajib berikan solusi teknis konkret
- Bahasa: santai Indonesia/Inggris campur, bukan formal
- Response padat, max 4 paragraf. Gunakan **bold** untuk angka penting
- Hindari saran generik tanpa konteks data`,
    [coachingContext]
  );

  useEffect(() => {
    if (exercises.length > 0 && messages.length === 0) {
      const plateauCount = exercises.filter((ex) => {
        const tops = workouts
          .filter((w) => w.exerciseId === ex.id)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 3)
          .map(entryTopWeight);
        return tops.length >= 3 && tops.every((t) => t === tops[0]);
      }).length;

      const hasRecentRest = restDays.some((r) => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return r.date >= toISODate(d);
      });

      const text =
        plateauCount > 0
          ? `Yo! Gue udah review data latihan lo. Ada **${plateauCount} exercise** yang kayaknya lagi plateau — kita perlu address itu. Tanya gue apa aja!`
          : hasRecentRest
            ? `Yo! Data latihan + recovery lo udah gue load. Progress keliatan solid dan rest pattern juga kebaca — gue siap bantu optimize lebih lanjut. Mau analisis exercise, minta program, atau tanya apapun?`
            : `Yo! Data latihan lo udah gue load. Progress keliatan solid — gue siap bantu optimize lebih lanjut. Mau analisis exercise, minta program, atau tanya apapun?`;

      setMessages([
        {
          role: 'assistant',
          content: text,
          tag: plateauCount > 0 ? 'plateau' : 'good',
        },
      ]);
    }
  }, [exercises, workouts, restDays, chatKey]); // FIX #3: chatKey in deps

  const handleSend = async (text?: string) => {
    const userText = (text ?? input).trim();

    if (!userText || loading) return;

    setInput('');
    setError(null);
    setLoading(true);

    const userMsg: Message = { role: 'user', content: userText };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            system: systemPrompt,
            messages: [...messages, userMsg]
              .filter((m) => m.content !== 'No response.')
              .map(({ role, content }) => ({ role, content })),
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const data = await res.json();

      const replyText = data.content?.[0]?.text;

      if (!replyText) {
        throw new Error('Gagal dapet respon dari Coach. Coba lagi, bro.');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: replyText, tag: detectTag(replyText) },
      ]);
    } catch (err: any) {
      console.error('Coaching Error:', err);
      setError(err.message || 'Terjadi kesalahan, coba lagi.');
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Coach
          </h2>
          <p className="text-sm text-muted-foreground">
            Powered by GROQ · Analysis based on your training data
          </p>
        </div>
        {messages.length > 1 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setMessages([]);
              setError(null);
              setChatKey((k) => k + 1);
            }}
            className="gap-1.5 self-start sm:self-auto"
          >
            <X className="h-4 w-4" /> Reset Chat
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            disabled={loading}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95',
              'bg-secondary/40 border-border/60 text-foreground/80 hover:border-primary/50 hover:text-foreground',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <Card className="surface border-border/60 overflow-hidden">
        <div className="h-[420px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full grid place-items-center text-center">
              <div>
                <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {exercises.length === 0
                    ? 'Add exercise first in Library.'
                    : 'Loading your training data...'}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-3',
                msg.role === 'user' && 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'h-7 w-7 rounded-lg grid place-items-center shrink-0 mt-0.5 text-xs font-bold',
                  msg.role === 'assistant'
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {msg.role === 'assistant' ? 'AI' : 'U'}
              </div>
              <div
                className={cn(
                  'max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-secondary/40 border border-border/60 rounded-tl-sm'
                    : 'bg-foreground text-background rounded-tr-sm font-medium'
                )}
              >
                {msg.role === 'assistant' &&
                  msg.tag &&
                  (() => {
                    const cfg = TAG_CONFIG[msg.tag];
                    const Icon = cfg.icon;
                    return (
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded mb-2',
                          cfg.className
                        )}
                      >
                        <Icon className="h-2.5 w-2.5" />
                        {cfg.label}
                      </div>
                    );
                  })()}
                <p className={msg.role === 'user' ? '' : 'text-foreground/90'}>
                  {msg.role === 'assistant'
                    ? renderContent(msg.content)
                    : msg.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-lg grid place-items-center shrink-0 bg-foreground text-background text-xs font-bold">
                AI
              </div>
              <div className="bg-secondary/40 border border-border/60 rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-2 items-start p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask your coach..."
            disabled={loading}
            className="h-11 border-border/60"
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 glow-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center font-mono">
        AI Coach membaca data real dari exercise library, workout history, dan
        rest days kamu
      </p>
    </div>
  );
}
