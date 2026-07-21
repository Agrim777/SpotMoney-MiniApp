import { useGetUserReferrals, getGetUserReferralsQueryKey } from "@workspace/api-client-react";
import { useTelegramId } from "@/hooks/use-telegram";
import { Users, Copy, Share2, Coins, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Referral() {
  const telegramId = useTelegramId();
  const { data: referralInfo, isLoading } = useGetUserReferrals(telegramId, { query: { enabled: !!telegramId, queryKey: getGetUserReferralsQueryKey(telegramId) } });
  const { toast } = useToast();

  const handleCopy = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink);
      toast({ description: "Referral link copied to clipboard!" });
    }
  };

  const handleShare = () => {
    if (referralInfo?.referralLink && window.Telegram?.WebApp?.switchInlineQuery) {
      window.Telegram.WebApp.switchInlineQuery(
        `Join SpotMoney and earn coins! ${referralInfo.referralLink}`,
        ['users', 'groups']
      );
    } else if (referralInfo?.referralLink) {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralInfo.referralLink)}&text=${encodeURIComponent("Join SpotMoney and earn coins!")}`);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground flex items-center justify-center min-h-[50vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{ duration: 0.2 }} className="p-6 pb-28 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Friends</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">Invite friends and earn a percentage of their ad rewards forever.</p>
      </div>

      <div className="bg-card border border-border p-5 rounded-3xl space-y-5 shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your Invite Link</span>
            <button onClick={handleCopy} className="text-primary text-xs font-bold flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all"><Copy className="w-3.5 h-3.5"/> Copy</button>
          </div>
          <div className="bg-secondary/50 p-4 rounded-xl text-sm font-mono truncate text-muted-foreground border border-border/50">
            {referralInfo?.referralLink || "Generating link..."}
          </div>
        </div>
        <button 
          onClick={handleShare}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
        >
          <Share2 className="w-5 h-5" />
          Share to Telegram
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          <div className="mt-2">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide mb-1">Total Referrals</p>
            <p className="text-2xl font-extrabold">{referralInfo?.totalReferrals || 0}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <Coins className="w-6 h-6 text-primary" />
          <div className="mt-2">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide mb-1">Earned via Friends</p>
            <p className="text-2xl font-extrabold text-primary">{(referralInfo?.referralEarnings || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <h2 className="font-bold px-1 text-sm uppercase tracking-wide text-muted-foreground">Invited Friends</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {referralInfo?.referrals?.map((ref, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-secondary/10">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm">{ref.firstName}</span>
                {ref.username && <span className="text-xs text-muted-foreground">@{ref.username}</span>}
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border">{new Date(ref.joinedAt).toLocaleDateString()}</span>
            </div>
          ))}
          {(!referralInfo?.referrals || referralInfo.referrals.length === 0) && (
            <div className="text-center py-8 text-sm font-medium text-muted-foreground">
              You haven't invited anyone yet.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
