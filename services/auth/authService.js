import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import Organization from "../../models/Organization.js";
import UserService from "../user/userService.js";

/**
 * Auth Service - Handles all authentication-related business logic
 */

class AuthService {
  /**
   * Generate JWT Access Token
   * @param {Object} user - User object
   * @param {Object} options - Additional token data
   * @returns {string} Access token
   */
  generateAccessToken(user, options = {}) {
    return jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        organizationId: user.organizationId,
        setupCompleted: options.setupCompleted,
        organizationSlug: options.organizationSlug,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Increased to 1 day to prevent session timeout during long forms
    );
  }

  /**
   * Generate JWT Refresh Token
   * @param {Object} user - User object
   * @returns {string} Refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" } // Long-lived refresh token
    );
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  async login(email, password) {
    // Find user by email
    const user = await UserService.getUserByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error("Your account has been deactivated. Please contact admin.");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Fetch organization data to get setupCompleted status
    let setupCompleted = true; // Default for employees
    let organizationSlug = null;

    if (user.organizationId) {
      const organization = await Organization.findById(user.organizationId).select('setupCompleted slug');
      if (organization) {
        setupCompleted = organization.setupCompleted || false;
        organizationSlug = organization.slug;
      }
    }

    // Generate tokens with organization data
    const accessToken = this.generateAccessToken(user, { setupCompleted, organizationSlug });
    const refreshToken = this.generateRefreshToken(user);

    // Save refresh token to database
    await UserService.addRefreshToken(user._id, refreshToken);

    return {
      success: true,
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        avatar: user.profile?.avatar,
      },
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Refresh token result
   */
  async refreshToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error("Refresh token is required");
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.id);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new Error("Invalid refresh token");
      }

      // Fetch organization data to get setupCompleted status
      let setupCompleted = true;
      let organizationSlug = null;

      if (user.organizationId) {
        const organization = await Organization.findById(user.organizationId).select('setupCompleted slug');
        if (organization) {
          setupCompleted = organization.setupCompleted || false;
          organizationSlug = organization.slug;
        }
      }

      // Generate new access token with organization data
      const newAccessToken = this.generateAccessToken(user, { setupCompleted, organizationSlug });

      return {
        success: true,
        token: newAccessToken,
      };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Get user profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    try {
      const user = await UserService.getUserById(
        userId,
        "passwordHash refreshTokens passwordResetToken emailVerificationToken"
      );

      if (!user) {
        throw new Error("User not found");
      }

      return {
        success: true,
        user,
      };
    } catch (error) {
      throw new Error(`Error while fetching profile: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(userId, profileData) {
    try {
      const { fullName, phone, address, emergencyContact, profile } = profileData;

      const updateData = {};
      if (fullName) updateData.fullName = fullName;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = { ...address };
      if (emergencyContact) updateData.emergencyContact = { ...emergencyContact };
      if (profile) updateData.profile = { ...profile };

      const user = await UserService.updateUserProfile(userId, updateData);

      return {
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          emergencyContact: user.emergencyContact,
          profile: user.profile,
        },
      };
    } catch (error) {
      throw new Error(`Error while updating profile: ${error.message}`);
    }
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to remove
   * @returns {Promise<Object>} Logout result
   */
  async logout(userId, refreshToken) {
    try {
      if (refreshToken) {
        await UserService.removeRefreshToken(userId, refreshToken);
      }

      return {
        success: true,
        message: "Logout successful",
      };
    } catch (error) {
      throw new Error(`Error during logout: ${error.message}`);
    }
  }

  /**
   * Handle forgot password request
   * @param {string} email - User email
   * @returns {Promise<Object>} Forgot password result
   */
  async forgotPassword(email) {
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      return await UserService.generatePasswordResetToken(email);
    } catch (error) {
      throw new Error(`Error while processing forgot password: ${error.message}`);
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Password reset result
   */
  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        throw new Error("Token and password are required");
      }

      return await UserService.resetPasswordWithToken(token, newPassword);
    } catch (error) {
      throw new Error(`Error while resetting password: ${error.message}`);
    }
  }
}

export default new AuthService();