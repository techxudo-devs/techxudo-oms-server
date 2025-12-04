import ContractService from "../../services/employement/contractService.js";

export const createContract = async (req, res) => {
  try {
    const contractData = {
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user._id,
    };

    const result = await ContractService.createContract(contractData);

    return res.status(201).json({
      success: true,
      message: "Contract created successfully",
      data: result.contract,
      token: result.token, // Include the unhashed token for frontend use
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while creating contract",
    });
  }
};

export const getContracts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "", employeeEmail = "" } = req.query;

    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;

    const result = await ContractService.getContracts({
      filter,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching contracts",
    });
  }
};

export const getContractById = async (req, res) => {
  try {
    const contract = await ContractService.getContractById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: "Contract not found",
      });
    }

    if (
      contract.organizationId.toString() !== req.user.organizationId.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching contract",
    });
  }
};

// Get contract by token (Public)
export const getContractByToken = async (req, res) => {
  try {
    const contract = await ContractService.getContractByToken(req.params.token);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: "Contract not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while fetching contract",
    });
  }
};

// Sign contract (Public)
export const signContract = async (req, res) => {
  try {
    const contract = await ContractService.signContract(
      req.params.token,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Contract signed successfully",
      data: contract,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while signing contract",
    });
  }
};

// Send contract to employee (Admin)
export const sendContract = async (req, res) => {
  try {
    const contract = await ContractService.sendContract(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Contract sent to employee",
      data: contract,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Server error while sending contract",
    });
  }
};
