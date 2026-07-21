import { useState, useEffect, useRef } from "react";
import { useGetUser, useClaimAdReward, getGetUserQueryKey } from "@workspace/api-client-react";
import { useTelegramId } from "@/hooks/use-telegram";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Play, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Earn() {
  const telegramId = useTelegramId();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetUser(telegramId, { query: { enabled: !!telegramId, queryKey: getGetUserQueryKey(telegramId) } });
  const claimReward = useClaimAdReward();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const adControllerRef = useRef<any>(null);

  useEffect(() => {
    if (window.Adsgram) {
      adControllerRef.current = window.Adsgram.init({ blockId: "39179" });
    }
  }, []);

  useEffect(() => {
    if (user?.adCooldownUntil) {
      const cooldownDate = new Date(user.adCooldownUntil).getTime();
      const now = Date.now();
      if (cooldownDate > now) {
        setTimeLeft(Math.ceil((cooldownDate - now) / 1000));
        const interval = setInterval(() => {
          const newNow = Date.now();
          if (cooldownDate > newNow) {
            setTimeLeft(Math.ceil((cooldownDate - newNow) / 1000));
          } else {
            setTimeLeft(null);
            clearInterval(interval);
          }
        }, 1000);
        return () => clearInterval(interval);
      } else {
        setTimeLeft(null);
      }
    } else {
      setTimeLeft(null);
    }
  }, [user?.adCooldownUntil]);

  const handleWatchAd = () => {
    if (timeLeft !== null || isPlaying) return;
    
    setError(null);
    if (!adControllerRef.current) {
      setError("Ad SDK not loaded yet. Please try again in a moment.");
      return;
    }

    setIsPlaying(true);
    
    adControllerRef.current.show().then((result: any) => {
      if (result.done) {
        claimReward.mutate(
          { telegramId },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
            },
            onError: (err: any) => {
              if (err?.status === 429) {
                 setError("You're watching ads too fast. Please wait for the cooldown.");
              } else {
                 setError("Failed to claim reward. Please try again.");
              }
            },
            onSettled: () => {
              setIsPlaying(false);
            }
          }
        );
      } else {
        setIsPlaying(false);
      }
    }).catch((err: any) => {
      console.error("Ad playback error:", err);
      setError(err?.description || "Failed to play ad. Try again later.");
      setIsPlaying(false);
    });
  };

  const isCooldown = timeLeft !== null && timeLeft > 0;
  
  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{ duration: 0.2 }} className="p-6 pb-28 space-y-8 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-4 max-w-[300px]">
        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse" />
          <Play className="w-10 h-10 text-primary translate-x-1" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Watch & Earn</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">Support the app by explicitly choosing to watch an ad, and earn coins instantly.</p>
      </div>

      <div className="w-full max-w-sm bg-card border border-border p-6 rounded-3xl flex flex-col items-center gap-6 shadow-xl">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl">
          <Coins className="w-7 h-7" />
          +10 Coins
        </div>

        <button 
          onClick={handleWatchAd}
          disabled={isCooldown || isPlaying || claimReward.isPending}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all outline-none focus:ring-4 focus:ring-primary/50 ${
            isCooldown || isPlaying || claimReward.isPending
              ? "bg-secondary text-muted-foreground cursor-not-allowed border border-border" 
              : "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] shadow-lg shadow-primary/20"
          }`}
        >
          {isPlaying || claimReward.isPending ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              Processing...
            </>
          ) : isCooldown ? (
            <>
              <Clock className="w-5 h-5" />
              Cooldown: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
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
      
      {user && (
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wide">
            <span>Daily Limit</span>
            <span className="text-foreground">{user.adsWatchedToday} / 50</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden border border-border">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${Math.min((user.adsWatchedToday / 50) * 100, 100)}%` }} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
