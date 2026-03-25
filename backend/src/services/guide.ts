import Anthropic from "@anthropic-ai/sdk";
import { Worker } from "@prisma/client";
import { logActivity } from "./activity";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are KaziGo Guide — a warm, practical business mentor for informal gig workers in Africa. You speak simply, directly and encouragingly. Your advice is always actionable, specific to the African gig economy context, and delivered in plain language that works over SMS.

Rules:
- Keep responses under 160 characters when possible (SMS limit)
- Never use jargon or complex language
- Always be encouraging and warm
- Ground advice in East African market realities (KES pricing, Kenyan context)
- If the worker has job history, reference it
- End with one clear action they can take today`;

const TRIGGER_PROMPTS: Record<string, string> = {
  pricing: "Give me practical advice on how to price my gig work fairly. What should I charge?",
  proposal_writing: "How do I write a good proposal to win a job from a client?",
  dispute_handling: "A client is refusing to pay or causing problems. What should I do?",
  scam_awareness: "How do I spot and avoid scams when looking for gig work online?",
  first_job: "I just got my first job on KaziGo! What should I do to make sure it goes well?",
  payment_received: "I just received payment for a completed job. Any advice on managing this money?",
};

export async function getGuideAdvice(worker: Worker, triggerOrQuestion: string): Promise<string> {
  try {
    const prompt = TRIGGER_PROMPTS[triggerOrQuestion] || triggerOrQuestion;

    const workerContext = `Worker profile: ${worker.name}, skill: ${worker.skill}, location: ${worker.location}, score: ${worker.score.toFixed(1)}, total jobs: ${worker.totalJobs}.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${workerContext}\n\nQuestion: ${prompt}`,
        },
      ],
    });

    const advice = message.content[0].type === "text" ? message.content[0].text : "Keep working hard and stay safe. You are building something great.";

    await logActivity("guide", "guide", `Guide advice for ${worker.name}: ${triggerOrQuestion}`, worker.phone, JSON.stringify({ trigger: triggerOrQuestion, response: advice.substring(0, 100) }));

    return advice;
  } catch (error) {
    console.error("Guide error:", error);
    return `Keep going, ${worker.name.split(" ")[0]}! Every job you complete builds your reputation. Stay safe, deliver quality work, and always get payment confirmed before you start.`;
  }
}
