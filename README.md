# KaziGo 🇰🇪
### Work. Earn. Rise. Together.

**KaziGo** is the operating system for the informal African worker — built for the woman who has skills, a phone, and no foundation beneath her.

> *"We didn't build Fiverr for Africa. We built the trust infrastructure that makes informal work safe — for the 35 million workers who don't have a smartphone, a bank account, or a way to prove they're reliable."*

---

## The Problem

50 million informal gig workers in Africa face three broken realities:
- **No identity** — no verifiable work history, no proof of skill
- **No safety** — clients ghost after delivery, payment is never guaranteed
- **No financial access** — banks won't lend without a credit history that doesn't exist

## The Solution — 5 Pillars

| Pillar | What it does | AT API |
|---|---|---|
| **IMARA Identity** | Verified work history built from every USSD interaction | USSD · SMS |
| **IMARA Shield** | Escrow locks payment before work starts, releases on completion | Payments · Voice |
| **IMARA Circle** | Digital chama — bid collectively, split earnings automatically | USSD · SMS · Payments |
| **IMARA Wallet** | Earnings tracker that builds a financial identity over time | Payments · Airtime |
| **IMARA Guide** | Claude AI mentor delivered via SMS and voice call | SMS · Voice · Chat |

Plus **KaziScore** — a credit scoring system that turns gig earnings into bankable financial identity.

---

## Technology Stack

**Backend:** Node.js · Express · TypeScript · Prisma ORM · PostgreSQL (Neon)

**Frontend:** Next.js 14 · TypeScript · Tailwind CSS

**APIs:**
- Africa's Talking: USSD · SMS · Voice · Payments · Airtime
- ElevenLabs: Text-to-Speech for voice calls
- Anthropic Claude: AI mentor (IMARA Guide)

---

## Africa's Talking APIs Used

- **USSD** — primary interface, works on any phone with no internet
- **SMS** — job alerts, payment confirmations, Guide advice, two-way messaging
- **Voice** — outbound calls with ElevenLabs TTS: job alerts, payment confirmations, dispute mediation
- **Payments** — escrow lock and release, airtime rewards
- **Airtime** — reward workers on registration and milestones

---

## How It Works

```
Freelancer dials *384*17825#
→ Registers: name, skill, location
→ Gets job alert via SMS + Voice call
→ Accepts job via USSD
→ KES locked in escrow — "Your money is SAFE"
→ Work happens
→ Client confirms on web dashboard
→ Payment released to M-Pesa
→ Voice call: "Congratulations! KES 1,200 sent."
→ KaziScore updates
→ Loan recommendations unlock
```

---

## IMARA Circle — The Chama Feature

Inspired by the East African chama tradition:

```
Amina dials *384*17825# → My Circle → Create
→ Names circle "Westlands Sewers"
→ Invites members by phone number
→ Circle receives SMS invites
→ Circle bids on large collective jobs
→ Earnings split automatically on completion
→ 5% auto-saved to group emergency pool
```

---

## KaziScore

A credit score built entirely from gig work data:

| Factor | Weight |
|---|---|
| Earnings consistency | 30% |
| Job completion rate | 25% |
| Client ratings | 20% |
| Platform tenure | 15% |
| Circle membership + savings | 10% |

Score range: 300–850. Banks recommended based on tier.

---

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Fill in: DATABASE_URL, AT_API_KEY, AT_USERNAME=sandbox,
#          ANTHROPIC_API_KEY, ELEVENLABS_API_KEY

npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Create .env.local:
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm run dev
```

### Africa's Talking Setup

1. Create sandbox account at africastalking.com
2. Create USSD channel — set callback to `https://YOUR-URL/ussd`
3. Set SMS inbox callback to `https://YOUR-URL/sms/incoming`
4. Set Voice callback to `https://YOUR-URL/voice/webhook`

### Test USSD locally

```bash
curl -X POST http://localhost:3001/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test1&serviceCode=*384*17825%23&phoneNumber=%2B254712345678&text="
```

---

## Deployment

**Backend → Railway:**
```bash
railway login
railway new
railway add --plugin postgresql
railway up
```

**Frontend → Vercel:**
```bash
vercel --cwd frontend
# Set NEXT_PUBLIC_API_URL to Railway backend URL
```

---

## Demo Script

1. Dial `*384*17825#` in AT simulator — register as Amina
2. Post a tailoring job on web dashboard → Amina gets SMS + voice call
3. Amina accepts via USSD → escrow locks
4. Client marks complete → payment releases → Amina gets congratulations voice call
5. View KaziScore → see loan recommendations
6. Create a Circle → show chama formation
7. Open Admin Live Panel — all AT API calls visible in real time

---

## Built For

Africa's Talking Women in Tech Hackathon — *Freelancing and Gig Economy Platforms*

**Team:** Solo

---

## License

MIT
