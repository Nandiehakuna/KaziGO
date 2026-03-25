# KaziGo — Deploy & Submit Guide
## Do this today before the hackathon

---

## Step 1 — Push to GitHub (5 min)

```bash
cd ~/projects/kazigo

# Initialize git if not already done
git init
git add .
git commit -m "KaziGo — Work. Earn. Rise. Together."

# Create repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/kazigo.git
git push -u origin main
```

---

## Step 2 — Deploy Backend to Railway (10 min)

1. Go to railway.app → Login with GitHub
2. New Project → Deploy from GitHub repo → select `kazigo`
3. Railway will detect the backend — set **Root Directory** to `/backend`
4. Go to Variables tab — add ALL of these:

```
DATABASE_URL=your_neon_postgres_url
AT_API_KEY=your_at_api_key
AT_USERNAME=sandbox
AT_SENDER_ID=KaziGo
ANTHROPIC_API_KEY=your_anthropic_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
NODE_ENV=production
FRONTEND_URL=https://kazigo.vercel.app
```

5. Railway will build and deploy — takes ~3 minutes
6. Go to Settings → Domains → Generate Domain
7. Copy your URL e.g. `https://kazigo-backend.up.railway.app`

---

## Step 3 — Update AT Sandbox Callback URLs (2 min)

With your Railway URL, update ALL callbacks in AT sandbox:

- USSD callback: `https://kazigo-backend.up.railway.app/ussd`
- SMS inbox callback: `https://kazigo-backend.up.railway.app/sms/incoming`
- Voice callback: `https://kazigo-backend.up.railway.app/voice/webhook`

No more ngrok! Permanent URL.

---

## Step 4 — Deploy Frontend to Vercel (5 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd ~/projects/kazigo/frontend
vercel

# When prompted:
# - Link to existing project? No
# - Project name: kazigo
# - Root directory: ./
# - Override settings? No
```

Then set environment variable in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://kazigo-backend.up.railway.app
```

Redeploy after setting the env var:
```bash
vercel --prod
```

Your frontend URL: `https://kazigo.vercel.app`

---

## Step 5 — AT Alphanumeric Sender ID (2 min)

In AT sandbox dashboard:
1. Go to SMS → Alphanumeric Sender IDs
2. Click "Add Sender ID"
3. Enter: `KaziGo`
4. It's approved instantly in sandbox

Workers will now receive SMS from "KaziGo" not a number.

---

## Step 6 — Test Everything End to End (10 min)

```bash
# 1. USSD still works
curl -X POST https://kazigo-backend.up.railway.app/ussd \
  -d "sessionId=test1&serviceCode=*384*17825%23&phoneNumber=%2B254759660596&text="

# 2. Workers API works  
curl https://kazigo-backend.up.railway.app/api/workers

# 3. Admin stats work
curl https://kazigo-backend.up.railway.app/api/admin/stats

# 4. Voice preview works
curl "https://kazigo-backend.up.railway.app/voice/preview?text=Hello+Amina" --output test.mp3
# Open test.mp3 — you should hear Rachel's voice
```

---

## Step 7 — Submit to Hackathon

Submit these links:
- **GitHub repo**: `https://github.com/YOUR_USERNAME/kazigo`
- **Live demo**: `https://kazigo.vercel.app`
- **API**: `https://kazigo-backend.up.railway.app`

---

## Step 8 — AT Marketplace (if required)

1. Go to AT Marketplace → Submit Plugin
2. Name: `KaziGo`
3. Description: paste from README
4. Callback URL: `https://kazigo-backend.up.railway.app`
5. APIs used: USSD, SMS, Voice, Payments, Airtime

---

## Demo Checklist for Presentation

- [ ] Backend live on Railway ✓
- [ ] Frontend live on Vercel ✓  
- [ ] AT USSD callback pointing to Railway URL ✓
- [ ] Amina registered in production DB ✓
- [ ] AT simulator working with new URL ✓
- [ ] Voice preview plays in browser when job posted ✓
- [ ] Pitch deck open and ready ✓
- [ ] Admin live panel open on second screen ✓

---

## 5-Minute Demo Script

**0:00** — "Meet Amina. She's a tailor in Westlands. She has a basic phone and zero access to the formal economy. Watch what happens in the next 5 minutes."

**0:45** — Dial `*384*17825#` in AT simulator. Register Amina live.

**1:30** — Open `kazigo.vercel.app/jobs`. Post a tailoring job. Show the voice alert playing in browser — "Hello Amina, new job!"

**2:30** — Switch to AT simulator. Amina sees the job, accepts it. Show "KES 1,200 secured in escrow. Your money is SAFE."

**3:15** — Click Mark Complete on dashboard. Show payment released. Voice plays: "Congratulations Amina!"

**3:45** — Open `/kaziscore`. Show Amina's KaziScore. Show bank recommendations. "This score didn't exist before KaziGo."

**4:15** — Show `/admin` live panel. All AT API calls visible. "Every USSD dial, every SMS, every payment — live."

**4:45** — "KaziGo is not a marketplace. It is the operating system the informal African worker never had. Work. Earn. Rise. Together."

---

## Answers to Common Judge Questions

**"How is this different from Fiverr/Upwork?"**
Those are built for smartphone users with bank accounts. KaziGo works on a KSh 1,500 feature phone with no internet. The USSD interface IS the product.

**"What happens with real money?"**
In production: AT Payments triggers M-Pesa STK push for clients and B2C transfer to workers. The code is production-ready — sandbox simulates the flow.

**"How do you make money?"**
5-8% transaction fee on escrow. Banks pay for KaziScore credit reports. Referral fees on loans matched through the platform.

**"What's the Circle feature?"**
A digital chama — East African women have been running savings groups for generations. We digitised it. Workers form a circle via USSD, bid on large collective jobs, earnings split automatically.

**"What's KaziScore?"**
A credit score built entirely from gig work data — earnings consistency, completion rate, client ratings, tenure. Banks can finally lend to informal workers because the data trail now exists.
