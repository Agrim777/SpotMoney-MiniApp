import { useState, useEffect, useRef } from 'react';
import { useSpotMoney } from '@/hooks/use-spot-money';
import { Coins, Play, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DAILY_AD_LIMIT } from '@/lib/storage';

export default function Earn() {
  const { state, claimAdReward } = useSpotMoney();
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const adControllerRef = useRef<any>(null);

  // Init Adsgram controller once
  useEffect(() => {
    if (window.Adsgram) {
      adControllerRef.current = window.Adsgram.init({ blockId: '39179' });
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

  // Only called when user explicitly taps the Watch Ad button
  const handleWatchAd = () => {
    if (timeLeft || isPlaying) return;
    setError(null);

    if (!adControllerRef.current) {
      setError('Ad SDK not loaded. Please try again in a moment.');
      return;
    }

    setIsPlaying(true);
    adControllerRef.current
      .show()
      .then((result: any) => {
        if (result.done) {
          const { error: err } = claimAdReward();
          if (err === 'cooldown') {
            setError("You're watching ads too fast. Please wait for the cooldown.");
          } else if (err === 'daily_limit') {
            setError("You've reached today's ad limit. Come back tomorrow!");
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
      className="p-6 pb-28 space-y-8 flex flex-col items-center justify-center min-h-[80vh]"
    >
      <div className="text-center space-y-4 max-w-[300px]">
        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
          <Play className="w-10 h-10 text-primary translate-x-1" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Watch & Earn</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Choose to watch an ad and earn coins instantly. Completely voluntary — no ads are ever
          shown automatically.
        </p>
      </div>

      <div className="w-full max-w-sm bg-card border border-border p-6 rounded-3xl flex flex-col items-center gap-6 shadow-xl">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl">
          <Coins className="w-7 h-7" />
          +10 Coins per Ad
        </div>

        <button
          onClick={handleWatchAd}
          disabled={isDisabled}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all outline-none focus:ring-4 focus:ring-primary/50 ${
            isDisabled
              ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border'
              : 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/20'
          }`}
        >
          {isPlaying ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              Loading Ad...
            </>
          ) : isCooldown ? (
            <>
              <Clock className="w-5 h-5" />
              Cooldown: {Math.floor(timeLeft! / 60)}:{(timeLeft! % 60).toString().padStart(2, '0')}
            </>
          ) : (
            <>
              <Play className="w-5 h-5" fill="currentColor" />
              Watch Ad — Earn 10 Coins
            </>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg w-full border border-destructive/20">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Daily progress */}
      <div className="w-full max-w-sm space-y-2">
        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wide">
          <span>Today's Ads</span>
          <span className="text-foreground">
            {adsToday} / {DAILY_AD_LIMIT}
          </span>
        </div>
        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.min((adsToday / DAILY_AD_LIMIT) * 100, 100)}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
