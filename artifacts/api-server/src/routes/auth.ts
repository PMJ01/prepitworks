import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const usersFile = resolve(process.cwd(), "data/users.json");

type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  token: string;
  lastLoginDate: string;
  streak: number;
  readiness: number;
  solved: number;
  studyMinutes: number;
  completedPracticeIds?: string[];
};

async function readUsers(): Promise<UserRecord[]> {
  try {
    return JSON.parse(await readFile(usersFile, "utf8")) as UserRecord[];
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]) {
  await mkdir(dirname(usersFile), { recursive: true });
  await writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function isPasswordValid(password: string, user: UserRecord) {
  const actual = Buffer.from(hashPassword(password, user.passwordSalt), "hex");
  const expected = Buffer.from(user.passwordHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function dateDifferenceInDays(previousDate: string, currentDate: string) {
  const previous = Date.parse(`${previousDate}T00:00:00Z`);
  const current = Date.parse(`${currentDate}T00:00:00Z`);
  return Math.round((current - previous) / 86400000);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getUserFromToken(token: string | undefined) {
  if (!token) return undefined;
  return readUsers().then((users) => users.find((user) => user.token === token));
}

router.get("/auth/users", async (_req, res) => {
  const users = await readUsers();
  res.json(users.map(({ id, name, email, lastLoginDate, streak, readiness, solved, studyMinutes }) => ({
    id,
    name,
    email,
    lastLoginDate,
    streak,
    readiness,
    solved,
    studyMinutes,
  })));
});

router.post("/auth/login", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
    res.status(400).json({ message: "Enter a name, valid email, and password with at least 6 characters." });
    return;
  }

  const users = await readUsers();
  const currentDate = today();
  const existing = users.find((user) => user.email === email);

  if (existing) {
    if (!isPasswordValid(password, existing)) {
      res.status(401).json({ message: "That email or password is incorrect." });
      return;
    }

    const daysSinceLogin = dateDifferenceInDays(existing.lastLoginDate, currentDate);
    existing.streak = daysSinceLogin === 1 ? existing.streak + 1 : daysSinceLogin > 1 ? 1 : existing.streak;
    existing.lastLoginDate = currentDate;
    existing.name = name;
    existing.token = randomBytes(32).toString("hex");
    await writeUsers(users);
    res.json({ token: existing.token, user: { id: existing.id, name: existing.name, email: existing.email }, dashboard: toDashboard(existing) });
    return;
  }

  const salt = randomBytes(16).toString("hex");
  const user: UserRecord = {
    id: randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password, salt),
    passwordSalt: salt,
    token: randomBytes(32).toString("hex"),
    lastLoginDate: currentDate,
    streak: 1,
    readiness: 0,
    solved: 0,
    studyMinutes: 0,
  };

  users.push(user);
  await writeUsers(users);
  res.status(201).json({ token: user.token, user: { id: user.id, name: user.name, email: user.email }, dashboard: toDashboard(user) });
});

router.post("/auth/progress", async (req, res) => {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const users = await readUsers();
  const user = users.find((candidate) => candidate.token === token);
  if (!user) {
    res.status(401).json({ message: "Sign in before recording progress." });
    return;
  }

  const activity = req.body?.activity;
  const minutes = Number(req.body?.minutes) || 0;
  const practiceId = typeof req.body?.practiceId === "string" ? req.body.practiceId : undefined;
  const validActivities = new Set(["problem_solved", "course", "core_cs", "mock_test"]);
  if (!validActivities.has(activity)) {
    res.status(400).json({ message: "Unknown progress activity." });
    return;
  }

  user.completedPracticeIds ??= [];
  if (activity === "problem_solved") {
    if (!practiceId) {
      res.status(400).json({ message: "A practice problem id is required." });
      return;
    }
    if (user.completedPracticeIds.includes(practiceId)) {
      res.json({ dashboard: toDashboard(user), alreadyCompleted: true });
      return;
    }
    user.completedPracticeIds.push(practiceId);
    user.solved += 1;
    user.readiness = Math.min(100, user.readiness + 5);
  } else {
    user.studyMinutes += Math.max(0, Math.round(minutes));
    user.readiness = Math.min(100, user.readiness + (activity === "mock_test" ? 10 : 3));
  }

  await writeUsers(users);
  res.json({ dashboard: toDashboard(user), alreadyCompleted: false });
});

export function toDashboard(user: UserRecord) {
  return {
    readiness: user.readiness,
    solved: user.solved,
    streak: user.streak,
    studyMinutes: user.studyMinutes,
    continueTopic: "Start your first practice session",
    heatmap: [],
  };
}

export default router;
