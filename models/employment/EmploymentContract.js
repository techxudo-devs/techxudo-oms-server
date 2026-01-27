import mongoose from "mongoose";

const employeeContractSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    employmentFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmploymentForm",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    contractDetails: {
      position: { type: String, required: true },
      department: { type: String, required: true },
      employmentType: {
        type: String,
        enum: ["full-time", "part-time", "contract"],
        required: true,
      },
      startDate: { type: Date, required: true },
      probationPeriod: { type: Number, default: 3 },
      compensation: {
        baseSalary: { type: Number, required: true },
        allowances: [
          {
            type: { type: String, required: true },
            amount: { type: Number, required: true },
          },
        ],
        bonuses: String,
        paymentFrequency: {
          type: String,
          enum: ["monthly", "bi-weekly", "weekly"],
          default: "monthly",
        },
      },
      workingHours: { hoursPerWeek: { type: Number, default: 40 }, schedule: String },
      benefits: [String],
      leavePolicies: String,
      noticePeriod: { type: Number, default: 30 },
      termsAndConditions: { type: String },
    },

    signatures: [
      {
        signedBy: { type: String, enum: ["employee", "employer"], required: true },
        signerName: { type: String, required: true },
        signerEmail: { type: String, required: true },
        signatureImage: String,
        signedAt: Date,
        ipAddress: String,
      },
    ],

    status: {
      type: String,
      enum: ["draft", "sent", "signed", "completed", "terminated"],
      default: "draft",
      index: true,
    },
    sentAt: Date,
    signedAt: Date,
    terminatedAt: Date,
    terminationReason: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    signingToken: { type: String, index: true },
    tokenExpiry: Date,
  },
  { timestamps: true },
);

employeeContractSchema.index({ organizationId: 1, status: 1 });
employeeContractSchema.index({ employeeId: 1 });
employeeContractSchema.index({ employmentFormId: 1 });

export default mongoose.model("EmployeeContract", employeeContractSchema);

