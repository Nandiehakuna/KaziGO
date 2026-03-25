import "express-async-errors";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { handleUSSD } from "./controllers/ussd";
import apiRouter from "./routes/api";
import voiceRouter from "./routes/voice";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    process.env.FRONTEND_URL || "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "KaziGo API",
    timestamp: new Date().toISOString(),
    voice: !!process.env.ELEVENLABS_API_KEY,
  });
});

// Africa's Talking webhooks
app.post("/ussd", handleUSSD);
app.post("/sms/incoming", (req, res) => res.redirect(307, "/api/sms/incoming"));

// Voice routes (ElevenLabs + AT Voice)
app.use("/voice", voiceRouter);

// API routes
app.use("/api", apiRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong", message: err.message });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║  KaziGo API running on :${PORT}             ║
  ║  Work. Earn. Rise. Together.             ║
  ║  Voice: ${process.env.ELEVENLABS_API_KEY ? "ElevenLabs ✓" : "Add ELEVENLABS_API_KEY"} ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
