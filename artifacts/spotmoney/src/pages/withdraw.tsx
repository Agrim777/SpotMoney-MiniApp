import { useGetUser, useGetUserWithdrawals, useRequestWithdrawal, getGetUserQueryKey, getGetUserWithdrawalsQueryKey } from "@workspace/api-client-react";
import { useTelegramId } from "@/hooks/use-telegram";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Coins, Wallet, History, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Withdraw() {
  const telegramId = useTelegramId();
  const queryClient = useQueryClient();
  const { data: user } = useGetUser(telegramId, { query: { enabled: !!telegramId, queryKey: getGetUserQueryKey(telegramId) } });
  const { data: history, isLoading: isHistoryLoading } = useGetUserWithdrawals(telegramId, { query: { enabled: !!telegramId, queryKey: getGetUserWithdrawalsQueryKey(telegramId) } });
  const withdraw = useRequestWithdrawal();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("TON");
  const [address, setAddress] = useState("");

  const MIN_WITHDRAWAL = 1000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    
    if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      toast({ description: `Minimum withdrawal is ${MIN_WITHDRAWAL} coins`, variant: "destructive" });
      return;
    }
    if (numAmount > (user?.balance || 0)) {
      toast({ description: "Insufficient balance", variant: "destructive" });
      return;
    }
    if (!address.trim()) {
      toast({ description: "Please enter a withdrawal address", variant: "destructive" });
      return;
    }

    withdraw.mutate(
      { telegramId, data: { amount: numAmount, method, address } },
      {
        onSuccess: () => {
          toast({ description: "Withdrawal requested successfully!" });
          setAmount("");
          setAddress("");
          queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(telegramId) });
          queryClient.invalidateQueries({ queryKey: getGetUserWithdrawalsQueryKey(telegramId) });
        },
        onError: () => {
          toast({ description: "Failed to request withdrawal", variant: "destructive" });
        }
      }
    );
  };

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{ duration: 0.2 }} className="p-6 pb-28 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Withdraw</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">Convert your earned coins into real value to your favorite wallet.</p>
      </div>

      <div className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Available Balance</span>
          <div className="flex items-center gap-1.5 font-bold text-primary text-xl">
            <Coins className="w-5 h-5" />
            {user?.balance?.toLocaleString() || 0}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wide">Amount (Coins)</label>
            <div className="relative">
              <input 
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Min. ${MIN_WITHDRAWAL}`}
                className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-secondary/50 transition-colors text-foreground font-medium"
              />
              <button 
                type="button"
                onClick={() => setAmount((user?.balance || 0).toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md"
              >
                MAX
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wide">Payment Method</label>
            <div className="relative">
              <select 
                value={method}
                onChange={e => setMethod(e.target.value)}
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
            <label className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wide">Wallet Address / ID</label>
            <input 
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter your address"
              className="w-full bg-secondary border border-transparent rounded-xl px-4 py-3.5 outline-none focus:border-primary focus:bg-secondary/50 transition-colors text-foreground font-medium"
            />
          </div>

          <button 
            type="submit"
            disabled={withdraw.isPending}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-md shadow-primary/20"
          >
            {withdraw.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              <><Wallet className="w-5 h-5" /> Request Withdrawal</>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-3 pt-4">
        <h2 className="font-bold flex items-center gap-2 px-1 text-sm uppercase tracking-wide text-muted-foreground">
          <History className="w-4 h-4" />
          History
        </h2>
        <div className="space-y-3">
          {history?.map((w) => (
            <div key={w.id} className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="font-bold flex items-center gap-1.5 text-sm">
                  <Coins className="w-4 h-4 text-primary"/> {w.amount.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{w.method} • {new Date(w.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                w.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                w.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {w.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {w.status === 'PENDING' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {w.status === 'FAILED' && <AlertCircle className="w-3.5 h-3.5" />}
                {w.status}
              </div>
            </div>
          ))}
          {(!history || history.length === 0) && !isHistoryLoading && (
            <div className="text-center py-10 text-sm font-medium text-muted-foreground border-2 border-dashed border-border rounded-2xl">
              No withdrawals yet.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
