import { decodeToken } from "@services/firebaseAuthService";
import { createUserByAuth, findOneByAuthUid } from "@services/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import { ironOptions } from "./config";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, headers } = req;

  switch (method) {
    case "POST":
      const token = headers["authorization"];

      const decodedToken = await decodeToken(token || "");
      const authUId = decodedToken?.uid;
      const email = decodedToken?.email;

      if (!authUId || !email) {
        return res.status(404).json({ message: "User Not Found!" });
      }

      let user = await findOneByAuthUid(authUId);

      if (!user) {
        user = await createUserByAuth({
          authId: authUId,
          email,
        });
      }

      return res.json({
        userId: user.id,
      });

    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default withIronSessionApiRoute(handler, ironOptions);
