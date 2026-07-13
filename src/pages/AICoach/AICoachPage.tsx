import { useEffect, useState, useMemo } from 'react';
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
  entryTotalDistance,
  entryTotalDuration,
} from '@/lib/gym-store';
import { WorkoutUtil } from '@/lib/workout-util';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tag?: 'plateau' | 'good' | 'plan' | 'info';
}

// ─── Plateau Detection Helpers ────────────────────────────────────────────────

/**
 * Simple linear regression — returns slope (units per index).
 * Positive = improving, negative = declining, ~0 = flat/plateau.
 */
function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Filter sessions within the last N days.
 */
function withinDays(
  sessions: { date: string }[],
  days: number
): typeof sessions {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = toISODate(cutoff);
  return sessions.filter((s) => s.date >= cutoffStr);
}

/**
 * Strength plateau detection.
 *
 * Rules:
 * - Need at least 4 sessions within the last 21 days (3 weeks)
 * - Uses best e1RM per session (not raw top weight)
 * - Plateau = e1RM slope < +0.3 kg per session AND no single session
 *   achieved a new all-time e1RM in the window
 *
 * Returns { plateau: boolean; reason: string }
 */
function detectStrengthPlateau(
  sessions: ReturnType<typeof useWorkouts>['workouts']
): { plateau: boolean; reason: string } {
  const recent = withinDays(sessions, 21)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date)) // oldest → newest
    .slice(-8); // cap at last 8 sessions

  if (recent.length < 4)
    return {
      plateau: false,
      reason: 'not enough data (need ≥4 sessions / 21 days)',
    };

  // Best e1RM per session
  const e1RMs = recent.map((s: any) =>
    s.sets.reduce((m, set) => Math.max(m, epley1RM(set.weight, set.reps)), 0)
  );

  const slope = linearRegressionSlope(e1RMs);

  // Check if there's a new all-time e1RM in this window vs the overall history
  const overallBestE1RM = sessions
    .filter((s: any) => !recent.includes(s))
    .flatMap((s) => s.sets.map((set) => epley1RM(set.weight, set.reps)))
    .reduce((m, v) => Math.max(m, v), 0);

  const windowBestE1RM = Math.max(...e1RMs);
  const hasNewPR = windowBestE1RM > overallBestE1RM * 1.005; // 0.5% buffer for rounding

  if (hasNewPR) return { plateau: false, reason: 'new PR achieved in window' };

  // Coefficient of variation — if values are very flat relative to their mean
  const mean = e1RMs.reduce((a, b) => a + b, 0) / e1RMs.length;
  const cv =
    mean > 0
      ? Math.sqrt(
          e1RMs.reduce((a, b) => a + (b - mean) ** 2, 0) / e1RMs.length
        ) / mean
      : 0;

  // Plateau if: slope is low AND values are flat (CV < 3%)
  const plateau = slope < 0.3 && cv < 0.03;
  const reason = plateau
    ? `e1RM slope=${slope.toFixed(2)} kg/session, CV=${(cv * 100).toFixed(1)}%`
    : `slope=${slope.toFixed(2)} kg/session (progressing)`;

  return { plateau, reason };
}

/**
 * Cardio plateau detection.
 *
 * Rules:
 * - Need at least 3 sessions within the last 21 days
 * - Prefers pace (min/km) trend if distance is available; falls back to duration trend
 * - Plateau = pace slope < 0.005 min/km improvement per session
 *   OR duration slope < 1 min/session (if no distance data)
 *
 * Lower pace = faster = better, so we negate pace values for the slope.
 */
