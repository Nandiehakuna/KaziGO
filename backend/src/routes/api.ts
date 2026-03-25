import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendJobAlert, sendCircleJobAlert, releaseEscrow, sendPaymentReleased, lockEscrow, sendSMS } from "../services/africastalking";
import { logActivity } from "../services/activity";
import { getGuideAdvice } from "../services/guide";
import { callWithJobAlert, callWithPaymentConfirmation } from "../services/voice";

const router = Router();

// ─── KAZISCORE ────────────────────────────────────────────────────────────────

async function calculateKaziScore(workerId: string): Promise<number> {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      jobsAsWorker: true,
      walletEntries: { where: { type: "EARNING" } },
      ratingsReceived: true,
      circleMembers: true,
    },
  });
  if (!worker) return 300;

  const completedJobs = worker.jobsAsWorker.filter(j => j.status === "COMPLETED").length;
  const acceptedJobs = worker.jobsAsWorker.length;
  const completionRate = acceptedJobs > 0 ? completedJobs / acceptedJobs : 0;

  const earnings = worker.walletEntries.map(e => e.amount);
  const totalEarnings = earnings.reduce((s, e) => s + e, 0);
  const avgEarning = earnings.length > 0 ? totalEarnings / earnings.length : 0;
  const earningsScore = Math.min(255, (avgEarning / 5000) * 255);
  const completionScore = completionRate * 212;

  const ratings = worker.ratingsReceived.map(r => r.score);
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : worker.score;
  const ratingScore = (avgRating / 5) * 170;

  const monthsActive = Math.max(1, (Date.now() - new Date(worker.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const tenureScore = Math.min(128, Math.log(monthsActive + 1) * 40);
  const circleScore = worker.circleMembers.length > 0 ? 85 : 0;

  const total = Math.round(300 + earningsScore + completionScore + ratingScore + tenureScore + circleScore);
  return Math.min(850, Math.max(300, total));
}

function getKaziScoreTier(score: number) {
  if (score >= 700) return { tier: "Prime", banks: "KCB · Stanbic · NCBA · Equity", color: "green" };
  if (score >= 500) return { tier: "Established", banks: "Equity Bank · Co-op · Faulu Kenya", color: "amber" };
  return { tier: "Building", banks: "M-Shwari · KCB Mobi · microloans", color: "red" };
}

// ─── WORKERS ──────────────────────────────────────────────────────────────────

router.get("/workers", async (req: Request, res: Response) => {
  const workers = await prisma.worker.findMany({
    orderBy: { score: "desc" },
    include: { _count: { select: { jobsAsWorker: true } } },
  });
  res.json(workers);
});

router.get("/workers/:id/kaziscore", async (req: Request, res: Response) => {
  const score = await calculateKaziScore(req.params.id);
  res.json({ score, ...getKaziScoreTier(score) });
});

router.get("/workers/by-phone/:phone", async (req: Request, res: Response) => {
  const worker = await prisma.worker.findUnique({
    where: { phone: req.params.phone },
    include: {
      jobsAsWorker: { take: 5, orderBy: { createdAt: "desc" } },
      walletEntries: { take: 10, orderBy: { createdAt: "desc" } },
      circleMembers: { include: { circle: true } },
    },
  });
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  const kaziScore = await calculateKaziScore(worker.id);
  res.json({ ...worker, kaziScore, ...getKaziScoreTier(kaziScore) });
});

// ─── JOBS ─────────────────────────────────────────────────────────────────────

router.get("/jobs", async (req: Request, res: Response) => {
  const { status, skill } = req.query;
  const jobs = await prisma.job.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(skill ? { skill: skill as string } : {}),
    },
    include: { client: true, worker: true, messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(jobs);
});

router.post("/jobs", async (req: Request, res: Response) => {
  const { title, description, skill, location, budget, clientPhone, clientName } = req.body;

  let client = await prisma.client.findUnique({ where: { phone: clientPhone } });
  if (!client) client = await prisma.client.create({ data: { phone: clientPhone, name: clientName } });

  const job = await prisma.job.create({
    data: { title, description, skill, location, budget: parseFloat(budget), clientId: client.id },
  });

  let workers = await prisma.worker.findMany({ where: { skill }, take: 5, orderBy: { score: "desc" } });
  if (workers.length === 0) workers = await prisma.worker.findMany({ take: 5, orderBy: { score: "desc" } });

  for (const w of workers) {
    await sendJobAlert(w.phone, title, parseFloat(budget), location, job.id);
    // Voice call for extra reach — fire and forget
    callWithJobAlert(w.phone, w.name, title, parseFloat(budget), location).catch(console.error);
  }
  await logActivity("sms", "identity", `Job posted: "${title}" — ${workers.length} workers alerted`, clientPhone);
  res.json({ job, matchedWorkers: workers.length });
});

router.patch("/jobs/:id", async (req: Request, res: Response) => {
  const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.status === "COMPLETED") return res.status(400).json({ error: "Cannot edit completed job" });

  const { title, description, budget, location, skill } = req.body;
  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(budget && { budget: parseFloat(budget) }),
      ...(location && { location }),
      ...(skill && { skill }),
    },
    include: { client: true, worker: true },
  });
  res.json(job);
});

