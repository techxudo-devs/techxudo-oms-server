import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    // Position Details
    positionTitle: {
      type: String,
      required: [true, "Position title is required"],
    },
    department: String,
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },

    // Pipeline Stage
    stage: {
      type: String,
      enum: ["applied", "screening", "interview", "offer", "hired", "rejected"],
      default: "applied",
      index: true,
    },

    // Timeline tracking
    timeline: [
      {
        stage: {
          type: String,
          required: true,
        },
        movedAt: {
          type: Date,
          default: Date.now,
        },
        movedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
        automated: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Interview Details
    interviews: [
      {
        scheduledAt: Date,
        duration: Number, // in minutes
        type: {
          type: String,
          enum: ["phone", "video", "onsite", "technical", "hr"],
        },
        interviewers: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        meetingLink: String,
        location: String,
        feedback: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        status: {
          type: String,
          enum: ["scheduled", "completed", "cancelled", "no-show"],
          default: "scheduled",
        },
        completedAt: Date,
      },
    ],

    // Offer Details (if reached offer stage)
    offer: {
      salary: Number,
      currency: { type: String, default: "USD" },
      joiningDate: Date,
      sentAt: Date,
      respondedAt: Date,
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "negotiating"],
      },
    },

    // Notes & Comments
    notes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        isPrivate: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Rejection
    rejectionReason: String,
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Hiring
    hiredAt: Date,
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // Email tracking
    emailsSent: [
      {
        type: {
          type: String,
          enum: [
            "acknowledgement",
            "screening",
            "interview",
            "offer",
            "rejection",
          ],
        },
        sentAt: Date,
        subject: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
applicationSchema.index({ organizationId: 1, stage: 1 });
applicationSchema.index({ organizationId: 1, candidateId: 1 });
applicationSchema.index({ organizationId: 1, createdAt: -1 });
applicationSchema.index({ organizationId: 1, positionTitle: 1 });

// Methods
applicationSchema.methods.moveToStage = async function (newStage, userId, notes = "") {
  const oldStage = this.stage;
  this.stage = newStage;

  this.timeline.push({
    stage: newStage,
    movedBy: userId,
    notes,
    automated: false,
  });

  return { oldStage, newStage };
};

applicationSchema.methods.addNote = function (userId, content, isPrivate = false) {
  this.notes.push({
    author: userId,
    content,
    isPrivate,
  });
  return this.save();
};

applicationSchema.methods.scheduleInterview = function (interviewData) {
  this.interviews.push(interviewData);
  return this.save();
};

export default mongoose.model("Application", applicationSchema);

