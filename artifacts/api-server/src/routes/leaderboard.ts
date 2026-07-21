import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetLeaderboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /leaderboard
router.get("/leaderboard", async (_req, res): Promise<void> => {
  const top = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.totalEarned))
    .limit(50);

  res.json(GetLeaderboardResponse.parse(top.map((u, i) => ({
    rank: i + 1,
    firstName: u.firstName,
    username: u.username,
    totalEarned: u.totalEarned,
    streak: u.streak,
  }))));
});

export default router;
