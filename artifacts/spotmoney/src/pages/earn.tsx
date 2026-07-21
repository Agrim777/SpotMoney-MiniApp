import { useState, useEffect, useRef } from 'react';
import { useSpotMoney } from '@/hooks/use-spot-money';
import { Coins, Play, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DAILY_AD_LIMIT } from '@/lib/storage';

export default function Earn() {
  const { state, claimAdReward } = useSpotMoney();
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const adControllerRef = useRef<any>(null);

  // Init Adsgram controller once
  useEffect(() => {
    if (window.Adsgram) {
      adControllerRef.current = window.Adsgram.init({ blockId: '39232' });
    }
  }, []);

  // Cooldown countdown from localStorage state
  useEffect(() => {
    if (!state?.adCooldownUntil) {
      setTimeLeft(null);
      return;
    }
    const end = new Date(state.adCooldownUntil).getTime();
    const update = () => {
      const diff = Math.ceil((end - Date.now()) / 1000);
      if (diff > 0) {
        setTimeLeft(diff);
      } else {
        setTimeLeft(null);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [state?.adCooldownUntil]);

  // User explicitly taps the Watch Ad button — no ad is ever shown automatically
  const handleWatchAd = () => {
    if (timeLeft || isPlaying) return;
    setError(null);
    setLastReward(null);

    if (!adControllerRef.current) {
      setError('Ad SDK not loaded. Please try again in a moment.');
      return;
    }

    setIsPlaying(true);
    adControllerRef.current
      .show()
      .then((result: any) => {
        if (result.done) {
          const { coinsEarned, error: err } = claimAdReward();
          if (err === 'cooldown') {
            setError("You're watching ads too fast. Please wait for the cooldown.");
          } else if (err === 'daily_limit') {
            setError("You've reached today's ad limit. Come back tomorrow!");
          } else {
            setLastReward(coinsEarned);
          }
        }
        setIsPlaying(false);
      })
      .catch((err: any) => {
        setError(err?.description || 'No ads available right now. Try again later.');
        setIsPlaying(false);
      });
  };

  const isCooldown = !!(timeLeft && timeLeft > 0);
  const isDisabled = isCooldown || isPlaying;
  const adsToday = state?.adsWatchedToday ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-6 pb-28 space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Earn</h1>
        <p className="text-muted-foreground text-sm">
          Voluntarily watch an ad to earn coins. You are always in control — ads only play when you tap the button below.
        </p>
      </div>

      {/* Balance snapshot */}
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Coins className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Your balance</p>
          <p className="text-2xl font-extrabold text-foreground">{state?.balance ?? 0}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="font-bold text-foreground text-sm">{adsToday} / {DAILY_AD_LIMIT} ads</p>
        </div>
      </div>

      {/* How it works note */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-1.5">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">How it works</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-none">
          <li>① Tap <span className="font-semibold text-foreground">"I Choose to Watch an Ad"</span> below</li>
          <li>② Watch the full ad voluntarily</li>
          <li>③ Earn <span className="font-semibold text-foreground">+10 coins</span> automatically</li>
          <li>④ Wait 30 s cooldown, then repeat (up to {DAILY_AD_LIMIT}× per day)</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-1 border-t border-primary/10">
          Ads are served by <span className="font-semibold text-foreground">AdsGram</span>. No ad ever plays without your explicit tap.
        </p>
      </div>

      {/* Success flash */}
      {lastReward !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm font-semibold text-green-600">+{lastReward} coins earned! Well done.</p>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Cooldown indicator */}
      {isCooldown && (
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Cooldown active</p>
            <p className="text-xs text-muted-foreground">Next ad available in {timeLeft}s</p>
          </div>
        </div>
      )}

      {/* Main CTA — only button that can trigger an ad */}
      <button
        onClick={handleWatchAd}
        disabled={isDisabled}
        className={`w-full py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg
          ${isDisabled
            ? 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
            : 'bg-primary text-primary-foreground'
          }`}
      >
        {isPlaying ? (
          <>
            <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            Loading ad…
          </>
        ) : isCooldown ? (
          <>
            <Clock className="w-4 h-4" />
            Wait {timeLeft}s
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            I Choose to Watch an Ad
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Tapping the button above is your voluntary consent to view one advertisement.
      </p>
    </motion.div>
  );
}
