import EmployementContract from "../../models/employement/EmployementContract.js";
import EmploymentForm from "../../models/employement/EmploymentForm.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import emailService from "../email/emailService.js";

class ContractService {
  static async createContract(contractData) {
    const contract = await EmployementContract.create(contractData);

    //Generate token for contract
    const token = crypto.randomBytes(32).toString("hex");

    // Storing directly to allow indexed lookup.
    // For higher security, we could use a separate tokenId and tokenSecret,
    // but for this refactor, a high-entropy 64-char hex string is sufficient.
    contract.signingToken = token;
    contract.tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await contract.save();

    return { contract, token };
  }

  static async getContracts({ filter, page, limit }) {
    const skip = (page - 1) * limit;
    const contracts = await EmployementContract.find(filter)
      .populate("employeeId", "name email")
      .populate("createdBy", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await EmployementContract.countDocuments(filter);

    return {
      contracts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    };
  }

  static async getContractById(id) {
    return await EmployementContract.findById(id)
      .populate("employeeId", "name email")
      .populate("employmentFormId")
      .populate("createdBy", "name ");
  }

  static async getContractByToken(token) {
    const contract = await EmployementContract.findOne({
      signingToken: token,
      status: { $in: ["sent", "draft"] },
      tokenExpiry: { $gt: new Date() },
    });

    return contract;
  }

  static async signContract(token, signatureData) {
    const contract = await this.getContractByToken(token);

    if (!contract) throw new Error("Contract not found");
    if (contract.status === "signed")
      throw new Error("Contract already signed");

    // Check token expiry
    if (new Date() > contract.tokenExpiry) {
      throw new Error("Contract signing link has expired");
    }

    // Add employee signature
    contract.signatures.push({
      signedBy: "employee",
      signerName: signatureData.employeeName,
      signerEmail: signatureData.employeeEmail,
      signatureImage: signatureData.employeeSignature,
      signedAt: new Date(),
      ipAddress: signatureData.ipAddress,
    });

    contract.status = "signed";
    contract.signedAt = new Date();

    await contract.save();
    return contract;
  }

  // Send contract to employee
  static async sendContract(id) {
    const contract = await EmployementContract.findById(id);

    if (!contract) throw new Error("Contract not found");
    if (contract.status !== "draft") throw new Error("Contract already sent");

    contract.status = "sent";
    contract.sentAt = new Date();
    await contract.save();

    // Send email with signing link
    try {
      await emailService.sendContractEmail(contract, contract.signingToken);
      console.log(`✅ Contract email sent successfully for contract ${id}`);
    } catch (emailError) {
      console.error(
        `❌ Failed to send contract email for ${id}:`,
        emailError.message
      );
      // Don't throw - contract is still marked as sent even if email fails
      // Admin can resend manually if needed
    }

    return contract;
  }
}

export default ContractService;
