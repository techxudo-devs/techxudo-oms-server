import Attendance from "../../models/Attendance.js";
import AttendanceRequest from "../../models/AttendanceRequest.js";
import attendanceService from "../../services/attendance/attendanceService.js";
import qrService from "../../services/attendance/qrService.js";
import emailService from "../../services/email/emailService.js";

/**
 * Get client IP address from request
 */
const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};

/**
 * Get device info from request
 */
const getDeviceInfo = (req) => {
  return req.headers["user-agent"] || "Unknown Device";
};

/**
 * Employee check-in
 * POST /api/attendance/check-in
 */
export const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { qrCode, location, notes, method = "manual" } = req.body;

    // Check if can check-in
    const checkInValidation = await attendanceService.canCheckIn(userId);
    if (!checkInValidation.canCheckIn) {
      return res.status(400).json({ message: checkInValidation.reason });
    }

    // Validate QR code if provided
    if (method === "qr") {
      if (!qrCode) {
        return res
          .status(400)
          .json({ message: "QR code is required for QR check-in" });
      }

      const qrValidation = await qrService.validateQRCode(qrCode);
      if (!qrValidation.valid) {
        return res.status(400).json({ message: qrValidation.message });
      }
    }

    // Get IP and device info
    const ipAddress = getClientIP(req);
    const deviceInfo = getDeviceInfo(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInTime = new Date();

    // Calculate late status
    const lateStatus = await attendanceService.calculateLateStatus(
      checkInTime,
      userId
    );

    // Create attendance record
    const attendance = await Attendance.create({
      userId,
      date: today,
      checkIn: {
        time: checkInTime,
        method,
        ipAddress,
        deviceInfo,
        qrCode: method === "qr" ? qrCode : undefined,
        location: location || {},
        notes: notes || "",
      },
      status: lateStatus.isLate ? "late" : "present",
      lateArrival: {
        isLate: lateStatus.isLate,
        minutesLate: lateStatus.minutesLate,
      },
    });

    const populatedAttendance = await Attendance.findById(
      attendance._id
    ).populate("userId", "fullName designation email");

    // Send late arrival notification email if late
    if (lateStatus.isLate && populatedAttendance.userId) {
      emailService
        .sendLateArrivalNotification(
          populatedAttendance.userId,
          checkInTime,
          lateStatus.minutesLate
        )
        .catch((err) => {
          console.error("Failed to send late arrival email:", err);
          // Don't fail the check-in if email fails
        });
    }

    res.status(201).json({
      message: lateStatus.isLate
        ? `Checked in successfully (${lateStatus.minutesLate} minutes late)`
        : "Checked in successfully",
      attendance: populatedAttendance,
      isLate: lateStatus.isLate,
      minutesLate: lateStatus.minutesLate,
    });
  } catch (error) {
    console.error("Error in checkIn:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Employee check-out
 * POST /api/attendance/check-out
 */
export const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { qrCode, location, notes, method = "manual" } = req.body;

    // Check if can check-out
    const checkOutValidation = await attendanceService.canCheckOut(userId);
    if (!checkOutValidation.canCheckOut) {
      return res.status(400).json({ message: checkOutValidation.reason });
    }

    // Validate QR code if provided
    if (method === "qr") {
      if (!qrCode) {
        return res
          .status(400)
          .json({ message: "QR code is required for QR check-out" });
      }

      const qrValidation = await qrService.validateQRCode(qrCode);
      if (!qrValidation.valid) {
        return res.status(400).json({ message: qrValidation.message });
      }
    }

    const attendance = checkOutValidation.attendance;
    const ipAddress = getClientIP(req);
    const deviceInfo = getDeviceInfo(req);
    const checkOutTime = new Date();

    // Update attendance with check-out
    attendance.checkOut = {
      time: checkOutTime,
      method,
      ipAddress,
      deviceInfo,
      qrCode: method === "qr" ? qrCode : undefined,
      location: location || {},
      notes: notes || "",
    };

    // Calculate hours worked
    attendance.calculateHours();

    await attendance.save();

    const populatedAttendance = await Attendance.findById(
      attendance._id
    ).populate("userId", "fullName designation email");

    res.json({
      message: "Checked out successfully",
      attendance: populatedAttendance,
      hoursWorked: attendance.hoursWorked,
    });
  } catch (error) {
    console.error("Error in checkOut:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get today's attendance for current user
 * GET /api/attendance/my-today
 */
export const getMyTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const attendance = await attendanceService.getTodayAttendance(userId);

    res.json(attendance);
  } catch (error) {
    console.error("Error in getMyTodayAttendance:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get my attendance history
 * GET /api/attendance/my-attendance
 */
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status, page = 1, limit = 30 } = req.query;

    const query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "fullName designation email");

    const total = await Attendance.countDocuments(query);

    res.json({
      attendances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getMyAttendance:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get my attendance statistics
 * GET /api/attendance/my-stats
 */
export const getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Default to current month if no dates provided
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await attendanceService.getUserStats(userId, start, end);

    res.json(stats);
  } catch (error) {
    console.error("Error in getMyStats:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Request attendance correction
 * POST /api/attendance/request-correction
 */
export const requestCorrection = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      requestType,
      requestedDate,
      requestedCheckIn,
      requestedCheckOut,
      reason,
      attachments,
      attendanceId,
    } = req.body;

    if (!requestType || !requestedDate || !reason) {
      return res.status(400).json({
        message: "Request type, date, and reason are required",
      });
    }

    const validTypes = [
      "forgot-checkin",
      "forgot-checkout",
      "correction",
      "late-approval",
    ];
    if (!validTypes.includes(requestType)) {
      return res.status(400).json({ message: "Invalid request type" });
    }

    const correctionRequest = await AttendanceRequest.create({
      userId,
      attendanceId,
      requestType,
      requestedDate: new Date(requestedDate),
      requestedCheckIn: requestedCheckIn
        ? new Date(requestedCheckIn)
        : undefined,
      requestedCheckOut: requestedCheckOut
        ? new Date(requestedCheckOut)
        : undefined,
      reason,
      attachments: attachments || [],
    });

    const populatedRequest = await AttendanceRequest.findById(
      correctionRequest._id
    ).populate("userId", "fullName designation email");

    res.status(201).json({
      message: "Correction request submitted successfully",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Error in requestCorrection:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get my correction requests
 * GET /api/attendance/my-requests
 */
export const getMyCorrectionRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const requests = await AttendanceRequest.find(query)
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "fullName");

    res.json(requests);
  } catch (error) {
    console.error("Error in getMyCorrectionRequests:", error);
    res.status(500).json({ message: error.message });
  }
};
