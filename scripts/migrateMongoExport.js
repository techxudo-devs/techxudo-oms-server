import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseDate = (value) => (value ? new Date(value) : null);
const toDecimal = (value) => new Prisma.Decimal(value ?? 0);

const loadExport = async (exportPath) => {
  const raw = await fs.readFile(exportPath, "utf-8");
  return JSON.parse(raw);
};

const main = async () => {
  const exportPath = process.argv[2] || path.join(__dirname, "mongo-export.json");
  const data = await loadExport(exportPath);

  await prisma.$transaction(async (tx) => {
    const departmentCreates = data.departments.map((dept) =>
      tx.department.create({
        data: {
          id: dept._id,
          organizationId: dept.organizationId,
          name: dept.name,
          description: dept.description || null,
          headOfDepartment: dept.headOfDepartment || null,
          createdAt: parseDate(dept.createdAt) || undefined,
          updatedAt: parseDate(dept.updatedAt) || undefined,
        },
      })
    );

    const employeeCreates = data.employees.map((employee) =>
      tx.employee.create({
        data: {
          id: employee._id,
          fullName: employee.fullName,
          email: employee.email,
          passwordHash: employee.passwordHash,
          role: employee.role || "employee",
          employeeId: employee.employeeId || null,
          designation: employee.designation || null,
          phone: employee.phone || null,
          joiningDate: parseDate(employee.joiningDate),
          salary: employee.salary ? toDecimal(employee.salary) : null,
          isActive: employee.isActive ?? true,
          isEmailVerified: employee.isEmailVerified ?? false,
          organizationId: employee.organizationId,
          departmentId: employee.departmentId || null,
          createdAt: parseDate(employee.createdAt) || undefined,
          updatedAt: parseDate(employee.updatedAt) || undefined,
        },
      })
    );

    const projectCreates = data.projects.map((project) =>
      tx.project.create({
        data: {
          id: project._id,
          organizationId: project.organizationId,
          name: project.name,
          description: project.description || null,
          status: project.status || "active",
          startDate: parseDate(project.startDate),
          endDate: parseDate(project.endDate),
          createdAt: parseDate(project.createdAt) || undefined,
          updatedAt: parseDate(project.updatedAt) || undefined,
        },
      })
    );

    const attendanceCreates = data.attendance.map((record) =>
      tx.attendance.create({
        data: {
          id: record._id,
          userId: record.userId,
          organizationId: record.organizationId,
          date: parseDate(record.date),
          checkIn: record.checkIn || undefined,
          checkOut: record.checkOut || undefined,
          hoursWorked: record.hoursWorked || 0,
          overtimeHours: record.overtimeHours || 0,
          status: record.status || "present",
          workType: record.workType || "office",
          lateArrival: record.lateArrival || undefined,
          earlyDeparture: record.earlyDeparture || undefined,
          isManualEntry: record.isManualEntry || false,
          markedById: record.markedBy || null,
          adminNotes: record.adminNotes || null,
          createdAt: parseDate(record.createdAt) || undefined,
          updatedAt: parseDate(record.updatedAt) || undefined,
        },
      })
    );

    const payrollCreates = data.payroll.map((payroll) =>
      tx.payroll.create({
        data: {
          id: payroll._id,
          userId: payroll.userId,
          organizationId: payroll.organizationId,
          month: payroll.month,
          year: payroll.year,
          baseSalary: toDecimal(payroll.baseSalary),
          incrementPreviousSalary: payroll.increment?.previousSalary
            ? toDecimal(payroll.increment.previousSalary)
            : null,
          incrementNewSalary: payroll.increment?.newSalary
            ? toDecimal(payroll.increment.newSalary)
            : null,
          incrementAmount: payroll.increment?.incrementAmount
            ? toDecimal(payroll.increment.incrementAmount)
            : null,
          incrementPercentage: payroll.increment?.incrementPercentage
            ? toDecimal(payroll.increment.incrementPercentage)
            : null,
          incrementEffectiveDate: parseDate(payroll.increment?.effectiveDate),
          incrementReason: payroll.increment?.reason || null,
          incrementApprovedById: payroll.increment?.approvedBy || null,
          attendanceTotalWorkingDays: payroll.attendanceDetails?.totalWorkingDays || 0,
          attendancePresentDays: payroll.attendanceDetails?.presentDays || 0,
          attendanceAbsentDays: payroll.attendanceDetails?.absentDays || 0,
          attendanceLateDays: payroll.attendanceDetails?.lateDays || 0,
          attendanceHalfDays: payroll.attendanceDetails?.halfDays || 0,
          attendanceOvertimeHours: toDecimal(payroll.attendanceDetails?.overtimeHours || 0),
          attendanceOvertimeAmount: toDecimal(payroll.attendanceDetails?.overtimeAmount || 0),
          totalAllowances: toDecimal(payroll.totalAllowances || 0),
          totalBonuses: toDecimal(payroll.totalBonuses || 0),
          totalDeductions: toDecimal(payroll.totalDeductions || 0),
          grossSalary: toDecimal(payroll.grossSalary || 0),
          netSalary: toDecimal(payroll.netSalary || 0),
          paymentStatus: payroll.paymentStatus || "pending",
          paymentDate: parseDate(payroll.paymentDate),
          paymentMethod: payroll.paymentMethod || "bank-transfer",
          transactionId: payroll.transactionId || null,
          notes: payroll.notes || null,
          adminNotes: payroll.adminNotes || null,
          acknowledged: payroll.acknowledged || false,
          acknowledgedAt: parseDate(payroll.acknowledgedAt),
          acknowledgedById: payroll.acknowledgedBy || null,
          createdById: payroll.createdBy || null,
          updatedById: payroll.updatedBy || null,
          isLocked: payroll.isLocked || false,
          lockedAt: parseDate(payroll.lockedAt),
          lockedById: payroll.lockedBy || null,
          createdAt: parseDate(payroll.createdAt) || undefined,
          updatedAt: parseDate(payroll.updatedAt) || undefined,
          allowances: {
            create: (payroll.allowances || []).map((allowance) => ({
              id: allowance._id,
              type: allowance.type,
              amount: toDecimal(allowance.amount || 0),
              description: allowance.description || null,
            })),
          },
          bonuses: {
            create: (payroll.bonuses || []).map((bonus) => ({
              id: bonus._id,
              type: bonus.type,
              amount: toDecimal(bonus.amount || 0),
              description: bonus.description || null,
              date: parseDate(bonus.date),
            })),
          },
          deductions: {
            create: (payroll.deductions || []).map((deduction) => ({
              id: deduction._id,
              type: deduction.type,
              amount: toDecimal(deduction.amount || 0),
              description: deduction.description || null,
            })),
          },
        },
      })
    );

    const projectAssignmentCreates = data.employeeProjects.map((assignment) =>
      tx.employeeProject.create({
        data: {
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          assignedAt: parseDate(assignment.assignedAt) || undefined,
        },
      })
    );

    await Promise.all([
      ...departmentCreates,
      ...employeeCreates,
      ...projectCreates,
      ...attendanceCreates,
      ...payrollCreates,
      ...projectAssignmentCreates,
    ]);
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
