import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, tasksTable, userTasksTable } from "@workspace/db";
import {
  ListTasksResponse,
  GetUserTasksParams,
  GetUserTasksResponse,
  CompleteTaskParams,
  CompleteTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /tasks
router.get("/tasks", async (_req, res): Promise<void> => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.active, true))
    .orderBy(tasksTable.id);

  res.json(ListTasksResponse.parse(tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    reward: t.reward,
    icon: t.icon,
    actionUrl: t.actionUrl,
    category: t.category,
  }))));
});

// GET /users/:telegramId/tasks
router.get("/users/:telegramId/tasks", async (req, res): Promise<void> => {
  const params = GetUserTasksParams.safeParse(req.params);
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

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.active, true))
    .orderBy(tasksTable.id);

  const completedTasks = await db
    .select()
    .from(userTasksTable)
    .where(eq(userTasksTable.userId, user.id));

  const completedIds = new Set(completedTasks.map((ut) => ut.taskId));

  res.json(GetUserTasksResponse.parse(tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    reward: t.reward,
    icon: t.icon,
    actionUrl: t.actionUrl,
    category: t.category,
    completed: completedIds.has(t.id),
  }))));
});

// POST /users/:telegramId/tasks/:taskId/complete
router.post("/users/:telegramId/tasks/:taskId/complete", async (req, res): Promise<void> => {
  const params = CompleteTaskParams.safeParse(req.params);
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

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, params.data.taskId), eq(tasksTable.active, true)));

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  // Check if already completed
  const [alreadyDone] = await db
    .select()
    .from(userTasksTable)
    .where(and(eq(userTasksTable.userId, user.id), eq(userTasksTable.taskId, task.id)));

  if (alreadyDone) {
    res.status(409).json({ error: "Task already completed" });
    return;
  }

  // Mark complete and grant coins
  await db.insert(userTasksTable).values({ userId: user.id, taskId: task.id });

  const [updated] = await db
    .update(usersTable)
    .set({
      balance: user.balance + task.reward,
      totalEarned: user.totalEarned + task.reward,
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json(CompleteTaskResponse.parse({
    balance: updated.balance,
    coinsEarned: task.reward,
    taskId: task.id,
  }));
});

export default router;
