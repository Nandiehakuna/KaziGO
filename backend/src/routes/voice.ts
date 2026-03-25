import { Router, Request, Response } from "express";
import { textToSpeech, callWithGuideAdvice, callDisputeMediation } from "../services/voice";
import { prisma } from "../lib/prisma";
import { getGuideAdvice } from "../services/guide";
import { logActivity } from "../services/activity";

const router = Router();

// ─── TTS ENDPOINT ─────────────────────────────────────────────────────────────
// AT Voice calls this URL and plays the returned MP3

router.get("/tts", async (req: Request, res: Response) => {
  const text = req.query.text as string;
  if (!text) return res.status(400).send("No text provided");

  const decoded = decodeURIComponent(text);
  const audio = await textToSpeech(decoded);

  if (!audio) {
    // Fallback: return AT Voice XML that uses built-in TTS
    res.set("Content-Type", "application/xml");
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="en-US-Standard-D">${decoded}</Say>
</Response>`);
  }

  res.set("Content-Type", "audio/mpeg");
  res.set("Content-Length", audio.length.toString());
  res.send(audio);
});

// ─── AT VOICE WEBHOOK ─────────────────────────────────────────────────────────
// AT calls this when a call event happens (answered, DTMF input, etc.)

router.post("/webhook", async (req: Request, res: Response) => {
  const { sessionId, direction, callerNumber, destinationNumber, dtmfDigits, durationInSeconds, status } = req.body;

  await logActivity("voice", "shield",
    `Voice event: ${status || direction} — ${callerNumber} ${dtmfDigits ? `pressed ${dtmfDigits}` : ""}`,
    callerNumber
  );

  // Handle DTMF input during job acceptance call
  if (dtmfDigits === "1") {
    // Worker pressed 1 to accept job — log it
    await logActivity("voice", "identity", `Worker ${callerNumber} accepted job via voice`, callerNumber);
  }

  res.set("Content-Type", "application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
});

// ─── TRIGGER GUIDE VOICE CALL ─────────────────────────────────────────────────

router.post("/guide-call", async (req: Request, res: Response) => {
  const { workerId, question } = req.body;

  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) return res.status(404).json({ error: "Worker not found" });

  // Get advice from Claude
  const advice = await getGuideAdvice(worker, question || "general_advice");

  // Call the worker with the advice
  await callWithGuideAdvice(worker.phone, worker.name, advice);

  res.json({ success: true, message: "Guide call initiated" });
});

// ─── TRIGGER DISPUTE CALL ─────────────────────────────────────────────────────

router.post("/dispute-call", async (req: Request, res: Response) => {
  const { jobId } = req.body;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { worker: true, client: true },
  });

  if (!job || !job.worker || !job.client) {
    return res.status(404).json({ error: "Job, worker or client not found" });
  }

  await prisma.job.update({ where: { id: jobId }, data: { status: "DISPUTED" } });
  await callDisputeMediation(job.worker.phone, job.client.phone, job.title);

  res.json({ success: true });
});

// ─── VOICE STATUS ─────────────────────────────────────────────────────────────

router.get("/status", (req: Request, res: Response) => {
  res.json({
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
    atVoice: !!process.env.AT_API_KEY,
  });
});

export default router;

// ─── BROWSER AUDIO PREVIEW (for demo) ────────────────────────────────────────
// Frontend calls this and plays audio directly in browser — no phone needed

router.get("/preview", async (req: Request, res: Response) => {
  const text = req.query.text as string;
  if (!text) return res.status(400).json({ error: "No text" });

  const decoded = decodeURIComponent(text);
  const audio = await textToSpeech(decoded);

  if (!audio) {
    return res.status(500).json({ error: "TTS failed — check ELEVENLABS_API_KEY" });
  }

  res.set("Content-Type", "audio/mpeg");
  res.set("Access-Control-Allow-Origin", "*");
  res.send(audio);
});
