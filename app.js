import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import employmentRoutes from "./routes/employmentRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import contractRoutes from "./routes/contractRoutes.js";
import hiringRoutes from "./routes/hiringRoutes.js";
import devRoutes from "./routes/devRoutes.js";
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:4080", "https://techxudo-oms.netlify.app"],
    credentials: true,
  })
);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Techxudo OMS API is running",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents/templates", templateRoutes); // Templates have their own route
app.use("/api/documents", documentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/employment-forms", employmentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/hiring", hiringRoutes);
if (process.env.NODE_ENV !== "production") {
  app.use("/api/dev", devRoutes);
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
