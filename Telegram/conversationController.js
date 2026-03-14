const { getSession, setSession, clearSession } = require("./sessionStore");
const { sendText, sendButtons } = require("./telegramSender");
const { connectDB } = require("./db");
const Candidate = require("./Candidate");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(str) {
  if (!str || str.toLowerCase() === "present") return null;
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

function calcExperience(experiences) {
  let total = 0;
  for (const e of experiences) {
    const y = parseFloat(e.years_worked);
    if (!isNaN(y)) total += y;
  }
  return Math.round(total * 10) / 10;
}

// ─── Ask next question based on step ─────────────────────────────────────────

async function askNext(bot, chatId, step) {
  const session = getSession(chatId);
  const { data } = session;

  switch (step) {
    case "ASK_NAME":
      await sendText(bot, chatId,
        "👋 *Welcome to the Resume Bot!*\n\nI'll collect your profile details step by step.\n\nWhat is your *full name*?"
      );
      break;

    case "ASK_EMAIL":
      await sendText(bot, chatId, "📧 What is your *email address*?");
      break;

    case "ASK_PHONE":
      await sendButtons(bot, chatId,
        "📱 What is your *phone number*? (with country code, e.g. +919999999999)",
        [{ label: "⏭ Skip", data: "skip_phone" }]
      );
      break;

    case "ASK_LOCATION_CITY":
      await sendText(bot, chatId, "📍 Which *city* are you based in?");
      break;

    case "ASK_LOCATION_STATE":
      await sendText(bot, chatId, "🗺 Which *state / province*?");
      break;

    case "ASK_LOCATION_COUNTRY":
      await sendText(bot, chatId, "🌍 Which *country*?");
      break;

    case "ASK_SKILLS":
      await sendText(bot, chatId,
        "💻 List your *skills* separated by commas.\n\n_Example: Python, React, Docker, SQL_"
      );
      break;

    case "ASK_SOURCE_PLATFORM":
      await sendText(bot, chatId,
        "🔗 Where did you hear about us / which platform are you applying from?\n\n_E.g. LinkedIn, Naukri, Referral, Telegram_"
      );
      break;

    case "ASK_RESUME_URL":
      await sendButtons(bot, chatId,
        "📄 Do you have a *resume link* to share? (Google Drive, Cloudinary, etc.)\n\nPaste the URL or skip.",
        [{ label: "⏭ Skip", data: "skip_resume" }]
      );
      break;

    // ── Education ──
    case "ASK_EDU_INSTITUTION":
      await sendText(bot, chatId,
        `🎓 *Education Entry ${data.education.length + 1}*\n\nName of *institution / university*?`
      );
      break;

    case "ASK_EDU_DEGREE":
      await sendText(bot, chatId,
        "📜 What *degree / qualification* did you pursue?\n\n_E.g. B.Tech in Computer Science and Engineering_"
      );
      break;

    case "ASK_EDU_FROM":
      await sendText(bot, chatId, "📅 *From year?* (e.g. 2020)");
      break;

    case "ASK_EDU_TO":
      await sendText(bot, chatId, "📅 *To year?* (e.g. 2024 — or type `present`)");
      break;

    case "ASK_EDU_SCORE":
      await sendButtons(bot, chatId,
        "📊 *Score / GPA?* (e.g. 8.86/10, 95%)",
        [{ label: "⏭ Skip", data: "skip_score" }]
      );
      break;

    case "ASK_EDU_MORE":
      await sendButtons(bot, chatId,
        `✅ Education entry saved!\n\n🎓 *${data.education[data.education.length - 1]?.institution}* — ${data.education[data.education.length - 1]?.degree}\n\nAdd *another education entry*?`,
        [
          { label: "✅ Yes, add more", data: "edu_yes" },
          { label: "➡️ No, continue",  data: "edu_no"  },
        ]
      );
      break;

    // ── Experience ──
    case "ASK_EXP_COMPANY":
      await sendText(bot, chatId,
        `💼 *Experience Entry ${data.experience.length + 1}*\n\nName of *company*?`
      );
      break;

    case "ASK_EXP_ROLE":
      await sendText(bot, chatId,
        "🧑‍💻 What was your *role / designation*?\n\n_E.g. Software Development Intern_"
      );
      break;

    case "ASK_EXP_START":
      await sendText(bot, chatId, "📅 *Start date?* (e.g. Jun 2023 or 2023-06)");
      break;

    case "ASK_EXP_END":
      await sendText(bot, chatId, "📅 *End date?* (e.g. Aug 2023 — or type `present`)");
      break;

    case "ASK_EXP_TECHSTACK":
      await sendText(bot, chatId,
        "🛠 *Tech stack used* at this job? (comma-separated)\n\n_E.g. React, Flask, MySQL, Docker_"
      );
      break;

    case "ASK_EXP_YEARS":
      await sendText(bot, chatId, "⏳ Approximately how many *years* did you work there? (e.g. `0.3` or `2`)");
      break;

    case "ASK_EXP_DESC":
      await sendText(bot, chatId,
        "📝 Brief *description* of your work there.\n\n_E.g. Developed supply chain web apps for the manufacturing industry._"
      );
      break;

    case "ASK_EXP_MORE":
      await sendButtons(bot, chatId,
        `✅ Experience entry saved!\n\n💼 *${data.experience[data.experience.length - 1]?.company}* — ${data.experience[data.experience.length - 1]?.role}\n\nAdd *another experience entry*?`,
        [
          { label: "✅ Yes, add more", data: "exp_yes" },
          { label: "➡️ No, continue",  data: "exp_no"  },
        ]
      );
      break;

    case "CONFIRM_SUBMIT": {
      const d = data;
      const summary =
        `📋 *Review Your Profile*\n\n` +
        `👤 *Name:* ${d.fullName || "—"}\n` +
        `📧 *Email:* ${d.email || "—"}\n` +
        `📱 *Phone:* ${d.phone || "—"}\n` +
        `📍 *Location:* ${d.location?.city}, ${d.location?.state}, ${d.location?.country}\n` +
        `💻 *Skills:* ${(d.skills || []).join(", ")}\n` +
        `🔗 *Source:* ${d.sourcePlatforms || "—"}\n` +
        `🎓 *Education entries:* ${d.education.length}\n` +
        `💼 *Experience entries:* ${d.experience.length}\n` +
        `📄 *Resume URL:* ${d.originalResumeUrls?.length ? d.originalResumeUrls[0] : "Not provided"}\n\n` +
        `Everything look correct?`;
      await sendButtons(bot, chatId, summary, [
        { label: "🚀 Submit Profile", data: "submit_yes" },
        { label: "🔄 Start Over",     data: "submit_no"  },
      ]);
      break;
    }

    case "DONE":
      await sendText(bot, chatId,
        "🎉 *Profile submitted successfully!*\n\nThank you for applying. Our team will review your profile and get back to you soon.\n\nGood luck! 🚀\n\n_Type /start to submit another profile._"
      );
      break;
  }
}

// ─── Handle plain text messages ───────────────────────────────────────────────

async function handleMessage(bot, chatId, text) {
  await connectDB();

  const lower = text.toLowerCase().trim();

  // Global commands
  if (lower === "/start" || lower === "restart" || lower === "start over") {
    clearSession(chatId);
    getSession(chatId); // re-initialise
    await askNext(bot, chatId, "ASK_NAME");
    return;
  }

  if (lower === "/help") {
    await sendText(bot, chatId,
      "ℹ️ *Resume Bot Help*\n\n" +
      "• This bot collects your profile and saves it to our database.\n" +
      "• Type /start to begin or restart at any time.\n" +
      "• For optional fields, tap the *Skip* button.\n" +
      "• Type `present` where applicable for ongoing roles/education."
    );
    return;
  }

  const session = getSession(chatId);
  const { step, data, tempBuffer } = session;

  switch (step) {
    case "ASK_NAME":
      if (!text || text.startsWith("/")) { await askNext(bot, chatId, step); break; }
      data.fullName = text;
      setSession(chatId, { step: "ASK_EMAIL", data });
      await askNext(bot, chatId, "ASK_EMAIL");
      break;

    case "ASK_EMAIL":
      if (!/\S+@\S+\.\S+/.test(text)) {
        await sendText(bot, chatId, "❌ That doesn't look like a valid email. Please try again.");
        break;
      }
      data.email = text;
      setSession(chatId, { step: "ASK_PHONE", data });
      await askNext(bot, chatId, "ASK_PHONE");
      break;

    case "ASK_PHONE":
      // They typed a number instead of pressing button
      data.phone = text;
      setSession(chatId, { step: "ASK_LOCATION_CITY", data });
      await askNext(bot, chatId, "ASK_LOCATION_CITY");
      break;

    case "ASK_LOCATION_CITY":
      data.location = { city: text };
      setSession(chatId, { step: "ASK_LOCATION_STATE", data });
      await askNext(bot, chatId, "ASK_LOCATION_STATE");
      break;

    case "ASK_LOCATION_STATE":
      data.location.state = text;
      setSession(chatId, { step: "ASK_LOCATION_COUNTRY", data });
      await askNext(bot, chatId, "ASK_LOCATION_COUNTRY");
      break;

    case "ASK_LOCATION_COUNTRY":
      data.location.country = text;
      setSession(chatId, { step: "ASK_SKILLS", data });
      await askNext(bot, chatId, "ASK_SKILLS");
      break;

    case "ASK_SKILLS":
      data.skills = text.split(",").map((s) => s.trim()).filter(Boolean);
      setSession(chatId, { step: "ASK_SOURCE_PLATFORM", data });
      await askNext(bot, chatId, "ASK_SOURCE_PLATFORM");
      break;

    case "ASK_SOURCE_PLATFORM":
      data.sourcePlatforms = text;
      setSession(chatId, { step: "ASK_RESUME_URL", data });
      await askNext(bot, chatId, "ASK_RESUME_URL");
      break;

    case "ASK_RESUME_URL":
      if (text.startsWith("http")) {
        data.originalResumeUrls = [text];
      }
      setSession(chatId, { step: "ASK_EDU_INSTITUTION", data });
      await askNext(bot, chatId, "ASK_EDU_INSTITUTION");
      break;

    // ── Education ──
    case "ASK_EDU_INSTITUTION":
      tempBuffer.institution = text;
      setSession(chatId, { step: "ASK_EDU_DEGREE", tempBuffer });
      await askNext(bot, chatId, "ASK_EDU_DEGREE");
      break;

    case "ASK_EDU_DEGREE":
      tempBuffer.degree = text;
      setSession(chatId, { step: "ASK_EDU_FROM", tempBuffer });
      await askNext(bot, chatId, "ASK_EDU_FROM");
      break;

    case "ASK_EDU_FROM":
      tempBuffer.from = parseInt(text) || 0;
      setSession(chatId, { step: "ASK_EDU_TO", tempBuffer });
      await askNext(bot, chatId, "ASK_EDU_TO");
      break;

    case "ASK_EDU_TO":
      tempBuffer.to = lower === "present" ? new Date().getFullYear() : parseInt(text) || 0;
      setSession(chatId, { step: "ASK_EDU_SCORE", tempBuffer });
      await askNext(bot, chatId, "ASK_EDU_SCORE");
      break;

    case "ASK_EDU_SCORE":
      tempBuffer.score = text;
      data.education.push({ ...tempBuffer });
      setSession(chatId, { step: "ASK_EDU_MORE", data, tempBuffer: {} });
      await askNext(bot, chatId, "ASK_EDU_MORE");
      break;

    // ── Experience ──
    case "ASK_EXP_COMPANY":
      tempBuffer.company = text;
      setSession(chatId, { step: "ASK_EXP_ROLE", tempBuffer });
      await askNext(bot, chatId, "ASK_EXP_ROLE");
      break;

    case "ASK_EXP_ROLE":
      tempBuffer.role = text;
      setSession(chatId, { step: "ASK_EXP_START", tempBuffer });
      await askNext(bot, chatId, "ASK_EXP_START");
      break;

    case "ASK_EXP_START":
      tempBuffer.startDate = parseDate(text);
      setSession(chatId, { step: "ASK_EXP_END", tempBuffer });
      await askNext(bot, chatId, "ASK_EXP_END");
      break;

    case "ASK_EXP_END":
      tempBuffer.endDate = lower === "present" ? null : parseDate(text);
      setSession(chatId, { step: "ASK_EXP_TECHSTACK", tempBuffer });
      await askNext(bot, chatId, "ASK_EXP_TECHSTACK");
      break;

    case "ASK_EXP_TECHSTACK":
      tempBuffer.techstack = text.split(",").map((s) => s.trim()).filter(Boolean);
      setSession(chatId, { step: "ASK_EXP_YEARS", tempBuffer });
      await askNext(bot, chatId, "ASK_EXP_YEARS");
      break;

    case "ASK_EXP_YEARS":
      tempBuffer.years_worked = text;
      setSession(chatId, { step: "ASK_EXP_DESC", tempBuffer });
      await askNext(bot, chatId, "ASK_EXP_DESC");
      break;

    case "ASK_EXP_DESC":
      tempBuffer.description = text;
      data.experience.push({ ...tempBuffer });
      setSession(chatId, { step: "ASK_EXP_MORE", data, tempBuffer: {} });
      await askNext(bot, chatId, "ASK_EXP_MORE");
      break;

    case "CONFIRM_SUBMIT":
    case "ASK_EDU_MORE":
    case "ASK_EXP_MORE":
    case "DONE":
      // These steps are button-driven; prompt them to use the buttons
      await sendText(bot, chatId, "👆 Please use the buttons above to continue, or type /start to restart.");
      break;

    default:
      await sendText(bot, chatId, "Something went wrong. Type /start to begin again.");
  }
}

// ─── Handle inline button clicks ─────────────────────────────────────────────

async function handleCallbackQuery(bot, chatId, data) {
  const session = getSession(chatId);

  switch (data) {
    // Skip buttons
    case "skip_phone":
      session.data.phone = "";
      setSession(chatId, { step: "ASK_LOCATION_CITY", data: session.data });
      await askNext(bot, chatId, "ASK_LOCATION_CITY");
      break;

    case "skip_resume":
      setSession(chatId, { step: "ASK_EDU_INSTITUTION" });
      await askNext(bot, chatId, "ASK_EDU_INSTITUTION");
      break;

    case "skip_score":
      session.tempBuffer.score = "";
      session.data.education.push({ ...session.tempBuffer });
      setSession(chatId, { step: "ASK_EDU_MORE", data: session.data, tempBuffer: {} });
      await askNext(bot, chatId, "ASK_EDU_MORE");
      break;

    // Education loop
    case "edu_yes":
      setSession(chatId, { step: "ASK_EDU_INSTITUTION" });
      await askNext(bot, chatId, "ASK_EDU_INSTITUTION");
      break;

    case "edu_no":
      setSession(chatId, { step: "ASK_EXP_COMPANY" });
      await askNext(bot, chatId, "ASK_EXP_COMPANY");
      break;

    // Experience loop
    case "exp_yes":
      setSession(chatId, { step: "ASK_EXP_COMPANY" });
      await askNext(bot, chatId, "ASK_EXP_COMPANY");
      break;

    case "exp_no":
      setSession(chatId, { step: "CONFIRM_SUBMIT" });
      await askNext(bot, chatId, "CONFIRM_SUBMIT");
      break;

    // Final submission
    case "submit_yes":
      await submitCandidate(bot, chatId, session.data);
      break;

    case "submit_no":
      clearSession(chatId);
      await sendText(bot, chatId, "🔄 Session cleared. Type /start to begin again.");
      break;

    default:
      await sendText(bot, chatId, "Unknown action. Type /start to restart.");
  }
}

// ─── Save to MongoDB ──────────────────────────────────────────────────────────

async function submitCandidate(bot, chatId, data) {
  try {
    data.totalExperienceYears = calcExperience(data.experience);

    const candidate = new Candidate({
      email: data.email,
      phone: data.phone,
      fullName: data.fullName,
      sourcePlatforms: data.sourcePlatforms || "Telegram",
      originalResumeUrls: data.originalResumeUrls || [],
      location: data.location,
      totalExperienceYears: data.totalExperienceYears,
      skills: data.skills,
      experience: data.experience,
      education: data.education,
      applicationStatus: "New",
      rawExtractedText: "",
      profileEmbedding: [],
    });

    await candidate.save();
    console.log(`✅ Candidate saved: ${data.email}`);

    setSession(chatId, { step: "DONE" });
    await askNext(bot, chatId, "DONE");
  } catch (err) {
    console.error("MongoDB save error:", err);
    await sendText(bot, chatId,
      "⚠️ There was an error saving your profile. Please try again later or type /start to retry."
    );
  }
}

module.exports = { handleMessage, handleCallbackQuery };
