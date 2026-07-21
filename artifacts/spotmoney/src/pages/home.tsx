import { useSpotMoney } from '@/hooks/use-spot-money';
import { Coins, Zap, Trophy, TrendingUp, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { state } = useSpotMoney();
  if (!state) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-6 pb-28 space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center font-bold text-lg text-foreground">
            {state.photoUrl ? (
              <img src={state.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              state.firstName?.charAt(0) || 'U'
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">
              {state.firstName} {state.lastName || ''}
            </h1>
            <p className="text-xs text-muted-foreground leading-tight">Welcome back</p>
          </div>
        </div>
        <div className="bg-secondary px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold border border-border">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          {state.streak} Days
        </div>
      </div>

      {/* Balance */}
      <div className="flex flex-col items-center justify-center py-10 bg-card border border-border rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full mix-blend-screen" />
        <p className="text-muted-foreground text-xs font-bold mb-3 uppercase tracking-wider">Your Balance</p>
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2.5 rounded-full ring-4 ring-primary/10">
            <Coins className="w-8 h-8 text-primary" />
          </div>
          <span className="text-5xl font-extrabold tracking-tight">{state.balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-muted-foreground text-xs font-medium">Total Earned</p>
            <p className="text-lg font-bold">{state.totalEarned.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <div>
            <p className="text-muted-foreground text-xs font-medium">Ads Watched</p>
            <p className="text-lg font-bold">{state.adsWatchedTotal.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-muted-foreground text-xs font-medium">Tasks Done</p>
            <p className="text-lg font-bold">{state.completedTaskIds.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-muted-foreground text-xs font-medium">Day Streak</p>
            <p className="text-lg font-bold">{state.streak}</p>
          </div>
        </div>
      </div>

      {/* Referral callout */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Invite Friends</p>
          <p className="text-xs text-muted-foreground mt-0.5">Earn 50 coins per referral</p>
        </div>
        <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg">
          +50 coins
        </div>
      </div>
    </motion.div>
  );
}
