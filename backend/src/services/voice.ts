import { logActivity } from "./activity";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
// Default: Rachel voice — warm, clear, natural English
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const AT_API_KEY = process.env.AT_API_KEY!;
const AT_USERNAME = process.env.AT_USERNAME || "sandbox";

// ─── ELEVENLABS TTS ───────────────────────────────────────────────────────────
// Returns a buffer of MP3 audio from text

export async function textToSpeech(text: string): Promise<Buffer | null> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      console.error("ElevenLabs error:", response.status, await response.text());
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("ElevenLabs TTS error:", error);
    return null;
  }
}

// ─── AFRICA'S TALKING VOICE ───────────────────────────────────────────────────
// Makes an outbound call that plays a TTS message

export async function makeVoiceCall(
  phoneNumber: string,
  message: string,
  callbackUrl?: string
): Promise<boolean> {
  try {
    const phone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+254${phoneNumber.replace(/^0/, "")}`;

    // AT Voice uses XML-like call actions
    // We serve the audio from our own endpoint
    const encodedMessage = encodeURIComponent(message);
    const voiceUrl = `${process.env.BACKEND_URL || "https://kazigo-backend.up.railway.app"}/voice/tts?text=${encodedMessage}`;

    const body = new URLSearchParams({
      username: AT_USERNAME,
      apiKey: AT_API_KEY,
      to: phone,
      from: process.env.AT_CALLER_ID || "",
      url: voiceUrl,
    });

    const response = await fetch(
      "https://voice.africastalking.com/call",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        body: body.toString(),
      }
    );

    const data = await response.json();
    await logActivity("voice", "shield", `Voice call to ${phone}: ${message.substring(0, 60)}...`, phone);
    console.log("AT Voice response:", data);
    return true;
  } catch (error) {
    console.error("AT Voice call error:", error);
    return false;
  }
}

// ─── VOICE MESSAGES ───────────────────────────────────────────────────────────

export async function callWithJobAlert(
  phone: string,
  workerName: string,
  jobTitle: string,
  budget: number,
  location: string
): Promise<void> {
  const firstName = workerName.split(" ")[0];
  const message = `Hello ${firstName}! This is KaziGo. You have a new job match. ${jobTitle} in ${location}. The budget is K E S ${budget.toLocaleString()}, secured in escrow. Dial star 384 star 17825 hash to accept this job. Good luck!`;
  await makeVoiceCall(phone, message);
  await logActivity("voice", "identity", `Job alert voice call to ${workerName} for "${jobTitle}"`, phone);
}

export async function callWithPaymentConfirmation(
  phone: string,
  workerName: string,
  amount: number,
  jobTitle: string,
  kaziScore: number
): Promise<void> {
  const firstName = workerName.split(" ")[0];
  const message = `Congratulations ${firstName}! Your payment of K E S ${amount.toLocaleString()} for ${jobTitle} has been released to your M-Pesa. Your KaziScore is now ${kaziScore}. Keep up the great work. This is KaziGo — Work, Earn, Rise, Together.`;
  await makeVoiceCall(phone, message);
  await logActivity("voice", "wallet", `Payment confirmation call to ${workerName}: KES ${amount}`, phone);
}

export async function callWithGuideAdvice(
  phone: string,
  workerName: string,
  advice: string
): Promise<void> {
  const firstName = workerName.split(" ")[0];
  const message = `Hello ${firstName}, this is your KaziGo Guide. Here is your advice. ${advice}. Dial star 384 star 17825 hash anytime to access more guidance. Good luck!`;
  await makeVoiceCall(phone, message);
  await logActivity("voice", "guide", `Guide voice call to ${workerName}`, phone);
}

export async function callDisputeMediation(
  workerPhone: string,
  clientPhone: string,
  jobTitle: string
): Promise<void> {
  const message = `This is KaziGo mediation for the job ${jobTitle}. Both parties are being connected. Please state your concern clearly. KaziGo will review all evidence and resolve this dispute within 24 hours.`;
  await makeVoiceCall(workerPhone, message);
  await makeVoiceCall(clientPhone, message);
  await logActivity("voice", "shield", `Dispute mediation calls for "${jobTitle}"`, workerPhone);
}
