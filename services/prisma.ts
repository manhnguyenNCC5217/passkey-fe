import { PrismaClient, Prisma } from "@prisma/client";

export const prisma = new PrismaClient();

export const findOneByAuthUid = async (authId: string) => {
  return prisma.user.findUnique({
    where: {
      authId,
    },
  });
};

export const findUserWithDevicesByAuthUid = async (authId: string) => {
  return prisma.user.findUnique({
    where: {
      authId,
    },
    include: { devices: true },
  });
};

export const createUserByAuth = async (userData: Prisma.UserCreateInput) => {
  const user = prisma.user.create({ data: userData });
  return user;
};

export const createUserDevice = async (credData: any) => {
  const device = prisma.devices.create({ data: credData });

  return device;
};

export const updateUserDevice = async (
  deviceId: number,
  dateUpdate: { counter: number }
) => {
  const device = prisma.devices.update({
    where: { id: deviceId },
    data: dateUpdate,
  });

  return device;
};
