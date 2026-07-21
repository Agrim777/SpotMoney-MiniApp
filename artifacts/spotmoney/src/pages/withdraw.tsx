import { useState } from 'react';
import { useSpotMoney } from '@/hooks/use-spot-money';
import { useToast } from '@/hooks/use-toast';
import { Coins, Wallet, History, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MIN_WITHDRAWAL } from '@/lib/storage';

export default function Withdraw() {
  const { state, submitWithdrawal } = useSpotMoney();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('TON');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!state) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    const { error } = submitWithdrawal(num, method, address);
    if (error) {
      toast({ description: error, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast({ description: 'Withdrawal requested successfully!' });
      setAmount('');
      setAddress('');
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-6 pb-28 space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Withdraw</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Convert your earned coins into real value. Minimum {MIN_WITHDRAWAL.toLocaleString()} coins.
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Available Balance
          </span>
          <div className="flex items-center gap-1.5 font-bold text-primary text-xl">
            <Coins className="w-5 h-5" />
            {state.balance.toLocaleString()}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wide">
              Amount (Coins)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min. ${MIN_WITHDRAWAL}`}
                className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-secondary/50 transition-colors text-foreground font-medium"
              />
              <button
                type="button"
                onClick={() => setAmount(state.balance.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wide">
              Payment Method
            </label>
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-secondary/50 transition-colors text-foreground font-medium appearance-none"
              >
                <option value="TON">TON Wallet</option>
                <option value="USDT">USDT (TRC20)</option>
                <option value="UPI">UPI (India)</option>
                <option value="PAYPAL">PayPal</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wide">
              Wallet Address / ID
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address or ID"
              className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-secondary/50 transition-colors text-foreground font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-md shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Request Withdrawal
              </>
            )}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="space-y-3 pt-4">
        <h2 className="font-bold flex items-center gap-2 px-1 text-sm uppercase tracking-wide text-muted-foreground">
          <History className="w-4 h-4" />
          History
        </h2>
        <div className="space-y-3">
          {state.withdrawals.map((w) => (
            <div
              key={w.id}
              className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex flex-col gap-1.5">
                <span className="font-bold flex items-center gap-1.5 text-sm">
                  <Coins className="w-4 h-4 text-primary" />
                  {w.amount.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {w.method} • {new Date(w.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                  w.status === 'pending'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : w.status === 'completed'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}
              >
                {w.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {w.status === 'pending' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {w.status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
                {w.status.toUpperCase()}
              </div>
            </div>
          ))}
          {state.withdrawals.length === 0 && (
            <div className="text-center py-10 text-sm font-medium text-muted-foreground border-2 border-dashed border-border rounded-2xl">
              No withdrawals yet.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
