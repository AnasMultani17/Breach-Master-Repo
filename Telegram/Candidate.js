const mongoose = require("mongoose");

const ExperienceSchema = new mongoose.Schema({
  company: String,
  role: String,
  startDate: Date,
  endDate: Date,
  techstack: [String],
  years_worked: String,
  description: String,
});

const EducationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  from: Number,
  to: Number,
  score: String,
});

const LocationSchema = new mongoose.Schema({
  city: String,
  state: String,
  country: String,
});

const CandidateSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    phone: String,
    fullName: String,
    sourcePlatforms: { type: String, default: "Telegram" },
    originalResumeUrls: [String],
    location: LocationSchema,
    totalExperienceYears: Number,
    skills: [String],
    experience: [ExperienceSchema],
    education: [EducationSchema],
    applicationStatus: { type: String, default: "New" },
    rawExtractedText: { type: String, default: "" },
    profileEmbedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", CandidateSchema);
