import { useGetUser, useGetUserStats, getGetUserQueryKey, getGetUserStatsQueryKey, useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useTelegramId } from "@/hooks/use-telegram";
import { Coins, Zap, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const telegramId = useTelegramId();
  const { data: user, isLoading: isUserLoading } = useGetUser(telegramId, { query: { enabled: !!telegramId, queryKey: getGetUserQueryKey(telegramId) }});
  const { data: stats, isLoading: isStatsLoading } = useGetUserStats(telegramId, { query: { enabled: !!telegramId, queryKey: getGetUserStatsQueryKey(telegramId) }});
  const { data: leaderboard } = useGetLeaderboard({ query: { queryKey: getGetLeaderboardQueryKey() }});

  if (isUserLoading || isStatsLoading) {
    return <div className="p-6 text-center text-muted-foreground flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{ duration: 0.2 }} className="p-6 pb-28 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-lg">
                {user?.firstName?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">{user?.firstName} {user?.lastName || ''}</h1>
            <p className="text-xs text-muted-foreground leading-tight">Welcome back</p>
          </div>
        </div>
        <div className="bg-secondary px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold border border-border">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          {user?.streak || 0} Days
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-10 bg-card border border-border rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full mix-blend-screen" />
        <p className="text-muted-foreground text-xs font-bold mb-3 uppercase tracking-wider">Your Balance</p>
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2.5 rounded-full ring-4 ring-primary/10">
            <Coins className="w-8 h-8 text-primary" />
          </div>
          <span className="text-5xl font-extrabold tracking-tight">{user?.balance?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-muted-foreground text-xs font-medium">Total Earned</p>
            <p className="text-lg font-bold">{stats?.totalEarned?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <div>
            <p className="text-muted-foreground text-xs font-medium">Global Rank</p>
            <p className="text-lg font-bold">#{stats?.leaderboardRank || "—"}</p>
          </div>
        </div>
      </div>

      {leaderboard && leaderboard.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="font-bold flex items-center gap-2 px-1 text-sm uppercase tracking-wide text-muted-foreground">
            <Trophy className="w-4 h-4" /> Top Earners
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {leaderboard.slice(0, 3).map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border-b border-border last:border-0 bg-secondary/10">
                <div className="flex items-center gap-3">
                  <div className={`w-6 text-center font-bold text-sm ${entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-slate-300' : entry.rank === 3 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                    #{entry.rank}
                  </div>
                  <span className="font-medium text-sm">{entry.firstName}</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-primary">
                  {entry.totalEarned.toLocaleString()} <Coins className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
