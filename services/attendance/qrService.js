import crypto from "crypto";
import AttendanceSettings from "../../models/AttendanceSettings.js";

class QRService {
  /**
   * Generate a time-based QR code for attendance
   * Format: OFFICE_CODE|TIMESTAMP|HASH
   */
  async generateQRCode() {
    try {
      const settings = await AttendanceSettings.findOne();

      if (!settings || !settings.qrCode.enabled) {
        throw new Error("QR code attendance is not enabled");
      }

      const officeCode = settings.qrCode.officeCode || "TECHXUDO-OFFICE";
      const timestamp = Date.now();
      const expiryMinutes = settings.qrCode.expiryMinutes || 5;

      // Generate hash for security
      const secret =
        settings.qrCode.secret || process.env.QR_SECRET || "default-secret-key";
      const dataToHash = `${officeCode}|${timestamp}|${secret}`;
      const hash = crypto
        .createHash("sha256")
        .update(dataToHash)
        .digest("hex")
        .substring(0, 16);

      // QR Code data format
      const qrData = `${officeCode}|${timestamp}|${hash}`;

      return {
        qrData,
        expiresAt: new Date(timestamp + expiryMinutes * 60 * 1000),
        expiryMinutes,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate scanned QR code
   */
  async validateQRCode(qrData) {
    try {
      if (!qrData) {
        return { valid: false, message: "QR code data is missing" };
      }

      const settings = await AttendanceSettings.findOne();

      if (!settings || !settings.qrCode.enabled) {
        return { valid: false, message: "QR code attendance is not enabled" };
      }

      // Parse QR data
      const parts = qrData.split("|");
      if (parts.length !== 3) {
        return { valid: false, message: "Invalid QR code format" };
      }

      const [scannedOfficeCode, scannedTimestamp, scannedHash] = parts;

      // Validate office code
      const expectedOfficeCode =
        settings.qrCode.officeCode || "TECHXUDO-OFFICE";
      if (scannedOfficeCode !== expectedOfficeCode) {
        return { valid: false, message: "Invalid office QR code" };
      }

      // Validate timestamp (check expiry)
      const qrTimestamp = parseInt(scannedTimestamp);
      const currentTimestamp = Date.now();
      const expiryMinutes = settings.qrCode.expiryMinutes || 5;
      const expiryMs = expiryMinutes * 60 * 1000;

      if (currentTimestamp - qrTimestamp > expiryMs) {
        return { valid: false, message: "QR code has expired" };
      }

      // Validate hash
      const secret =
        settings.qrCode.secret || process.env.QR_SECRET || "default-secret-key";
      const dataToHash = `${scannedOfficeCode}|${scannedTimestamp}|${secret}`;
      const expectedHash = crypto
        .createHash("sha256")
        .update(dataToHash)
        .digest("hex")
        .substring(0, 16);

      if (scannedHash !== expectedHash) {
        return { valid: false, message: "Invalid QR code signature" };
      }

      return { valid: true, message: "QR code is valid" };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  /**
   * Generate a unique QR secret (called during initial setup)
   */
  generateQRSecret() {
    return crypto.randomBytes(32).toString("hex");
  }
}

export default new QRService();
