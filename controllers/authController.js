import User from "../models/User.js";
import AuthService from "../services/auth/authService.js";
import bcrypt from "bcryptjs";

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
      });
    }

    const result = await AuthService.login(email, password);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Login error:", error.message);

    // Handle specific error messages
    if (error.message.includes("Invalid credentials")) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    } else if (error.message.includes("account has been deactivated")) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    } else {
      // For other unexpected errors, return a generic server error
      return res.status(500).json({
        success: false,
        error: "Server error during login",
      });
    }
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    const result = await AuthService.refreshToken(refreshToken);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired refresh token",
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const result = await AuthService.getProfile(req.user.id);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error while fetching profile",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address, emergencyContact, profile } = req.body;

    const result = await AuthService.updateProfile(req.user.id, {
      fullName,
      phone,
      address,
      emergencyContact,
      profile,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error while updating profile",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const result = await AuthService.forgotPassword(email);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error while processing forgot password",
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: "Token and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    const result = await AuthService.resetPassword(token, password);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error while resetting password",
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const result = await AuthService.logout(req.user.id, refreshToken);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error during logout",
    });
  }
};
const verifySetPasswordToken = async (req, res) => {
  try {
    // Find user by token logic here
    const user = await User.findOne({
      setPasswordToken: req.params.token,
      setPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Set password
const setPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findOne({
      setPasswordToken: req.params.token,
      setPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.setPasswordToken = undefined;
    user.setPasswordExpiry = undefined;
    user.isActive = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password set successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export {
  login,
  refreshToken,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  logout,
  setPassword,
  verifySetPasswordToken,
};
