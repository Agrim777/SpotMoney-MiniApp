const STORAGE_KEY = 'spotmoney_v2';
const COOLDOWN_MS = 30_000;
export const DAILY_AD_LIMIT = 50;
export const MIN_WITHDRAWAL = 1000;

export interface Withdrawal {
  id: number;
  amount: number;
  method: string;
  address: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface ReferredFriend {
  firstName: string;
  username: string | null;
  joinedAt: string;
}

export interface SpotMoneyState {
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  balance: number;
  totalEarned: number;
  adsWatchedToday: number;
  adsWatchedTotal: number;
  adCooldownUntil: string | null;
  streak: number;
  lastActive: string;
  referralCode: string;
  referredBy: string | null;
  referralEarnings: number;
  referredFriends: ReferredFriend[];
  completedTaskIds: number[];
  withdrawals: Withdrawal[];
}

export const TASKS = [
  { id: 1, title: 'Join our Telegram Channel', description: 'Join the official SpotMoney channel for updates and bonuses', reward: 50, icon: 'telegram', actionUrl: 'https://t.me/spotmoneyofficial', category: 'social' },
  { id: 2, title: 'Follow on Twitter/X', description: 'Follow @SpotMoney on Twitter for news and giveaways', reward: 30, icon: 'twitter', actionUrl: 'https://twitter.com/spotmoney', category: 'social' },
  { id: 3, title: 'Join our Discord', description: 'Become a member of the SpotMoney Discord community', reward: 40, icon: 'discord', actionUrl: 'https://discord.gg/spotmoney', category: 'social' },
  { id: 4, title: 'Subscribe on YouTube', description: 'Subscribe to SpotMoney on YouTube for tutorials', reward: 35, icon: 'youtube', actionUrl: 'https://youtube.com/@spotmoney', category: 'social' },
  { id: 5, title: 'Invite 1 Friend', description: 'Refer your first friend and earn bonus coins', reward: 100, icon: 'users', actionUrl: 'https://t.me/Spotmoneybot?start=invite', category: 'referral' },
  { id: 6, title: 'Watch Your First Ad', description: 'Go to the Earn tab and voluntarily watch your first ad', reward: 20, icon: 'play', actionUrl: 'https://t.me/Spotmoneybot/Makemoney', category: 'earn' },
] as const;

function makeReferralCode(telegramId: string): string {
  return `SM${telegramId.slice(-6).toUpperCase()}`;
}

function checkAndResetDaily(state: SpotMoneyState): SpotMoneyState {
  const now = new Date();
  const last = new Date(state.lastActive);
  const sameDay =
    now.getFullYear() === last.getFullYear() &&
    now.getMonth() === last.getMonth() &&
    now.getDate() === last.getDate();
  if (sameDay) return state;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday =
    last.getFullYear() === yesterday.getFullYear() &&
    last.getMonth() === yesterday.getMonth() &&
    last.getDate() === yesterday.getDate();

  return {
    ...state,
    adsWatchedToday: 0,
    streak: wasYesterday ? state.streak + 1 : 1,
    lastActive: now.toISOString(),
  };
}

export function loadState(): SpotMoneyState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpotMoneyState;
    return checkAndResetDaily(parsed);
  } catch {
    return null;
  }
}

function persist(state: SpotMoneyState): SpotMoneyState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function initState(params: {
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
  referredBy?: string | null;
}): SpotMoneyState {
  const existing = loadState();
  if (existing && existing.telegramId === params.telegramId) return existing;

  const hasReferral = !!(params.referredBy && params.referredBy.startsWith('SM'));
  const state: SpotMoneyState = {
    telegramId: params.telegramId,
    firstName: params.firstName,
    lastName: params.lastName ?? null,
    username: params.username ?? null,
    photoUrl: params.photoUrl ?? null,
    balance: hasReferral ? 25 : 0,
    totalEarned: hasReferral ? 25 : 0,
    adsWatchedToday: 0,
    adsWatchedTotal: 0,
    adCooldownUntil: null,
    streak: 1,
    lastActive: new Date().toISOString(),
    referralCode: makeReferralCode(params.telegramId),
    referredBy: params.referredBy ?? null,
    referralEarnings: 0,
    referredFriends: [],
    completedTaskIds: [],
    withdrawals: [],
  };
  return persist(state);
}

export function claimAdReward(state: SpotMoneyState): {
  state: SpotMoneyState;
  coinsEarned: number;
  error?: string;
} {
  const now = new Date();
  if (state.adCooldownUntil && new Date(state.adCooldownUntil) > now) {
    return { state, coinsEarned: 0, error: 'cooldown' };
  }
  if (state.adsWatchedToday >= DAILY_AD_LIMIT) {
    return { state, coinsEarned: 0, error: 'daily_limit' };
  }

  const coinsEarned = 10;
  const cooldownUntil = new Date(now.getTime() + COOLDOWN_MS).toISOString();
  const updated = persist({
    ...state,
    balance: state.balance + coinsEarned,
    totalEarned: state.totalEarned + coinsEarned,
    adsWatchedToday: state.adsWatchedToday + 1,
    adsWatchedTotal: state.adsWatchedTotal + 1,
    adCooldownUntil: cooldownUntil,
    lastActive: now.toISOString(),
    completedTaskIds: state.completedTaskIds.includes(6)
      ? state.completedTaskIds
      : state.adsWatchedTotal === 0
      ? [...state.completedTaskIds]
      : state.completedTaskIds,
  });
  return { state: updated, coinsEarned };
}

export function completeTask(
  state: SpotMoneyState,
  taskId: number
): { state: SpotMoneyState; coinsEarned: number; error?: string } {
  if (state.completedTaskIds.includes(taskId)) {
    return { state, coinsEarned: 0, error: 'already_done' };
  }
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) return { state, coinsEarned: 0, error: 'not_found' };

  const updated = persist({
    ...state,
    balance: state.balance + task.reward,
    totalEarned: state.totalEarned + task.reward,
    completedTaskIds: [...state.completedTaskIds, taskId],
  });
  return { state: updated, coinsEarned: task.reward };
}

export function submitWithdrawal(
  state: SpotMoneyState,
  amount: number,
  method: string,
  address: string
): { state: SpotMoneyState; error?: string } {
  if (amount < MIN_WITHDRAWAL) return { state, error: `Minimum is ${MIN_WITHDRAWAL} coins` };
  if (amount > state.balance) return { state, error: 'Insufficient balance' };
  if (!address.trim()) return { state, error: 'Please enter an address' };

  const w: Withdrawal = {
    id: Date.now(),
    amount,
    method,
    address,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const updated = persist({
    ...state,
    balance: state.balance - amount,
    withdrawals: [w, ...state.withdrawals],
  });
  return { state: updated };
}