// ─── JOB MESSAGES ─────────────────────────────────────────────────────────────

router.get("/jobs/:id/messages", async (req: Request, res: Response) => {
  const messages = await prisma.jobMessage.findMany({
    where: { jobId: req.params.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

router.post("/jobs/:id/messages", async (req: Request, res: Response) => {
  const { senderType, senderName, message } = req.body;
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { worker: true, client: true },
  });
  if (!job) return res.status(404).json({ error: "Not found" });

  const msg = await prisma.jobMessage.create({
    data: { jobId: req.params.id, senderType, senderName, message },
  });

  if (senderType === "client" && job.worker) {
    await sendSMS(job.worker.phone, `KaziGo: Message from client for "${job.title}":\n"${message}"\nDial *384*17825# to reply.`);
  } else if (senderType === "worker" && job.client) {
    await sendSMS(job.client.phone, `KaziGo: Message from ${senderName}:\n"${message}"`);
  }

  res.json(msg);
});

// ─── ESCROW ────────────────────────────────────────────────────────────────────

router.post("/jobs/:id/lock-escrow", async (req: Request, res: Response) => {
  const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.escrowLocked) return res.json({ message: "Already locked", job: existing });

  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: { status: "ESCROW_LOCKED", escrowLocked: true, escrowAmount: existing.budget },
    include: { worker: true, client: true },
  });

  await lockEscrow(job.id, job.budget, job.client?.phone || "");

  if (job.worker) {
    await sendSMS(job.worker.phone,
      `KaziGo: Payment secured!\nKES ${job.budget.toLocaleString()} locked in escrow for "${job.title}".\nYour money is SAFE. Start work when ready.`
    );
  }

  await logActivity("payment", "shield", `Escrow locked: KES ${job.budget} for "${job.title}"`, job.client?.phone);
  res.json(job);
});

router.post("/jobs/:id/complete", async (req: Request, res: Response) => {
  const existing = await prisma.job.findUnique({ where: { id: req.params.id }, include: { worker: true } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.status === "COMPLETED") return res.json({ message: "Already completed", job: existing });

  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: { worker: true },
  });

  if (job.worker) {
    // GUARD: only create wallet entry once
    const alreadyPaid = await prisma.walletEntry.findFirst({ where: { jobId: job.id, type: "EARNING" } });

    if (!alreadyPaid) {
      await prisma.walletEntry.create({
        data: { workerId: job.worker.id, amount: job.budget, type: "EARNING", description: `Earned from: ${job.title}`, jobId: job.id },
      });
      await prisma.worker.update({ where: { id: job.worker.id }, data: { totalJobs: { increment: 1 } } });
    }

    const kaziScore = await calculateKaziScore(job.worker.id);
    const starScore = parseFloat(Math.min(5, Math.max(1, (kaziScore - 300) / 110)).toFixed(1));
    await prisma.worker.update({ where: { id: job.worker.id }, data: { score: starScore } });

    await releaseEscrow(job.worker.phone, job.budget, job.id);
    const ks = await calculateKaziScore(job.worker.id);
    callWithPaymentConfirmation(job.worker.phone, job.worker.name, job.budget, job.title, ks).catch(console.error);
    await sendPaymentReleased(job.worker.phone, job.budget, job.title);
    await logActivity("payment", "shield", `Escrow released: KES ${job.budget} to ${job.worker.name}`, job.worker.phone);
  }

  res.json(job);
});

// ─── CIRCLES ─────────────────────────────────────────────────────────────────

router.get("/circles", async (req: Request, res: Response) => {
  const circles = await prisma.circle.findMany({
    include: { members: { include: { worker: true } }, _count: { select: { jobs: true } } },
  });
  res.json(circles);
});

router.get("/circles/:id/savings", async (req: Request, res: Response) => {
  const circle = await prisma.circle.findUnique({ where: { id: req.params.id } });
  if (!circle) return res.status(404).json({ error: "Not found" });
  const entries = await prisma.walletEntry.findMany({ where: { type: "SAVINGS" }, orderBy: { createdAt: "desc" } });
  res.json({ pool: circle.savingsPool, savingsPct: circle.savingsPct, entries });
});

