# 🤖 Telegram Resume Bot

A Telegram chatbot that collects candidate profile data through a step-by-step conversation and stores the structured result in **MongoDB** — completely free, no credit card needed.

---

## 📁 Project Structure

```
telegram-resume-bot/
├── index.js                              # Entry point — starts bot with polling
├── package.json
├── .env.example                          # Copy to .env and fill values
├── .gitignore
└── src/
    ├── controllers/
    │   └── conversationController.js     # All slot-filling logic + MongoDB save
    ├── services/
    │   ├── telegramSender.js             # Sends text & button messages
    │   └── db.js                         # MongoDB connection
    ├── session/
    │   └── sessionStore.js               # Per-user conversation state (in-memory)
    └── models/
        └── Candidate.js                  # Mongoose schema
```

---

## 🔑 Step 1: Get Your Free Telegram Bot Token

This takes under 2 minutes:

1. Open Telegram and search for **@BotFather** (official, blue tick)
2. Send `/newbot`
3. Enter a **name** for your bot (e.g. `Resume Collector Bot`)
4. Enter a **username** ending in `bot` (e.g. `my_resume_collector_bot`)
5. BotFather replies with your token:
   ```
   Use this token to access the HTTP API:
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. Copy that token — this is your `TELEGRAM_BOT_TOKEN`

> ✅ That's it! No approval, no business account, no waiting.

---

## 🍃 Step 2: Set Up MongoDB (Free)

### Option A — MongoDB Atlas (Recommended, Free Cloud)
1. Go to **https://cloud.mongodb.com** → Sign up free
2. Create a free **M0 cluster** (no credit card needed)
3. Click **Connect** → **Connect your application**
4. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/resume_bot
   ```

### Option B — Local MongoDB
```
mongodb://localhost:27017/resume_bot
```

---

## ⚙️ Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/resume_bot
PORT=3000
```

---

## 🚀 Step 4: Install & Run

```bash
npm install
npm start
```

That's it! The bot uses **long polling** — no server, no webhook, no domain needed. It works directly from your laptop or any server.

```
🤖 Telegram Resume Bot is running...
✅ MongoDB connected
```

Open Telegram, find your bot by its username, and send `/start`.

---

## 💬 Conversation Flow

```
/start
  │
  ├─ Full Name
  ├─ Email
  ├─ Phone (or Skip)
  ├─ City → State → Country
  ├─ Skills (comma-separated)
  ├─ Source platform
  ├─ Resume URL (or Skip)
  │
  ├─ 🎓 Education Loop
  │    └─ Institution → Degree → From → To → Score → [Add more?]
  │
  ├─ 💼 Experience Loop
  │    └─ Company → Role → Start → End → Tech Stack → Years → Description → [Add more?]
  │
  ├─ 📋 Profile Summary (review all data)
  └─ 🚀 Submit → Saved to MongoDB ✅
```

---

## 📦 MongoDB Document Saved

```json
{
  "email": "gauravjain78200@gmail.com",
  "phone": "+919375864516",
  "fullName": "Gaurav Golchha",
  "sourcePlatforms": "Telegram",
  "originalResumeUrls": ["https://..."],
  "location": { "city": "Ahmedabad", "state": "Gujarat", "country": "India" },
  "totalExperienceYears": 0.7,
  "skills": ["Python", "React", "Docker", "SQL"],
  "experience": [{
    "company": "MAGMA",
    "role": "Full Stack Development Intern",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-05-20T00:00:00.000Z",
    "techstack": ["Flask", "MySQL", "Tailwind CSS"],
    "years_worked": "0.4",
    "description": "Developed supply chain web apps..."
  }],
  "education": [{
    "institution": "Nirma University",
    "degree": "B.Tech in Computer Science and Engineering",
    "from": 2020,
    "to": 2024,
    "score": "8.86/10"
  }],
  "applicationStatus": "New",
  "createdAt": "2026-03-13T10:02:49.987Z"
}
```

---

## 🔄 User Commands

| Command | Action |
|---|---|
| `/start` | Begin or restart the bot |
| `/help` | Show help message |
| `restart` | Clears session and starts over |

---

## 🚢 Run in Production (Free Hosting)

### Railway (easiest — free tier available)
1. Push code to GitHub
2. Go to **https://railway.app** → New Project → Deploy from GitHub
3. Add environment variables in dashboard
4. Done — bot runs 24/7

### Render (free tier)
1. Push to GitHub
2. **https://render.com** → New Web Service → connect repo
3. Build: `npm install` | Start: `npm start`
4. Add env vars → Deploy

### Run on any VPS / your own server
```bash
npm install -g pm2
pm2 start index.js --name resume-bot
pm2 save
pm2 startup
```

---

## ⚠️ Notes

- **Sessions are in-memory** — lost on server restart. For production, swap `sessionStore.js` with a Redis implementation.
- The bot uses **polling** which is perfect for small/medium scale. For high traffic, switch to webhooks (the `node-telegram-bot-api` library supports both).
- No WhatsApp Business account, Meta approval, or credit card needed — just a Telegram account.
