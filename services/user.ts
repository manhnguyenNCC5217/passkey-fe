import { axiosClient } from "@lib/axiosClient";

export const getExistOrCreateUserId = async (): Promise<number> => {
  const response = await axiosClient.post("api/auth");

  return response.data;
};
