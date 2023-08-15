import axios, { AxiosError } from "axios";
import { auth } from "@hooks/auth";

export class ApiError extends Error {
  status?: string;
  url?: string;
}

const AXIOS_REQUEST_TIMEOUT = 5000;

export const axiosClient = axios.create({
  timeout: AXIOS_REQUEST_TIMEOUT,
});

axiosClient.interceptors.request.use(async (config) => {
  config.headers.set("Content-Type", "application/json");
  const authJWTToken = (await auth.currentUser?.getIdToken()) || "";
  authJWTToken && config.headers.set("Authorization", authJWTToken);
  return config;
});

axiosClient.interceptors.response.use(
  async (res) => {
    return res;
  },
  (e: AxiosError) => {
    throw e;
  }
);
