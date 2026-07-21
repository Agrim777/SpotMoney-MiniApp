import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, userTasksTable } from "@workspace/db";
import {
  InitUserBody,
  InitUserResponse,
  GetUserParams,
  GetUserResponse,
  ClaimAdRewardParams,
  ClaimAdRewardResponse,
  GetUserReferralsParams,
  GetUserReferralsResponse,
  GetUserStatsParams,
  GetUserStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Generate a short referral code from telegram id
function generateReferralCode(telegramId: string): string {
  return `SM${telegramId.slice(-6).toUpperCase()}`;
}

// Reset daily ad count if last_active was a different day
async function resetDailyAdsIfNeeded(user: typeof usersTable.$inferSelect) {
  const now = new Date();
  const lastActive = new Date(user.lastActive);
  const isSameDay =
    now.getFullYear() === lastActive.getFullYear() &&
    now.getMonth() === lastActive.getMonth() &&
    now.getDate() === lastActive.getDate();

  if (!isSameDay) {
    // New day — reset daily ads and update streak
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday =
      lastActive.getFullYear() === yesterday.getFullYear() &&
      lastActive.getMonth() === yesterday.getMonth() &&
      lastActive.getDate() === yesterday.getDate();

    const newStreak = wasYesterday ? user.streak + 1 : 1;
    await db
      .update(usersTable)
      .set({ adsWatchedToday: 0, streak: newStreak, lastActive: now })
      .where(eq(usersTable.id, user.id));
    return { ...user, adsWatchedToday: 0, streak: newStreak };
  }
  return user;
}

// POST /users/init
router.post("/users/init", async (req, res): Promise<void> => {
  const parsed = InitUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { telegramId, firstName, lastName, username, photoUrl, referredBy } = parsed.data;

  // Check if user exists
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId));

  if (existing) {
    const updated = await resetDailyAdsIfNeeded(existing);
    res.json(InitUserResponse.parse({
      ...updated,
      adCooldownUntil: updated.adCooldownUntil ? updated.adCooldownUntil.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    }));
    return;
  }

  // New user — handle referral bonus
  let referralBonus = 0;
  if (referredBy) {
    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, referredBy));
    if (referrer) {
      // Give referrer 50 coins
      await db
        .update(usersTable)
        .set({
          balance: referrer.balance + 50,
          totalEarned: referrer.totalEarned + 50,
        })
        .where(eq(usersTable.id, referrer.id));
      referralBonus = 25; // New user gets 25 coins
    }
  }

  const referralCode = generateReferralCode(telegramId);
  const [newUser] = await db
    .insert(usersTable)
    .values({
      telegramId,
      firstName,
      lastName: lastName ?? null,
      username: username ?? null,
      photoUrl: photoUrl ?? null,
      balance: referralBonus,
      totalEarned: referralBonus,
      referralCode,
      referredBy: referredBy ?? null,
    })
    .returning();

  res.json(InitUserResponse.parse({
    ...newUser,
    adCooldownUntil: null,
    createdAt: newUser.createdAt.toISOString(),
  }));
});

// GET /users/:telegramId
router.get("/users/:telegramId", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, params.data.telegramId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updated = await resetDailyAdsIfNeeded(user);
  res.json(GetUserResponse.parse({
    ...updated,
    adCooldownUntil: updated.adCooldownUntil ? updated.adCooldownUntil.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
  }));
});

// POST /users/:telegramId/ad-reward — only called after user explicitly chose to watch ad
router.post("/users/:telegramId/ad-reward", async (req, res): Promise<void> => {
  const params = ClaimAdRewardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, params.data.telegramId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Check cooldown
  const now = new Date();
  if (user.adCooldownUntil && user.adCooldownUntil > now) {
    res.status(429).json({ error: "Cooldown active", cooldownUntil: user.adCooldownUntil.toISOString() });
    return;
  }

  const coinsEarned = 10;
  const COOLDOWN_MS = 30_000; // 30 seconds
  const cooldownUntil = new Date(now.getTime() + COOLDOWN_MS);

  const [updated] = await db
    .update(usersTable)
    .set({
      balance: user.balance + coinsEarned,
      totalEarned: user.totalEarned + coinsEarned,
      adsWatchedToday: user.adsWatchedToday + 1,
      adsWatchedTotal: user.adsWatchedTotal + 1,
      adCooldownUntil: cooldownUntil,
      lastActive: now,
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json(ClaimAdRewardResponse.parse({
    balance: updated.balance,
    coinsEarned,
    adsWatchedToday: updated.adsWatchedToday,
    cooldownUntil: cooldownUntil.toISOString(),
  }));
});

// GET /users/:telegramId/referrals
router.get("/users/:telegramId/referrals", async (req, res): Promise<void> => {
  const params = GetUserReferralsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, params.data.telegramId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const referrals = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.referredBy, user.referralCode))
    .orderBy(desc(usersTable.createdAt));

  const referralLink = `https://t.me/Spotmoneybot?start=${user.referralCode}`;
  const referralEarnings = referrals.length * 50;

  res.json(GetUserReferralsResponse.parse({
    referralCode: user.referralCode,
    referralLink,
    totalReferrals: referrals.length,
    referralEarnings,
    referrals: referrals.map((r) => ({
      firstName: r.firstName,
      username: r.username,
      joinedAt: r.createdAt.toISOString(),
    })),
  }));
});

// GET /users/:telegramId/stats
router.get("/users/:telegramId/stats", async (req, res): Promise<void> => {
  const params = GetUserStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, params.data.telegramId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Calculate leaderboard rank
  const [rankRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(sql`total_earned > ${user.totalEarned}`);

  const leaderboardRank = Number(rankRow?.count ?? 0) + 1;

  const referrals = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.referredBy, user.referralCode));

  res.json(GetUserStatsResponse.parse({
    balance: user.balance,
    totalEarned: user.totalEarned,
    adsWatchedTotal: user.adsWatchedTotal,
    streak: user.streak,
    leaderboardRank,
    referralCount: referrals.length,
  }));
});

export default router;
