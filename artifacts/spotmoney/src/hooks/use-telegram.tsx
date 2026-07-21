import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useInitUser } from "@workspace/api-client-react";

const TelegramContext = createContext<{telegramId: string; isInitializing: boolean}>({ telegramId: "", isInitializing: true });

export const useTelegramId = () => useContext(TelegramContext).telegramId;

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
    Adsgram?: {
      init: (params: { blockId: string }) => any;
    };
  }
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const initUser = useInitUser();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
    }

    const user = tg?.initDataUnsafe?.user;
    const startParam = tg?.initDataUnsafe?.start_param;
    
    const id = user?.id?.toString() || "demo123";
    setTelegramId(id);

    initUser.mutate({
      data: {
        telegramId: id,
        firstName: user?.first_name || "Demo",
        lastName: user?.last_name || "User",
        username: user?.username || "demo_user",
        photoUrl: user?.photo_url || "",
        referredBy: startParam || null
      }
    }, {
      onSettled: () => {
        setIsInitializing(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TelegramContext.Provider value={{ telegramId: telegramId || "", isInitializing }}>
      {children}
    </TelegramContext.Provider>
  );
}
