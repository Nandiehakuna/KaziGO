import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { sendJobAlert, sendEscrowConfirmation, sendCircleInvite, sendGuideMessage, sendAirtimeReward } from "../services/africastalking";
import { logActivity } from "../services/activity";
import { getGuideAdvice } from "../services/guide";

// USSD session state stored in memory (use Redis in production)
const sessions: Record<string, { step: string; data: Record<string, string> }> = {};

export async function handleUSSD(req: Request, res: Response): Promise<void> {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  const phone = phoneNumber.replace("+254", "0");
  const input = text ? text.trim() : "";
  const steps = input.split("*");
  const currentInput = steps[steps.length - 1];

  await logActivity("ussd", "identity", `USSD: ${phoneNumber} → "${input}"`, phoneNumber);

  let response = "";

  // Check if worker exists
  const worker = await prisma.worker.findUnique({ where: { phone: phoneNumber } });

  // ─── MAIN MENU ──────────────────────────────────────────────────────────────
  if (input === "") {
    if (!worker) {
      response = `CON Welcome to KaziGo!
Work. Earn. Rise. Together.
————————————
1. Register as Freelancer
2. I am a Returning Worker`;
    } else {
      response = `CON KaziGo — Welcome back ${worker.name.split(" ")[0]}!
Score: ${worker.score.toFixed(1)} | Jobs: ${worker.totalJobs}
————————————
1. My Identity
2. Available Jobs
3. My Circle
4. My Wallet
5. Ask KaziGo Guide
6. Emergency Alert`;
    }
  }

  // ─── REGISTRATION ───────────────────────────────────────────────────────────
  else if (input === "1" && !worker) {
    response = `CON Register with KaziGo
————————————
Enter your full name:`;
  }
  else if (steps[0] === "1" && steps.length === 2 && !worker) {
    sessions[sessionId] = { step: "register_name", data: { name: currentInput } };
    response = `CON Great, ${currentInput}!
————————————
What is your main skill?
1. Tailoring/Sewing
2. Graphic Design
3. Tutoring
4. Plumbing/Fundi
5. Catering/Cooking
6. Other`;
  }
  else if (steps[0] === "1" && steps.length === 3 && sessions[sessionId]?.step === "register_name") {
    const skillMap: Record<string, string> = { "1": "Tailoring", "2": "Graphic Design", "3": "Tutoring", "4": "Plumbing", "5": "Catering", "6": "Other" };
    const skill = skillMap[currentInput] || "Other";
    sessions[sessionId].data.skill = skill;
    sessions[sessionId].step = "register_skill";
    response = `CON Almost done!
————————————
Your location (town/area):`;
  }
  else if (steps[0] === "1" && steps.length === 4 && sessions[sessionId]?.step === "register_skill") {
    const { name, skill } = sessions[sessionId].data;
    const location = currentInput;

    await prisma.worker.create({
      data: { phone: phoneNumber, name, skill, location, score: 4.0 },
    });

    // Welcome airtime reward
    await sendAirtimeReward(phoneNumber, 5, "joining KaziGo");
    await logActivity("ussd", "identity", `New worker registered: ${name} (${skill}, ${location})`, phoneNumber);

    delete sessions[sessionId];
    response = `END Welcome to KaziGo, ${name}!
Your profile is live.

Skill: ${skill}
Location: ${location}
Starting Score: 4.0

You have been rewarded KES 5 airtime!
Watch for job alerts via SMS.
Dial *384*5757# anytime.`;
  }

  // ─── MY IDENTITY ────────────────────────────────────────────────────────────
  else if (input === "1" && worker) {
    const recentJobs = await prisma.job.findMany({
      where: { workerId: worker.id, status: "COMPLETED" },
      take: 3,
      orderBy: { completedAt: "desc" },
    });
    response = `CON My KaziGo Identity
————————————
Name: ${worker.name}
Skill: ${worker.skill}
Location: ${worker.location}
Score: ${worker.score.toFixed(1)}/5.0
Total Jobs: ${worker.totalJobs}
Verified: ${worker.verified ? "YES" : "Pending"}
————————————
1. View Recent Jobs
2. Back to Menu`;
  }

  // ─── AVAILABLE JOBS ─────────────────────────────────────────────────────────
  else if (input === "2" && worker) {
    const jobs = await prisma.job.findMany({
      where: { skill: worker.skill, status: "OPEN" },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    if (jobs.length === 0) {
      response = `CON No jobs right now.
————————————
We will SMS you when a
${worker.skill} job is posted
in ${worker.location}.
————————————
0. Back to Menu`;
    } else {
      let jobList = `CON Available ${worker.skill} Jobs\n————————————\n`;
      jobs.forEach((job, i) => {
        jobList += `${i + 1}. ${job.title}\n   KES ${job.budget.toLocaleString()} | ${job.location}\n`;
      });
      jobList += `————————————\nSelect job to accept:`;
      response = jobList;
      sessions[sessionId] = { step: "viewing_jobs", data: { jobIds: JSON.stringify(jobs.map(j => j.id)) } };
    }
  }

  // Accept a job
  else if (sessions[sessionId]?.step === "viewing_jobs" && ["1", "2", "3"].includes(currentInput) && worker) {
    const jobIds = JSON.parse(sessions[sessionId].data.jobIds || "[]");
    const jobId = jobIds[parseInt(currentInput) - 1];

    if (jobId) {
      const job = await prisma.job.update({
        where: { id: jobId },
        data: { workerId: worker.id, status: "ESCROW_LOCKED", escrowLocked: true, escrowAmount: job => job.budget },
        include: { client: true },
      });

      await sendEscrowConfirmation(phoneNumber, job.budget, job.title);
      await logActivity("payment", "shield", `Escrow locked: KES ${job.budget} for "${job.title}"`, phoneNumber);

      delete sessions[sessionId];
      response = `END Job Accepted!
————————————
"${job.title}"
KES ${job.budget.toLocaleString()} secured in escrow.

Your money is SAFE.
Start work when ready.
SMS sent with details.`;
    }
  }

  // ─── MY CIRCLE ──────────────────────────────────────────────────────────────
  else if (input === "3" && worker) {
    const membership = await prisma.circleMember.findFirst({
      where: { workerId: worker.id },
      include: { circle: true },
    });

    if (!membership) {
      response = `CON My KaziGo Circle
————————————
You are not in a circle yet.
Circles = stronger together!
————————————
1. Create a Circle
2. Join a Circle
0. Back to Menu`;
    } else {
      const circle = membership.circle;
      const memberCount = await prisma.circleMember.count({ where: { circleId: circle.id } });
      response = `CON ${circle.name}
————————————
Skill: ${circle.skill}
Members: ${memberCount}
Score: ${circle.collectiveScore.toFixed(1)}
Savings Pool: KES ${circle.savingsPool.toLocaleString()}
————————————
1. View Members
2. Circle Jobs
3. Savings Pool
0. Back`;
    }
  }

  // Create a circle
  else if (input === "3*1" && worker) {
    sessions[sessionId] = { step: "create_circle_name", data: {} };
    response = `CON Create Your Circle
————————————
Give your circle a name
(e.g. "Westlands Sewers"):`;
  }
  else if (sessions[sessionId]?.step === "create_circle_name" && worker) {
    sessions[sessionId].data.circleName = currentInput;
    sessions[sessionId].step = "create_circle_split";
    response = `CON Circle: "${currentInput}"
————————————
Earnings split type?
1. Equal split (recommended)
2. Custom split by role`;
  }
  else if (sessions[sessionId]?.step === "create_circle_split" && worker) {
    const { circleName } = sessions[sessionId].data;

    const circle = await prisma.circle.create({
      data: {
        name: circleName,
        skill: worker.skill,
        collectiveScore: worker.score,
        members: {
          create: {
            workerId: worker.id,
            role: "LEAD",
            splitPct: 40,
          },
        },
      },
    });

    await logActivity("ussd", "circle", `New circle created: ${circleName} by ${worker.name}`, phoneNumber);
    delete sessions[sessionId];

    response = `END Circle Created!
————————————
"${circleName}"
You are the Lead.

Share your circle code:
KAZIGO-${circle.id.substring(0, 6).toUpperCase()}

Members can join by
dialing *384*5757#
→ My Circle → Join`;
  }

  // ─── MY WALLET ──────────────────────────────────────────────────────────────
  else if (input === "4" && worker) {
    const entries = await prisma.walletEntry.findMany({
      where: { workerId: worker.id },
      orderBy: { createdAt: "desc" },
    });

    const totalEarnings = entries.filter(e => e.type === "EARNING").reduce((sum, e) => sum + e.amount, 0);
    const totalSavings = entries.filter(e => e.type === "SAVINGS").reduce((sum, e) => sum + e.amount, 0);

    response = `CON My KaziGo Wallet
————————————
Total Earned: KES ${totalEarnings.toLocaleString()}
Savings Pool: KES ${totalSavings.toLocaleString()}
Jobs Completed: ${worker.totalJobs}
————————————
1. Transaction History
2. Withdraw Earnings
3. View Savings
0. Back`;
  }

  // ─── GUIDE ──────────────────────────────────────────────────────────────────
  else if (input === "5" && worker) {
    response = `CON KaziGo Guide
Your AI business mentor
————————————
1. How to price my work
2. How to write a proposal
3. How to handle disputes
4. How to avoid scams
5. Ask a custom question
0. Back`;
  }
  else if (input === "5*5" && worker) {
    sessions[sessionId] = { step: "guide_question", data: {} };
    response = `CON Ask KaziGo Guide
————————————
Type your question
(reply sent via SMS):`;
  }
  else if (sessions[sessionId]?.step === "guide_question" && worker) {
    const question = currentInput;
    // Fire and forget — response comes via SMS
    getGuideAdvice(worker, question).then(advice => {
      sendGuideMessage(phoneNumber, advice);
    });

    delete sessions[sessionId];
    response = `END Question sent to Guide!
————————————
Your answer will arrive
via SMS in ~30 seconds.
KaziGo Guide is always
here for you.`;
  }
  else if (["5*1", "5*2", "5*3", "5*4"].includes(input) && worker) {
    const triggerMap: Record<string, string> = {
      "5*1": "pricing",
      "5*2": "proposal_writing",
      "5*3": "dispute_handling",
      "5*4": "scam_awareness",
    };
    const trigger = triggerMap[input];
    getGuideAdvice(worker, trigger).then(advice => {
      sendGuideMessage(phoneNumber, advice);
    });
    response = `END KaziGo Guide is thinking...
————————————
Advice will arrive via
SMS in ~30 seconds.
Stay sharp. Stay safe.`;
  }

  // ─── EMERGENCY ALERT ────────────────────────────────────────────────────────
  else if (input === "6" && worker) {
    response = `CON EMERGENCY ALERT
————————————
This will alert your
trusted contacts.
Are you sure?

1. YES — Send Alert Now
2. No — Go Back`;
  }
  else if (input === "6*1" && worker) {
    await logActivity("ussd", "shield", `EMERGENCY ALERT triggered by ${worker.name}`, phoneNumber);
    response = `END ALERT SENT!
————————————
Your trusted contacts
have been notified.
Stay calm. Help is coming.
KaziGo is with you.`;
  }

  // ─── FALLBACK ───────────────────────────────────────────────────────────────
  else {
    response = `CON KaziGo
————————————
Invalid option.
Press 0 to go back
or dial *384*5757#
to start over.`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
}