function detectCardioPlateau(
  sessions: ReturnType<typeof useWorkouts>['workouts']
): { plateau: boolean; reason: string } {
  const recent = withinDays(sessions, 21)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-6);

  if (recent.length < 3)
    return {
      plateau: false,
      reason: 'not enough data (need ≥3 sessions / 21 days)',
    };

  // Try pace-based detection
  const paceData = recent
    .map((s: any) => {
      const dur = entryTotalDuration(s);
      const dist = entryTotalDistance(s);
      if (dist > 0.1 && dur > 0) return dur / dist; // min/km, lower = faster
      return null;
    })
    .filter((v): v is number => v !== null);

  if (paceData.length >= 3) {
    // Negate so "improvement" = positive slope
    const slope = linearRegressionSlope(paceData.map((v) => -v));
    const plateau = slope < 0.005; // less than 0.005 min/km improvement per session
    return {
      plateau,
      reason: plateau
        ? `pace slope=${slope.toFixed(4)} min/km/session (flat)`
        : `pace improving at ${slope.toFixed(4)} min/km/session`,
    };
  }

  // Fallback: duration trend
  const durations = recent.map(entryTotalDuration);
  const slope = linearRegressionSlope(durations);
  const plateau = slope < 1; // less than 1 min improvement per session
  return {
    plateau,
    reason: plateau
      ? `duration slope=${slope.toFixed(2)} min/session (flat)`
      : `duration growing at ${slope.toFixed(2)} min/session`,
  };
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

  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));

  const strengthWorkouts = workouts.filter((w) => {
    const ex = exMap[w.exerciseId];
    return ex && !WorkoutUtil.isCardioGroup(ex.muscleGroup);
  });
  const cardioWorkouts = workouts.filter((w) => {
    const ex = exMap[w.exerciseId];
    return ex && WorkoutUtil.isCardioGroup(ex.muscleGroup);
  });

  const volNow = strengthWorkouts
    .filter((w) => w.date >= oneWeekAgo)
    .reduce((m, w) => m + entryVolume(w), 0);
  const volPrev = strengthWorkouts
    .filter((w) => w.date >= twoWeeksAgo && w.date < oneWeekAgo)
    .reduce((m, w) => m + entryVolume(w), 0);
  const delta =
    volPrev > 0 ? `${(((volNow - volPrev) / volPrev) * 100).toFixed(0)}%` : '—';

  const cardioNow = cardioWorkouts.filter((w) => w.date >= oneWeekAgo);
  const totalCardioMin = cardioNow.reduce(
    (m, w) => m + entryTotalDuration(w),
    0
  );
  const totalCardioDist = cardioNow.reduce(
    (m, w) => m + entryTotalDistance(w),
    0
  );
  const cardioSummary =
    cardioNow.length > 0
      ? `Cardio 7 hari: ${cardioNow.length} sesi, ${totalCardioMin}min${totalCardioDist > 0 ? `, ${totalCardioDist.toFixed(1)}km` : ''}`
      : 'Cardio 7 hari: tidak ada sesi';

  // Per-exercise summaries with improved plateau detection
  const summaries = exercises.map((ex) => {
    const sessions = workouts
      .filter((w) => w.exerciseId === ex.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (sessions.length === 0)
      return `${ex.name} (${ex.muscleGroup}): belum ada sesi`;

    const isCardio = WorkoutUtil.isCardioGroup(ex.muscleGroup);

    if (isCardio) {
      const { plateau, reason } = detectCardioPlateau(sessions);

      const recent = sessions
        .slice(0, 3)
        .map((s) => {
          const dur = entryTotalDuration(s);
          const dist = entryTotalDistance(s);
          const pace = dist > 0 ? WorkoutUtil.formatPace(dur, dist) : null;
          return `${s.date}: ${dur}min${dist > 0 ? ` ${dist}km` : ''}${pace ? ` @${pace}` : ''}`;
        })
        .join(' | ');

      return `${ex.name} (${ex.muscleGroup}): ${plateau ? `⚠️ PLATEAU (${reason}) ` : '✅ progressing '}Recent → ${recent}`;
    }

    // Strength
    const { plateau, reason } = detectStrengthPlateau(sessions);

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
          `${s.date}: ${entryTopWeight(s)}kg×${s.sets.reduce((m, set) => m + set.reps, 0)}reps (e1RM ~${s.sets.reduce((m, set) => Math.max(m, epley1RM(set.weight, set.reps)), 0).toFixed(1)}kg)`
      )
      .join(' | ');

    return `${ex.name} (${ex.muscleGroup}): all-time e1RM ~${maxE1RM.toFixed(1)}kg${plateau ? ` ⚠️ PLATEAU (${reason})` : ' ✅ progressing'}. Recent → ${recent}`;
  });

  const latestRest = restDays
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const restInsight = latestRest
    ? `${latestRest.date}${latestRest.note ? ` (${latestRest.note})` : ''}`
    : 'belum ada rest day tercatat';

  return `
=== DATA LATIHAN USER ===
Streak: ${streak} hari (workout/rest) | Sesi 30 hari: ${sessions30} | Rest 30 hari: ${restCount30}
Strength volume minggu ini: ${volNow.toLocaleString()}kg (${delta !== '—' ? delta + ' vs minggu lalu' : 'no prev data'})
${cardioSummary}
Last rest day: ${restInsight}

=== PER EXERCISE (plateau = e1RM regression < 0.3kg/session over 21d for strength, min 4 sessions; pace regression < 0.005 min/km/session over 21d for cardio, min 3 sessions) ===
${summaries.join('\n')}
`.trim();
}

