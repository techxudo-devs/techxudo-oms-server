// Disabled hiring module: return empty or not implemented for all endpoints
export const listApplications = async (req, res) => {
  return res.status(200).json({ success: true, data: [] });
};

export const createCandidate = async (req, res) => {
  return res
    .status(501)
    .json({ success: false, message: "Hiring module is disabled" });
};

export const moveStage = async (req, res) => {
  return res
    .status(501)
    .json({ success: false, message: "Hiring module is disabled" });
};

export const sendApplicationEmail = async (req, res) => {
  return res
    .status(501)
    .json({ success: false, message: "Hiring module is disabled" });
};
