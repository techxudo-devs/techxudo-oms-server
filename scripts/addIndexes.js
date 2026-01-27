import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";

dotenv.config();

async function addIndexes() {
  try {
    await connectDB();
    console.log("Adding indexes...");

    const db = mongoose.connection.db;

    // User indexes
    await db.collection("users").createIndex({ organizationId: 1, role: 1 });
    await db.collection("users").createIndex({ organizationId: 1, isActive: 1 });
    await db.collection("users").createIndex({ organizationId: 1, department: 1 });
    await db.collection("users").createIndex({ email: 1, organizationId: 1 });
    console.log("✅ User indexes created");

    // LeaveRequest indexes
    await db.collection("leaverequests").createIndex({ organizationId: 1, status: 1 });
    await db.collection("leaverequests").createIndex({ organizationId: 1, userId: 1 });
    await db.collection("leaverequests").createIndex({ organizationId: 1, createdAt: -1 });
    console.log("✅ LeaveRequest indexes created");

    // Document indexes
    await db.collection("documents").createIndex({ organizationId: 1, type: 1 });
    await db.collection("documents").createIndex({ organizationId: 1, userId: 1 });
    console.log("✅ Document indexes created");

    // DocumentRequest indexes
    await db.collection("documentrequests").createIndex({ organizationId: 1, status: 1 });
    await db.collection("documentrequests").createIndex({ organizationId: 1, userId: 1 });
    console.log("✅ DocumentRequest indexes created");

    // SalaryHistory indexes
    await db.collection("salaryhistories").createIndex({ organizationId: 1, userId: 1 });
    await db.collection("salaryhistories").createIndex({ organizationId: 1, month: 1, year: 1 });
    console.log("✅ SalaryHistory indexes created");

    // Attendance indexes
    await db.collection("attendances").createIndex({ organizationId: 1, date: -1 });
    await db.collection("attendances").createIndex({ organizationId: 1, userId: 1, date: -1 });
    console.log("✅ Attendance indexes created");

    // Hiring indexes
    await db.collection("candidates").createIndex({ organizationId: 1, email: 1 }, { unique: true });
    await db.collection("applications").createIndex({ organizationId: 1, stage: 1 });
    await db.collection("applications").createIndex({ organizationId: 1, createdAt: -1 });
    await db.collection("applications").createIndex({ organizationId: 1, positionTitle: 1 });
    console.log("✅ Hiring indexes created");

    console.log("\n✅ All indexes created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error adding indexes:", error);
    process.exit(1);
  }
}

addIndexes();

