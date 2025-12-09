import mongoose from "mongoose";

const appointmentLetterSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      trim: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    letterContent: {
      subject: {
        type: String,
        required: true,
      },
      body: {
        type: String, // Rich text HTML
        required: true,
      },
      position: {
        type: String,
        required: true,
      },
      department: {
        type: String,
        required: true,
      },
      joiningDate: {
        type: Date,
        required: true,
      },
      salary: {
        type: Number,
        required: true,
      },
      benefits: [
        {
          type: String,
        },
      ],
    },

    status: {
      type: String,
      enum: ["sent", "viewed", "accepted", "rejected"],
      default: "sent",
      index: true,
    },
    sentAt: Date,
    viewedAt: Date,
    respondedAt: Date,
    respondedAt: Date,
    response: String, // Reason for rejection if applicable

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

appointmentLetterSchema.index({ organizationId: 1, status: 1 });
appointmentLetterSchema.index({ employeeEmail: 1, organizationId: 1 });

export default mongoose.model("AppointmentLetter", appointmentLetterSchema);
