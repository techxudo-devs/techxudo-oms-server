import { Prisma } from "@prisma/client";

export const serializePrisma = (payload) =>
  JSON.parse(
    JSON.stringify(payload, (key, value) => {
      if (value instanceof Prisma.Decimal) {
        return value.toNumber();
      }
      return value;
    })
  );