router.post("/circles/:id/complete-job", async (req: Request, res: Response) => {
  const { jobId } = req.body;
  const existing = await prisma.job.findUnique({ where: { id: jobId } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.status === "COMPLETED") return res.json({ message: "Already completed" });

  const circle = await prisma.circle.findUnique({
    where: { id: req.params.id },
    include: { members: { include: { worker: true } } },
  });
  if (!circle) return res.status(404).json({ error: "Circle not found" });

  const savingsAmount = (existing.budget * circle.savingsPct) / 100;
  const distributableAmount = existing.budget - savingsAmount;

  for (const member of circle.members) {
    const splitPct = member.splitPct || Math.floor(100 / circle.members.length);
    const amount = Math.floor((distributableAmount * splitPct) / 100);
    const alreadyPaid = await prisma.walletEntry.findFirst({ where: { jobId, workerId: member.workerId, type: "EARNING" } });
    if (!alreadyPaid) {
      await prisma.walletEntry.create({ data: { workerId: member.workerId, amount, type: "EARNING", description: `Circle: ${existing.title}`, jobId } });
      await prisma.walletEntry.create({ data: { workerId: member.workerId, amount: Math.floor(savingsAmount / circle.members.length), type: "SAVINGS", description: `Circle savings: ${existing.title}`, jobId } });
      await sendPaymentReleased(member.worker.phone, amount, existing.title);
    }
  }

  await prisma.circle.update({ where: { id: circle.id }, data: { savingsPool: { increment: savingsAmount } } });
  await prisma.job.update({ where: { id: jobId }, data: { status: "COMPLETED", completedAt: new Date() } });
  await logActivity("payment", "circle", `Circle job completed: KES ${existing.budget}`, undefined);
  res.json({ success: true, totalSplit: distributableAmount, savingsAdded: savingsAmount });
});

// ─── WALLET ───────────────────────────────────────────────────────────────────

router.get("/wallet/:workerId", async (req: Request, res: Response) => {
  const entries = await prisma.walletEntry.findMany({
    where: { workerId: req.params.workerId },
    orderBy: { createdAt: "desc" },
  });
  const totalEarnings = entries.filter(e => e.type === "EARNING").reduce((s, e) => s + e.amount, 0);
  const totalSavings = entries.filter(e => e.type === "SAVINGS").reduce((s, e) => s + e.amount, 0);
  const kaziScore = await calculateKaziScore(req.params.workerId);
  res.json({ entries, totalEarnings, totalSavings, kaziScore, ...getKaziScoreTier(kaziScore) });
});

// ─── SMS INCOMING ─────────────────────────────────────────────────────────────

router.post("/sms/incoming", async (req: Request, res: Response) => {
  const { from, text } = req.body;
  await logActivity("sms", "guide", `Incoming SMS from ${from}: ${text}`, from);

  const worker = await prisma.worker.findUnique({ where: { phone: from } });
  if (worker && text) {
    const upper = text.toUpperCase().trim();
    const trigger = upper.includes("PRICE") ? "pricing"
      : upper.includes("PROPOSAL") ? "proposal_writing"
      : upper.includes("DISPUTE") ? "dispute_handling"
      : upper.includes("SCAM") ? "scam_awareness"
      : text;
    const advice = await getGuideAdvice(worker, trigger);
    await sendSMS(from, `KaziGo Guide:\n${advice}`);
  } else if (!worker) {
    await sendSMS(from, `KaziGo: Dial *384*17825# to register and start earning.`);
  }
  res.json({ received: true });
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (req: Request, res: Response) => {
  const [workers, jobs, circles, activity] = await Promise.all([
    prisma.worker.count(),
    prisma.job.count(),
    prisma.circle.count(),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const activeJobs = await prisma.job.count({ where: { status: { in: ["ESCROW_LOCKED", "IN_PROGRESS"] } } });
  const completedJobs = await prisma.job.count({ where: { status: "COMPLETED" } });
  const escrowJobs = await prisma.job.findMany({ where: { escrowLocked: true, status: { not: "COMPLETED" } }, select: { budget: true } });
  const totalEscrow = escrowJobs.reduce((s, j) => s + j.budget, 0);
  res.json({ workers, jobs, activeJobs, completedJobs, circles, totalEscrow, recentActivity: activity });
});

router.get("/admin/activity", async (req: Request, res: Response) => {
  const activity = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  res.json(activity);
});


// ─── GUIDE ASK ────────────────────────────────────────────────────────────────
router.post("/guide/ask", async (req: Request, res: Response) => {
  const { question, workerPhone } = req.body;
  
  let worker = null;
  if (workerPhone) {
    worker = await prisma.worker.findUnique({ where: { phone: workerPhone } });
  }
  if (!worker) {
    // Use first worker as fallback for demo
    worker = await prisma.worker.findFirst();
  }
  if (!worker) return res.status(404).json({ error: "No workers found" });

  const advice = await getGuideAdvice(worker, question);
  await logActivity("guide", "guide", `Guide web query: ${question.substring(0, 50)}`, worker.phone);
  res.json({ advice, workerName: worker.name });
});
export default router;

