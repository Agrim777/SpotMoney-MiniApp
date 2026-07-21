import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, withdrawalsTable } from "@workspace/db";
import {
  GetUserWithdrawalsParams,
  GetUserWithdrawalsResponse,
  RequestWithdrawalParams,
  RequestWithdrawalBody,
  RequestWithdrawalResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MIN_WITHDRAWAL = 500; // 500 coins minimum

// GET /users/:telegramId/withdrawals
router.get("/users/:telegramId/withdrawals", async (req, res): Promise<void> => {
  const params = GetUserWithdrawalsParams.safeParse(req.params);
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

  const withdrawals = await db
    .select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, user.id))
    .orderBy(desc(withdrawalsTable.createdAt));

  res.json(GetUserWithdrawalsResponse.parse(withdrawals.map((w) => ({
    id: w.id,
    amount: w.amount,
    method: w.method,
    address: w.address,
    status: w.status,
    createdAt: w.createdAt.toISOString(),
  }))));
});

// POST /users/:telegramId/withdrawals
router.post("/users/:telegramId/withdrawals", async (req, res): Promise<void> => {
  const params = RequestWithdrawalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = RequestWithdrawalBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
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

  if (body.data.amount < MIN_WITHDRAWAL) {
    res.status(400).json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL} coins` });
    return;
  }

  if (user.balance < body.data.amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  // Deduct balance
  await db
    .update(usersTable)
    .set({ balance: user.balance - body.data.amount })
    .where(eq(usersTable.id, user.id));

  const [withdrawal] = await db
    .insert(withdrawalsTable)
    .values({
      userId: user.id,
      amount: body.data.amount,
      method: body.data.method,
      address: body.data.address,
      status: "pending",
    })
    .returning();

  res.status(201).json(RequestWithdrawalResponse.parse({
    id: withdrawal.id,
    amount: withdrawal.amount,
    method: withdrawal.method,
    address: withdrawal.address,
    status: withdrawal.status,
    createdAt: withdrawal.createdAt.toISOString(),
  }));
});

export default router;
