import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export const findOneByAuthUid = async (authId: string) => {
  return prisma.user.findUnique({
    where: {
      authId,
    },
  });
};

export const createUserByAuth = async (userData: Prisma.UserCreateInput) => {
  const user = prisma.user.create({ data: userData });
  return user;
};
