import { useEffect } from 'react';
import { useSpotMoney } from './use-spot-money';

declare global {
  interface Window {
    Telegram?: { WebApp: any };
    Adsgram?: { init: (params: { blockId: string }) => any };
  }
}

/** Drop this anywhere inside SpotMoneyProvider to initialize from Telegram data */
export function TelegramInitializer() {
  const { init } = useSpotMoney();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      tg.ready();
      tg.expand();
    }
    const user = tg?.initDataUnsafe?.user;
    const startParam = tg?.initDataUnsafe?.start_param;

    init({
      telegramId: user?.id?.toString() || 'demo123',
      firstName: user?.first_name || 'Demo',
      lastName: user?.last_name || null,
      username: user?.username || null,
      photoUrl: user?.photo_url || null,
      referredBy: startParam || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
