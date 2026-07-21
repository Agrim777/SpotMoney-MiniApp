import { motion } from 'framer-motion';
import { Coins, Eye, ShieldCheck, Gift } from 'lucide-react';
import { useSpotMoney } from '@/hooks/use-spot-money';

export function ConsentScreen() {
  const { giveConsent } = useSpotMoney();

  return (
    <div className="min-h-[100dvh] w-full max-w-[430px] mx-auto flex flex-col items-center justify-between bg-background px-6 py-10">
      {/* Top logo area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3 pt-8"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Coins className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">SpotMoney</h1>
        <p className="text-muted-foreground text-sm text-center">Earn coins by choosing to watch ads</p>
      </motion.div>

      {/* Info cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="w-full space-y-3"
      >
        <h2 className="text-lg font-bold text-foreground text-center mb-4">Before you start</h2>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">This app shows advertisements</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              SpotMoney is powered by ads. You will only ever see an ad when you
              explicitly tap <span className="font-semibold text-foreground">"Watch Ad"</span> on
              the Earn page — never automatically.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Ads are always your choice</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Every ad watch is a deliberate action you initiate. Navigation, tasks,
              referrals, and withdrawals never trigger ads.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Powered by AdsGram</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Ads are served by AdsGram and comply with Telegram Mini App advertising
              policies. You can stop at any time by simply not using the Earn tab.
            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="w-full space-y-3"
      >
        <button
          onClick={giveConsent}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-95 transition-transform shadow-lg"
        >
          I Agree &amp; Continue
        </button>
        <p className="text-center text-xs text-muted-foreground px-4">
          By continuing you confirm that you understand this app voluntarily shows
          ads in exchange for coin rewards.
        </p>
      </motion.div>
    </div>
  );
}
