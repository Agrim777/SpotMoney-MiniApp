import type { ReactNode } from 'react';
import { useSpotMoney } from '@/hooks/use-spot-money';
import { BottomNav } from './bottom-nav';
import { ConsentScreen } from './consent-screen';
import { Coins } from 'lucide-react';

export function Layout({ children }: { children: ReactNode }) {
  const { isReady, consentGiven } = useSpotMoney();

  if (!isReady) {
    return (
      <div className="min-h-[100dvh] w-full max-w-[430px] mx-auto flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Coins className="w-12 h-12 animate-bounce" />
        <p className="text-muted-foreground font-medium text-sm">Loading SpotMoney...</p>
      </div>
    );
  }

  if (!consentGiven) {
    return <ConsentScreen />;
  }

  return (
    <div className="mx-auto max-w-[430px] w-full bg-background min-h-[100dvh] relative overflow-hidden flex flex-col shadow-2xl">
      <main className="flex-1 overflow-y-auto w-full">{children}</main>
      <BottomNav />
    </div>
  );
}
