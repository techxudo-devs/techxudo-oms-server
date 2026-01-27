import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Basic Information
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      trim: true,
    },

    // Resume & Portfolio
    resumeUrl: String,
    portfolioUrl: String,
    linkedinUrl: String,
    githubUrl: String,

    // Source tracking
    source: {
      type: String,
      enum: ["website", "referral", "linkedin", "indeed", "manual", "other"],
      default: "manual",
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Skills & Experience
    skills: [String],
    yearsOfExperience: Number,
    currentCompany: String,
    currentPosition: String,
    expectedSalary: Number,
    noticePeriod: String,

    // Tags for filtering
    tags: [String],

    // Notes
    notes: String,

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index: one candidate per email per organization
candidateSchema.index({ organizationId: 1, email: 1 }, { unique: true });

// Text search index
candidateSchema.index({ name: "text", email: "text", skills: "text" });

export default mongoose.model("Candidate", candidateSchema);

