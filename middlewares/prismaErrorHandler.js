import { Prisma } from "@prisma/client";

const prismaErrorMessage = (error) => {
  if (error.code === "P2002") {
    const fields = error.meta?.target?.join(", ") || "field";
    return `${fields} already exists`;
  }
  if (error.code === "P2003") {
    return "Invalid reference for related record";
  }
  if (error.code === "P2025") {
    return "Record not found";
  }
  return "Database request failed";
};

export const prismaErrorHandler = (err, req, res, next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const statusCode = err.code === "P2002" ? 409 : 400;
    return res.status(statusCode).json({
      success: false,
      error: prismaErrorMessage(err),
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: "Invalid data payload",
    });
  }

  return next(err);
};