// ─── Plateau Counter (for greeting message) ───────────────────────────────────

function countPlateaus(
  exercises: ReturnType<typeof useExercises>['exercises'],
  workouts: ReturnType<typeof useWorkouts>['workouts']
): number {
  return exercises.filter((ex) => {
    const isCardio = WorkoutUtil.isCardioGroup(ex.muscleGroup);
    const sessions = workouts
      .filter((w) => w.exerciseId === ex.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (isCardio) return detectCardioPlateau(sessions).plateau;
    return detectStrengthPlateau(sessions).plateau;
  }).length;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Analisis progress aku secara keseluruhan',
  'Exercise mana yang lagi plateau?',
  'Program latihan minggu depan gimana?',
  'Volume aku udah optimal belum?',
  'Kapan waktu yang tepat buat deload?',
  'Gimana cara improve pace cardio aku?',
  'Cardio vs strength, balance aku udah bener?',
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

export function AICoachPage() {
  const { exercises } = useExercises();
  const { workouts } = useWorkouts();
  const { restDays } = useRestDays();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);

  const coachingContext = useMemo(
    () => buildCoachingContext(exercises, workouts, restDays),
    [exercises, workouts, restDays]
  );

  const systemPrompt = useMemo(
    () => `Kamu adalah Coach — AI gym partner personal di MyGymPal. Bukan personal trainer korporat yang baca script, tapi temen yang udah nemenin user dari hari pertama mereka angkat beban, tau persis history latihan mereka, dan genuinely peduli sama progress mereka.

    Expertise lo: progressive overload, periodisasi, recovery optimization, cardio programming, dan baca pola data latihan.

    ---

    ## Data User
    ${coachingContext}

    ---

    ## Cara Lo Ngobrol

    Lo ngobrol kayak temen deket yang kebetulan jago gym — campur Indonesia-Inggris, to the point, dan gak pernah kasih saran yang bisa berlaku buat siapa aja. Setiap respons lo harus berasa personal karena lo beneran lihat datanya.

    **Sebelum kasih saran apapun, baca datanya dulu.** Sebut angka spesifik, tanggal, nama exercise, atau tren yang lo lihat. Kalau lo cuma bilang "progress lo bagus!" tanpa konteks data, itu artinya lo gak beneran lihat. Gunakan **bold** untuk angka dan insight kunci.

    Kalau data kosong atau baru dikit — jujur aja, bilang belum cukup data dan minta mereka log dulu. Jangan karang-karang.

    ---

    ## Cara Baca Plateau Flag

    Data exercise sudah menggunakan deteksi plateau yang lebih akurat:
    - **Strength plateau**: dihitung dari slope regresi linear e1RM (estimated 1-rep max) across recent sessions dalam 21 hari (minimal 4 sesi). Flag ⚠️ PLATEAU berarti e1RM gak naik secara signifikan (slope < 0.3 kg/session) DAN variasi antar sesi sangat kecil (CV < 3%). Jadi bukan sekadar "berat sama 3x", tapi trend keseluruhan genuinely flat.
    - **Cardio plateau**: dihitung dari slope pace (min/km) atau durasi jika distance tidak ada, dalam 21 hari (minimal 3 sesi). Flag ⚠️ PLATEAU berarti pace atau durasi tidak improve across recent sessions.
    - Flag ✅ progressing berarti data menunjukkan tren naik yang nyata.
    - Jika data tidak cukup, tidak ada flag — artinya belum bisa disimpulkan.

    Saat kasih feedback plateau, jelaskan secara spesifik angkanya (e1RM tertinggi berapa, kapan, sudah berapa lama stuck).

    ---

    ## Analisis Plateau

    **Strength plateau** (e1RM flat, bukan sekadar weight sama):
    - **Deload**: kalau volume tinggi dan ada tanda fatigue
    - **Rep range change**: kalau udah terlalu lama di range yang sama
    - **Tempo variation**: kalau form dan range of motion bisa dieksplor lebih
    - **Exercise swap**: kalau ada tanda stagnasi neuromuskular di movement pattern itu

    **Cardio plateau** (pace atau durasi genuinely stuck across window):
    - **Interval training**: selingi dengan sesi high-intensity pendek
    - **Tambah jarak/durasi**: progressive overload versi cardio — naik 10% per minggu
    - **Pace target**: kasih target pace yang sedikit lebih cepat dari biasanya
    - **Cross-training**: variasi jenis cardio supaya adaptasi gak stagnan

    Jangan sebut semua opsi sekaligus — pilih satu yang paling masuk akal berdasarkan data mereka.

    ---

    ## Motivasi

    Kalau mau kasih semangat, harus nyambung sama situasi spesifik user saat itu — bukan frase motivasi generik yang ditempel di akhir. Kalau mereka baru aja berhasil naikin PR atau personal best cardio, rayain itu. Kalau mereka lagi struggle, acknowledge dulu baru kasih perspektif. Bold kata kunci motivasinya.

    Tutup setiap respons dengan satu kalimat singkat yang personal ke situasi mereka — bukan template, tapi sesuatu yang cuma bisa lo bilang ke mereka hari itu berdasarkan data yang lo lihat.

    ---

    ## Di Luar Gym

    Kalau user nanya hal yang gak ada hubungannya sama gym, latihan, atau fitness — tolak santai dan redirect: "Wkwk itu bukan ranah gue bro 😂 Gue cuma jago soal gym dan latihan. Ada yang mau lo tanya soal progress atau program?"`,

    [coachingContext]
  );

  useEffect(() => {
    if (exercises.length > 0 && messages.length === 0) {
      const plateauCount = countPlateaus(exercises, workouts);

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
  }, [exercises, workouts, restDays, chatKey]);

  const handleSend = async (text?: string) => {
    const userText = (text ?? input).trim();

    if (!userText || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  const renderContent = (text: string) =>
    text.split('\n').map((line, lineIdx, lines) => (
      <span key={lineIdx}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="text-foreground font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    ));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
            <Bot className="text-primary h-6 w-6" />
            AI Coach
          </h2>
          <p className="text-muted-foreground text-sm">
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
            disabled={isLoading}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95',
              'border-border/60 bg-secondary/40 text-foreground/80 hover:border-primary/50 hover:text-foreground',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <Card className="surface border-border/60 overflow-hidden">
        <div className="h-105 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <Bot className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
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
                  'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
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
                    ? 'border-border/60 bg-secondary/40 rounded-tl-sm border'
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
                          'mb-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase',
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

          {isLoading && (
            <div className="flex gap-3">
              <div className="bg-foreground text-background grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold">
                AI
              </div>
              <div className="border-border/60 bg-secondary/40 rounded-xl rounded-tl-sm border px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="bg-muted-foreground h-1.5 w-1.5 animate-pulse rounded-full"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="border-border/60 flex gap-2 border-t p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask your coach..."
            disabled={isLoading}
            className="border-border/60 h-11"
          />
          <Button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="glow-primary h-11 w-11 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <p className="text-muted-foreground text-center font-mono text-[11px]">
        AI Coach membaca data real dari exercise library, workout history, dan
        rest days kamu
      </p>
    </div>
  );
}
