import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  type SpotMoneyState,
  type Withdrawal,
  TASKS,
  loadState,
  initState as initStateFn,
  claimAdReward as claimAdRewardFn,
  completeTask as completeTaskFn,
  submitWithdrawal as submitWithdrawalFn,
} from '@/lib/storage';

interface SpotMoneyCtx {
  state: SpotMoneyState | null;
  isReady: boolean;
  tasks: typeof TASKS;
  init: (params: Parameters<typeof initStateFn>[0]) => void;
  claimAdReward: () => { coinsEarned: number; error?: string };
  completeTask: (taskId: number) => { coinsEarned: number; error?: string };
  submitWithdrawal: (amount: number, method: string, address: string) => { error?: string };
}

const SpotMoneyContext = createContext<SpotMoneyCtx | null>(null);

export function SpotMoneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SpotMoneyState | null>(() => loadState());
  const [isReady, setIsReady] = useState(false);

  const init = useCallback((params: Parameters<typeof initStateFn>[0]) => {
    const s = initStateFn(params);
    setState(s);
    setIsReady(true);
  }, []);

  const claimAdReward = useCallback(() => {
    if (!state) return { coinsEarned: 0, error: 'not_ready' };
    const result = claimAdRewardFn(state);
    setState(result.state);
    return { coinsEarned: result.coinsEarned, error: result.error };
  }, [state]);

  const completeTask = useCallback(
    (taskId: number) => {
      if (!state) return { coinsEarned: 0, error: 'not_ready' };
      const result = completeTaskFn(state, taskId);
      setState(result.state);
      return { coinsEarned: result.coinsEarned, error: result.error };
    },
    [state]
  );

  const submitWithdrawal = useCallback(
    (amount: number, method: string, address: string) => {
      if (!state) return { error: 'not_ready' };
      const result = submitWithdrawalFn(state, amount, method, address);
      setState(result.state);
      return { error: result.error };
    },
    [state]
  );

  return (
    <SpotMoneyContext.Provider
      value={{ state, isReady, tasks: TASKS, init, claimAdReward, completeTask, submitWithdrawal }}
    >
      {children}
    </SpotMoneyContext.Provider>
  );
}

export function useSpotMoney() {
  const ctx = useContext(SpotMoneyContext);
  if (!ctx) throw new Error('useSpotMoney must be inside SpotMoneyProvider');
  return ctx;
}

// Re-export type so pages can use it
export type { SpotMoneyState, Withdrawal };
