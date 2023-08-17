import type { IronSessionOptions } from "iron-session";

export const ironOptions: IronSessionOptions = {
  cookieName: "passkeys",
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};
