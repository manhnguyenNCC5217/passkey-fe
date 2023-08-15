import { decodeToken } from "@helpers/firebaseAuthService";
import { createUserByAuth, findOneByAuthUid } from "@helpers/prisma";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, headers } = req;

  switch (method) {
    case "POST":
      const token = headers["authorization"];

      const decodedToken = await decodeToken(token || "");
      const authUId = decodedToken?.uid;

      if (!authUId) {
        return res.status(404).json({ message: "User Not Found!" });
      }

      let user = await findOneByAuthUid(authUId);

      if (!user) {
        user = await createUserByAuth({
          authId: authUId,
          passkey: "",
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

export default handler;
