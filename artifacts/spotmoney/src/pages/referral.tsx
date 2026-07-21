import { useSpotMoney } from '@/hooks/use-spot-money';
import { useToast } from '@/hooks/use-toast';
import { Users, Copy, Share2, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Referral() {
  const { state } = useSpotMoney();
  const { toast } = useToast();

  if (!state) return null;

  const referralLink = `https://t.me/Spotmoneybot?start=${state.referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast({ description: 'Referral link copied!' });
    });
  };

  const handleShare = () => {
    const text = encodeURIComponent('Join SpotMoney and earn coins watching ads!');
    const url = encodeURIComponent(referralLink);
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`);
    } else {
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-6 pb-28 space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Friends</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Invite friends — you earn <strong className="text-foreground">50 coins</strong>, they get{' '}
          <strong className="text-foreground">25 coins</strong> as a welcome bonus.
        </p>
      </div>

      <div className="bg-card border border-border p-5 rounded-3xl space-y-5 shadow-lg">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Your Invite Link
            </span>
            <button
              onClick={handleCopy}
              className="text-primary text-xs font-bold flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <div className="bg-secondary/50 p-4 rounded-xl text-sm font-mono truncate text-muted-foreground border border-border/50">
            {referralLink}
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
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide mb-1">
              Total Referrals
            </p>
            <p className="text-2xl font-extrabold">{state.referredFriends.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
          <Coins className="w-6 h-6 text-primary" />
          <div className="mt-2">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide mb-1">
              Referral Earnings
            </p>
            <p className="text-2xl font-extrabold text-primary">
              {state.referralEarnings.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <h2 className="font-bold px-1 text-sm uppercase tracking-wide text-muted-foreground">
          Invited Friends
        </h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {state.referredFriends.map((ref, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-secondary/10">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm">{ref.firstName}</span>
                {ref.username && (
                  <span className="text-xs text-muted-foreground">@{ref.username}</span>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border">
                {new Date(ref.joinedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {state.referredFriends.length === 0 && (
            <div className="text-center py-8 text-sm font-medium text-muted-foreground">
              You haven't invited anyone yet.
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">How it works</p>
        {[
          { step: '1', text: 'Share your unique link above' },
          { step: '2', text: 'Friend opens SpotMoney via your link' },
          { step: '3', text: 'You earn 50 coins, they get 25 coins' },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {s.step}
            </div>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
