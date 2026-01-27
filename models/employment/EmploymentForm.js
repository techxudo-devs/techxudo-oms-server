import mongoose from "mongoose";
import crypto from "crypto";

const employmentFormSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    appointmentLetterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppointmentLetter",
      required: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      trim: true,
    },
    // Token for public access
    token: {
      type: String,
      unique: true,
      index: true,
    },
    tokenExpiry: {
      type: Date,
    },

    personalInfo: {
      photo: String,
      legalName: {
        type: String,
        required: function () {
          return this.status === "submitted";
        },
      },
      fatherName: String,
      guardianName: String,
      guardianCNIC: String,
      dateOfBirth: Date,
      gender: String,
      maritalStatus: String,
    },

    cnicInfo: {
      cnicNumber: {
        type: String,
        required: function () {
          return this.status === "submitted";
        },
      },
      cnicFrontImage: String,
      cnicBackImage: String,
      cnicIssueDate: Date,
      cnicExpiryDate: Date,
    },

    contactInfo: {
      phone: {
        type: String,
        required: function () {
          return this.status === "submitted";
        },
      },
      alternatePhone: String,
      email: {
        type: String,
        required: true,
      },
      emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
      },
    },

    addresses: {
      primaryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
      secondaryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
    },

    acceptedPolicies: [
      {
        policyId: mongoose.Schema.Types.ObjectId,
        policyTitle: String,
        acceptedAt: Date,
      },
    ],

    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdAt: Date,
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);

employmentFormSchema.index({ organizationId: 1, status: 1 });
employmentFormSchema.index({ employeeEmail: 1, organizationId: 1 });

employmentFormSchema.methods.generateToken = function () {
  const unhashedToken = crypto.randomBytes(32).toString("hex");
  this.token = crypto.createHash("sha256").update(unhashedToken).digest("hex");
  this.tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return unhashedToken;
};

employmentFormSchema.methods.isTokenExpired = function () {
  return this.tokenExpiry < new Date();
};

employmentFormSchema.statics.findByToken = async function (unhashedToken) {
  const hashedToken = crypto
    .createHash("sha256")
    .update(unhashedToken)
    .digest("hex");
  return this.findOne({ token: hashedToken });
};

export default mongoose.model("EmploymentForm", employmentFormSchema);

