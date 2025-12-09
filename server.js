import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startCronJobs } from "./services/cron/cronJobs.js";
import { startAttendanceCronJobs } from "./services/cron/attendanceCronJobs.js";
dotenv.config();

// Connect to MongoDB
connectDB();

// Start cron jobs
startCronJobs();
startAttendanceCronJobs();

import { initAppointmentSubscribers } from "./subscribers/appointmentSubscribers.js";

// Initialize subscribers
initAppointmentSubscribers();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
