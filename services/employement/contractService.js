import EmployementContract from "../../models/employement/EmployementContract.js";
import EmploymentForm from "../../models/employement/EmploymentForm.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

class ContractService {
  static async createContract(contractData) {
    const contract = await EmployementContract.create(contractData);

    //Generate token for contract
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(token, 10);

    contract.signingToken = hashedToken;
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
      data: contracts,
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
    const contracts = await EmployementContract.find({
      status: { $in: ["sent", "draft"] },
    });
    for (const contract of contracts) {
      const isMatch = await bcrypt.compare(token, contract.signingToken || "");
      if (isMatch && contract.tokenExpiry > new Date()) {
        return contract;
      }
    }
    return null;
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

    // TODO: Send email with signing link

    return contract;
  }
}

export default ContractService;
