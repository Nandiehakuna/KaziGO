import AfricasTalking from "africastalking";
import { logActivity } from "./activity";

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME || "sandbox",
});

const sms = at.SMS;
const payments = at.PAYMENTS;
const airtime = at.AIRTIME;

// ─── SMS ──────────────────────────────────────────────────────────────────────

export async function sendSMS(to: string, message: string): Promise<void> {
  try {
    await sms.send({
      to: [to.startsWith("+") ? to : `+254${to.replace(/^0/, "")}`],
      message,
      from: process.env.AT_SENDER_ID || "KaziGo",
    });
    await logActivity("sms", "shield", `SMS sent to ${to}: ${message.substring(0, 50)}...`, to);
  } catch (error) {
    console.error("SMS send error:", error);
  }
}

export async function sendJobAlert(phone: string, jobTitle: string, budget: number, location: string, jobId: string): Promise<void> {
  const msg = `KaziGo: New job match!\n"${jobTitle}" in ${location}\nBudget: KES ${budget.toLocaleString()}\nDial *384*5757# → Reply 1 to accept\nJob ID: ${jobId.substring(0, 8)}`;
  await sendSMS(phone, msg);
}

export async function sendEscrowConfirmation(phone: string, amount: number, jobTitle: string): Promise<void> {
  const msg = `KaziGo: Payment secured!\nKES ${amount.toLocaleString()} is locked in escrow for "${jobTitle}". Start your work — you will be paid on completion.\nStay safe. KaziGo has you covered.`;
  await sendSMS(phone, msg);
}

export async function sendPaymentReleased(phone: string, amount: number, jobTitle: string): Promise<void> {
  const msg = `KaziGo: You've been paid!\nKES ${amount.toLocaleString()} has been sent to your M-Pesa for completing "${jobTitle}".\nYour KaziGo score has been updated. Keep earning!`;
  await sendSMS(phone, msg);
}

export async function sendCircleInvite(phone: string, circleName: string, inviterName: string): Promise<void> {
  const msg = `KaziGo: ${inviterName} has invited you to join "${circleName}" circle.\nDial *384*5757# to accept and start earning together.\nUnity is strength — Umoja ni nguvu.`;
  await sendSMS(phone, msg);
}

export async function sendCircleJobAlert(phones: string[], jobTitle: string, budget: number, circleId: string): Promise<void> {
  for (const phone of phones) {
    const msg = `KaziGo Circle: New group job!\n"${jobTitle}"\nTotal: KES ${budget.toLocaleString()}\nYour circle has been matched. Dial *384*5757# → My Circle to accept.\nEarnings split automatically on completion.`;
    await sendSMS(phone, msg);
  }
}

export async function sendGuideMessage(phone: string, advice: string): Promise<void> {
  const msg = `KaziGo Guide:\n${advice}\n\nReply GUIDE to ask a question anytime.`;
  await sendSMS(phone, msg);
}

export async function sendEmergencyAlert(phone: string, workerName: string, location: string): Promise<void> {
  const msg = `KaziGo ALERT: ${workerName} has triggered an emergency alert from ${location}. Please check on them immediately.`;
  await sendSMS(phone, msg);
}

// ─── PAYMENTS (Escrow simulation via AT Payments) ─────────────────────────────

export async function lockEscrow(jobId: string, amount: number, clientPhone: string): Promise<boolean> {
  try {
    // In sandbox mode this simulates a payment hold
    await logActivity("payment", "shield", `Escrow locked: KES ${amount} for job ${jobId}`, clientPhone, JSON.stringify({ jobId, amount, type: "ESCROW_LOCK" }));
    return true;
  } catch (error) {
    console.error("Escrow lock error:", error);
    return false;
  }
}

export async function releaseEscrow(workerPhone: string, amount: number, jobId: string): Promise<boolean> {
  try {
    // In production this would trigger AT mobile money transfer
    await logActivity("payment", "shield", `Escrow released: KES ${amount} to ${workerPhone}`, workerPhone, JSON.stringify({ jobId, amount, type: "ESCROW_RELEASE" }));
    return true;
  } catch (error) {
    console.error("Escrow release error:", error);
    return false;
  }
}

export async function splitCircleEarnings(members: { phone: string; name: string; splitPct: number }[], totalAmount: number, jobTitle: string): Promise<void> {
  for (const member of members) {
    const memberAmount = Math.floor((totalAmount * member.splitPct) / 100);
    await releaseEscrow(member.phone, memberAmount, jobTitle);
    await sendPaymentReleased(member.phone, memberAmount, jobTitle);
  }
  await logActivity("payment", "circle", `Circle earnings split: KES ${totalAmount} across ${members.length} members`, undefined, JSON.stringify({ members, totalAmount }));
}

// ─── AIRTIME (Rewards) ────────────────────────────────────────────────────────

export async function sendAirtimeReward(phone: string, amount: number, reason: string): Promise<void> {
  try {
    await airtime.send({
      recipients: [{
        phoneNumber: phone.startsWith("+") ? phone : `+254${phone.replace(/^0/, "")}`,
        amount: `KES ${amount}`,
        currencyCode: "KES",
      }],
    });
    await logActivity("airtime", "wallet", `Airtime reward: KES ${amount} to ${phone} for ${reason}`, phone);
  } catch (error) {
    console.error("Airtime send error:", error);
  }
}
